import type { PayloadHandler } from 'payload'
import type { AltTextGeneratorPluginOptions } from '../types'

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

    try {
      const images = await payload.find({
        collection: collectionSlug,
        where: {
          or: [
            { [options.altFieldName]: { equals: '' } },
            { [options.altFieldName]: { equals: null } },
            { [options.altFieldName]: { exists: false } },
          ],
        },
        limit: 500,
        depth: 0,
        select: {
          id: true,
          filename: true,
          url: true,
          [options.altFieldName]: true,
        },
      })

      return Response.json({
        docs: images.docs.map((img: Record<string, unknown>) => ({
          id: img.id,
          filename: img.filename,
          url: img.url,
          alt: (img[options.altFieldName] as string) || null,
        })),
        totalDocs: images.totalDocs,
      })
    } catch (error) {
      console.error('[alt-text-generator] Error fetching images:', error)
      return Response.json({ error: 'Failed to fetch images' }, { status: 500 })
    }
  }
}
