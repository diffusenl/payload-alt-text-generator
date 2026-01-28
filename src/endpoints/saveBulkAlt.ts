import type { PayloadHandler } from 'payload'
import type { AltTextGeneratorPluginOptions } from '../types'

export const saveBulkAlt = (
  options: Required<AltTextGeneratorPluginOptions>
): PayloadHandler => {
  return async (req) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as {
      updates?: Array<{ id: string; alt: string }>
      collectionSlug?: string
    }
    const { updates, collectionSlug } = body

    if (!updates || !Array.isArray(updates)) {
      return Response.json(
        { error: 'Updates array is required' },
        { status: 400 }
      )
    }

    const collection = collectionSlug || options.collections[0]
    const results = { success: [] as string[], failed: [] as string[] }

    // Process updates in parallel for better performance
    const updatePromises = updates.map(async (update) => {
      try {
        await payload.update({
          collection,
          id: update.id,
          data: {
            [options.altFieldName]: update.alt,
          },
        })
        return { id: update.id, success: true }
      } catch (error) {
        console.error(
          `[alt-text-generator] Failed to update ${update.id}:`,
          error
        )
        return { id: update.id, success: false }
      }
    })

    const settled = await Promise.all(updatePromises)

    for (const result of settled) {
      if (result.success) {
        results.success.push(result.id)
      } else {
        results.failed.push(result.id)
      }
    }

    return Response.json(results)
  }
}
