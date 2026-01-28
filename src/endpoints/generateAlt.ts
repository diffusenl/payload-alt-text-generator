import type { PayloadHandler } from 'payload'
import type { AltTextGeneratorPluginOptions } from '../types'
import Anthropic from '@anthropic-ai/sdk'

export const generateAlt = (
  options: Required<AltTextGeneratorPluginOptions>
): PayloadHandler => {
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
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

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

      const imageBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')

      // Determine media type
      const contentType = imageResponse.headers.get('content-type') || ''
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' =
        'image/jpeg'

      if (contentType.includes('png')) mediaType = 'image/png'
      else if (contentType.includes('webp')) mediaType = 'image/webp'
      else if (contentType.includes('gif')) mediaType = 'image/gif'

      // Build prompt with replacements
      const prompt = options.prompt
        .replace(/{filename}/g, filename || 'unknown')
        .replace(/{maxLength}/g, String(options.maxLength))
        .replace(/{language}/g, options.language)

      const message = await anthropic.messages.create({
        model: options.model,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      })

      const suggestedAlt =
        message.content[0].type === 'text'
          ? message.content[0].text.trim().slice(0, options.maxLength)
          : ''

      return Response.json({
        id: imageId,
        filename,
        suggestedAlt,
        imageUrl,
      })
    } catch (error) {
      console.error('[alt-text-generator] Error generating alt text:', error)
      return Response.json(
        { error: 'Failed to generate alt text', details: String(error) },
        { status: 500 }
      )
    }
  }
}
