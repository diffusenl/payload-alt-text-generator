import type { PayloadHandler } from 'payload'
import type { AltTextGeneratorPluginOptions } from '../types'

export const saveAlt = (
  options: Required<AltTextGeneratorPluginOptions>
): PayloadHandler => {
  return async (req) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json?.()) as {
      imageId?: string
      altText?: string
      collectionSlug?: string
    }
    const { imageId, altText, collectionSlug } = body

    if (!imageId || altText === undefined) {
      return Response.json(
        { error: 'Image ID and alt text are required' },
        { status: 400 }
      )
    }

    const collection = collectionSlug || options.collections[0]

    try {
      await payload.update({
        collection,
        id: imageId,
        data: {
          [options.altFieldName]: altText,
        },
      })

      return Response.json({ success: true, id: imageId })
    } catch (error) {
      console.error('[alt-text-generator] Error saving alt text:', error)
      return Response.json({ error: 'Failed to save alt text' }, { status: 500 })
    }
  }
}
