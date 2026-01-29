import type { PayloadHandler } from 'payload'
import type { AltTextGeneratorPluginOptions } from '../types'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tiff', 'tif', 'svg']

function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return IMAGE_EXTENSIONS.includes(ext)
}

export const getMissingAlt = (
  options: Required<AltTextGeneratorPluginOptions>
): PayloadHandler => {
  return async (req) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collectionSlug =
      (req.routeParams?.collection as string) || options.collections[0]

    // Check if we only need the count (for badge display)
    const countOnly = req.searchParams?.get('countOnly') === 'true'

    try {
      const whereClause = {
        or: [
          { [options.altFieldName]: { equals: '' } },
          { [options.altFieldName]: { equals: null } },
          { [options.altFieldName]: { exists: false } },
        ],
      }

      if (countOnly) {
        // Fetch filenames to filter by image type
        const files = await payload.find({
          collection: collectionSlug,
          where: whereClause,
          limit: 500,
          depth: 0,
          select: { filename: true },
        })
        const imageCount = files.docs.filter((doc: Record<string, unknown>) => {
          const filename = doc.filename as string
          return filename && isImageFile(filename)
        }).length
        return Response.json({ totalDocs: imageCount })
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
          [options.altFieldName]: true,
        },
      })

      // Filter to only include image files
      const imageDocs = images.docs
        .filter((img: Record<string, unknown>) => {
          const filename = img.filename as string
          return filename && isImageFile(filename)
        })
        .map((img: Record<string, unknown>) => ({
          id: img.id,
          filename: img.filename,
          url: img.url,
          alt: (img[options.altFieldName] as string) || null,
        }))

      return Response.json({
        docs: imageDocs,
        totalDocs: imageDocs.length,
      })
    } catch (error) {
      console.error('[alt-text-generator] Error fetching images:', error)
      return Response.json({ error: 'Failed to fetch images' }, { status: 500 })
    }
  }
}
