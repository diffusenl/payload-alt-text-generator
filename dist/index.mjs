// src/endpoints/getMissingAlt.ts
var IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "tiff", "tif", "svg"];
function isImageFile(filename) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.includes(ext);
}
var getMissingAlt = (options) => {
  return async (req) => {
    const { payload, user } = req;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const collectionSlug = req.routeParams?.collection || options.collections[0];
    const countOnly = req.searchParams?.get("countOnly") === "true";
    try {
      const whereClause = {
        or: [
          { [options.altFieldName]: { equals: "" } },
          { [options.altFieldName]: { equals: null } },
          { [options.altFieldName]: { exists: false } }
        ]
      };
      if (countOnly) {
        const files = await payload.find({
          collection: collectionSlug,
          where: whereClause,
          limit: 500,
          depth: 0,
          select: { filename: true }
        });
        const imageCount = files.docs.filter((doc) => {
          const filename = doc.filename;
          return filename && isImageFile(filename);
        }).length;
        return Response.json({ totalDocs: imageCount });
      }
      const images = await payload.find({
        collection: collectionSlug,
        where: whereClause,
        limit: 500,
        depth: 0,
        select: {
          id: true,
          filename: true,
          url: true,
          [options.altFieldName]: true
        }
      });
      const imageDocs = images.docs.filter((img) => {
        const filename = img.filename;
        return filename && isImageFile(filename);
      }).map((img) => ({
        id: img.id,
        filename: img.filename,
        url: img.url,
        alt: img[options.altFieldName] || null
      }));
      return Response.json({
        docs: imageDocs,
        totalDocs: imageDocs.length
      });
    } catch (error) {
      console.error("[alt-text-generator] Error fetching images:", error);
      return Response.json({ error: "Failed to fetch images" }, { status: 500 });
    }
  };
};

// src/endpoints/generateAlt.ts
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
function deriveAltFromFilename(filename) {
  const basename = filename.split("/").pop() || filename;
  const nameWithoutExt = basename.replace(/\.[^.]+$/, "");
  const spaced = nameWithoutExt.replace(/[-_]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  const cleaned = spaced.replace(/\s+/g, " ").trim();
  const isIcon = /icon|ico$/i.test(nameWithoutExt);
  const isLogo = /logo/i.test(nameWithoutExt);
  if (isIcon && !cleaned.includes("icon")) {
    return `${cleaned} icon`;
  }
  if (isLogo && !cleaned.includes("logo")) {
    return `${cleaned} logo`;
  }
  return cleaned;
}
var generateAlt = (options) => {
  return async (req) => {
    const { user } = req;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { imageId, imageUrl, filename } = body;
    if (!imageUrl) {
      return Response.json({ error: "Image URL is required" }, { status: 400 });
    }
    try {
      const urlPath = imageUrl.split("?")[0].toLowerCase();
      const filenameLower = (filename || "").toLowerCase();
      const ext = filenameLower.split(".").pop() || urlPath.split(".").pop() || "";
      const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "tiff", "tif", "svg"];
      const isImage = imageExtensions.includes(ext);
      if (!isImage) {
        return Response.json({
          error: "Not an image",
          details: `File type ".${ext}" is not supported. Only images can have alt text generated.`
        }, { status: 400 });
      }
      const isSvg = ext === "svg";
      if (isSvg) {
        const suggestedAlt2 = deriveAltFromFilename(filename || imageUrl);
        return Response.json({
          id: imageId,
          filename,
          suggestedAlt: suggestedAlt2,
          imageUrl
        });
      }
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      let fullImageUrl = imageUrl;
      if (imageUrl.startsWith("/")) {
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host") || "localhost:3000";
        fullImageUrl = `${protocol}://${host}${imageUrl}`;
      }
      const imageResponse = await fetch(fullImageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      let wasResized = false;
      const metadata = await sharp(imageBuffer).metadata();
      const MAX_SIZE = 4 * 1024 * 1024;
      const MAX_DIMENSION = 7500;
      const needsResize = imageBuffer.byteLength > MAX_SIZE || metadata.width && metadata.width > MAX_DIMENSION || metadata.height && metadata.height > MAX_DIMENSION;
      if (needsResize) {
        imageBuffer = await sharp(imageBuffer).resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
        wasResized = true;
      }
      const base64Image = imageBuffer.toString("base64");
      const contentType = imageResponse.headers.get("content-type") || "";
      let mediaType = "image/jpeg";
      if (!wasResized) {
        if (contentType.includes("png")) mediaType = "image/png";
        else if (contentType.includes("webp")) mediaType = "image/webp";
        else if (contentType.includes("gif")) mediaType = "image/gif";
      }
      const prompt = options.prompt.replace(/{filename}/g, filename || "unknown").replace(/{maxLength}/g, String(options.maxLength)).replace(/{language}/g, options.language);
      let message;
      let retries = 0;
      const maxRetries = 3;
      while (retries <= maxRetries) {
        try {
          message = await anthropic.messages.create({
            model: options.model,
            max_tokens: 100,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: mediaType,
                      data: base64Image
                    }
                  },
                  {
                    type: "text",
                    text: prompt
                  }
                ]
              }
            ]
          });
          break;
        } catch (err) {
          const isRateLimit = err instanceof Error && err.message.includes("429");
          if (isRateLimit && retries < maxRetries) {
            const delay = Math.pow(2, retries) * 15e3;
            await new Promise((resolve) => setTimeout(resolve, delay));
            retries++;
          } else {
            throw err;
          }
        }
      }
      const suggestedAlt = message.content[0].type === "text" ? message.content[0].text.trim().slice(0, options.maxLength) : "";
      return Response.json({
        id: imageId,
        filename,
        suggestedAlt,
        imageUrl
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[alt-text-generator] Error generating alt text:", errorMessage);
      return Response.json(
        { error: "Failed to generate alt text", details: errorMessage },
        { status: 500 }
      );
    }
  };
};

// src/endpoints/saveAlt.ts
var saveAlt = (options) => {
  return async (req) => {
    const { payload, user } = req;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { imageId, altText, collectionSlug } = body;
    if (!imageId || altText === void 0) {
      return Response.json(
        { error: "Image ID and alt text are required" },
        { status: 400 }
      );
    }
    const collection = collectionSlug || options.collections[0];
    try {
      await payload.update({
        collection,
        id: imageId,
        data: {
          [options.altFieldName]: altText
        }
      });
      return Response.json({ success: true, id: imageId });
    } catch (error) {
      console.error("[alt-text-generator] Error saving alt text:", error);
      return Response.json({ error: "Failed to save alt text" }, { status: 500 });
    }
  };
};

// src/endpoints/saveBulkAlt.ts
var saveBulkAlt = (options) => {
  return async (req) => {
    const { payload, user } = req;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { updates, collectionSlug } = body;
    if (!updates || !Array.isArray(updates)) {
      return Response.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }
    const collection = collectionSlug || options.collections[0];
    const results = { success: [], failed: [] };
    const updatePromises = updates.map(async (update) => {
      try {
        await payload.update({
          collection,
          id: update.id,
          data: {
            [options.altFieldName]: update.alt
          }
        });
        return { id: update.id, success: true };
      } catch (error) {
        console.error(
          `[alt-text-generator] Failed to update ${update.id}:`,
          error
        );
        return { id: update.id, success: false };
      }
    });
    const settled = await Promise.all(updatePromises);
    for (const result of settled) {
      if (result.success) {
        results.success.push(result.id);
      } else {
        results.failed.push(result.id);
      }
    }
    return Response.json(results);
  };
};

// src/plugin.ts
var defaultOptions = {
  collections: ["media"],
  prompt: `Generate a short alt text for this image IN {language}. The filename is "{filename}".

Rules:
- Write in {language}
- Keep it short: aim for 5-10 words, max {maxLength} characters
- For logos: just use the company/brand name followed by "logo" (e.g. "Rivas Zorggroep logo")
- For icons or decorative images: say "decorative"
- For photos: briefly describe the key subject
- Don't start with "Image of", "Photo of", "Picture of" or translations thereof
- The filename often contains the subject \u2014 use it as a strong hint

Respond with ONLY the alt text, nothing else.`,
  maxLength: 80,
  batchSize: 5,
  model: "claude-sonnet-4-20250514",
  altFieldName: "alt",
  language: "English"
};
var altTextGeneratorPlugin = (pluginOptions = {}) => {
  const options = { ...defaultOptions, ...pluginOptions };
  return (incomingConfig) => {
    const collections = (incomingConfig.collections || []).map((collection) => {
      if (!options.collections.includes(collection.slug)) {
        return collection;
      }
      const fields = (collection.fields || []).map((field) => {
        if (!("name" in field) || field.name !== options.altFieldName) {
          return field;
        }
        const existingAdmin = "admin" in field ? field.admin || {} : {};
        const existingComponents = ("components" in existingAdmin ? existingAdmin.components : {}) || {};
        const existingAfterInput = "afterInput" in existingComponents && Array.isArray(existingComponents.afterInput) ? existingComponents.afterInput : [];
        return {
          ...field,
          admin: {
            ...existingAdmin,
            components: {
              ...existingComponents,
              afterInput: [
                ...existingAfterInput,
                {
                  path: "@diffusenl/payload-alt-text-generator/components#GenerateAltButton",
                  clientProps: {
                    collectionSlug: collection.slug,
                    altFieldName: options.altFieldName
                  }
                }
              ]
            }
          }
        };
      });
      return {
        ...collection,
        fields,
        endpoints: [
          ...collection.endpoints || [],
          {
            path: "/missing-alt",
            method: "get",
            handler: getMissingAlt(options)
          },
          {
            path: "/generate-alt",
            method: "post",
            handler: generateAlt(options)
          },
          {
            path: "/save-alt",
            method: "post",
            handler: saveAlt(options)
          },
          {
            path: "/save-bulk-alt",
            method: "post",
            handler: saveBulkAlt(options)
          }
        ],
        admin: {
          ...collection.admin,
          components: {
            ...collection.admin?.components,
            beforeListTable: [
              ...collection.admin?.components?.beforeListTable || [],
              {
                path: "@diffusenl/payload-alt-text-generator/components#AltTextGenerator",
                clientProps: {
                  collectionSlug: collection.slug,
                  options: {
                    batchSize: options.batchSize,
                    altFieldName: options.altFieldName
                  }
                }
              }
            ]
          }
        }
      };
    });
    return {
      ...incomingConfig,
      collections
    };
  };
};
export {
  altTextGeneratorPlugin
};
//# sourceMappingURL=index.mjs.map