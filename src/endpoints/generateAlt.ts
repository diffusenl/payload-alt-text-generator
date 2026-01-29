import type { PayloadHandler } from 'payload'
import type { AltTextGeneratorPluginOptions } from '../types'
import type { AIVisionProvider } from '../providers/types'
import sharp from 'sharp'

/**
 * Derive alt text from filename for SVGs and other unsupported formats
 */
function deriveAltFromFilename(filename: string): string {
  // Remove path if present
  const basename = filename.split('/').pop() || filename

  // Remove extension
  const nameWithoutExt = basename.replace(/\.[^.]+$/, '')

  // Replace hyphens, underscores, and camelCase with spaces
  const spaced = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()

  // Clean up multiple spaces and trim
  const cleaned = spaced.replace(/\s+/g, ' ').trim()

  // Detect if it's likely an icon or logo
  const isIcon = /icon|ico$/i.test(nameWithoutExt)
  const isLogo = /logo/i.test(nameWithoutExt)

  if (isIcon && !cleaned.includes('icon')) {
    return `${cleaned} icon`
  }
  if (isLogo && !cleaned.includes('logo')) {
    return `${cleaned} logo`
  }

  return cleaned
}

export interface GenerateAltOptions extends Required<AltTextGeneratorPluginOptions> {
  aiProvider: AIVisionProvider
}

export const generateAlt = (
  options: GenerateAltOptions
): PayloadHandler => {
  const { aiProvider } = options

  return async (req) => {
    const { user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as {
      imageId?: string
      imageUrl?: string
      filename?: string
    }
    const { imageId, imageUrl, filename } = body

    if (!imageUrl) {
      return Response.json({ error: 'Image URL is required' }, { status: 400 })
    }

    try {
      // Check file extension
      const urlPath = imageUrl.split('?')[0].toLowerCase()
      const filenameLower = (filename || '').toLowerCase()
      const ext = filenameLower.split('.').pop() || urlPath.split('.').pop() || ''

      // Supported image formats
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tiff', 'tif', 'svg']
      const isImage = imageExtensions.includes(ext)

      if (!isImage) {
        return Response.json({
          error: 'Not an image',
          details: `File type ".${ext}" is not supported. Only images can have alt text generated.`,
        }, { status: 400 })
      }

      // SVGs: derive alt from filename instead of using Vision API
      const isSvg = ext === 'svg'

      if (isSvg) {
        const suggestedAlt = deriveAltFromFilename(filename || imageUrl)
        return Response.json({
          id: imageId,
          filename,
          suggestedAlt,
          imageUrl,
        })
      }

      // Build full URL if relative
      let fullImageUrl = imageUrl
      if (imageUrl.startsWith('/')) {
        const protocol = req.headers.get('x-forwarded-proto') || 'http'
        const host = req.headers.get('host') || 'localhost:3000'
        fullImageUrl = `${protocol}://${host}${imageUrl}`
      }

      // Fetch and convert image to base64
      const imageResponse = await fetch(fullImageUrl)

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }

      let imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
      let wasResized = false

      // Check image dimensions and file size
      const metadata = await sharp(imageBuffer).metadata()
      const MAX_SIZE = 4 * 1024 * 1024 // 4MB to leave headroom
      const MAX_DIMENSION = 7500 // Claude limit is 8000, leave some headroom

      const needsResize =
        imageBuffer.byteLength > MAX_SIZE ||
        (metadata.width && metadata.width > MAX_DIMENSION) ||
        (metadata.height && metadata.height > MAX_DIMENSION)

      if (needsResize) {
        imageBuffer = await sharp(imageBuffer)
          .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()
        wasResized = true
      }

      const base64Data = imageBuffer.toString('base64')

      // Determine media type (jpeg if we resized, otherwise from content-type)
      const contentType = imageResponse.headers.get('content-type') || ''
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'

      if (!wasResized) {
        if (contentType.includes('png')) mediaType = 'image/png'
        else if (contentType.includes('webp')) mediaType = 'image/webp'
        else if (contentType.includes('gif')) mediaType = 'image/gif'
      }

      // Build prompt with replacements
      let prompt = options.prompt
        .replace(/{filename}/g, filename || 'unknown')
        .replace(/{maxLength}/g, String(options.maxLength))
        .replace(/{language}/g, options.language)

      // Append extended prompt if provided
      if (options.extendPrompt) {
        const extendedPart = options.extendPrompt
          .replace(/{filename}/g, filename || 'unknown')
          .replace(/{maxLength}/g, String(options.maxLength))
          .replace(/{language}/g, options.language)
        prompt = `${prompt}\n\n${extendedPart}`
      }

      // Call the AI provider
      const result = await aiProvider.generateAltText({
        image: { base64Data, mediaType },
        prompt,
        maxLength: options.maxLength,
      })

      return Response.json({
        id: imageId,
        filename,
        suggestedAlt: result.altText,
        imageUrl,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[alt-text-generator] Error generating alt text:', errorMessage)
      return Response.json(
        { error: 'Failed to generate alt text', details: errorMessage },
        { status: 500 }
      )
    }
  }
}
