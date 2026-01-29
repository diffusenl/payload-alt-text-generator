import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { AIVisionProvider, GenerateAltTextParams } from './types'

export interface OpenAIProviderOptions {
  apiKey?: string
  model?: string
}

const DEFAULT_MODEL = 'gpt-4o'

export class OpenAIProvider implements AIVisionProvider {
  readonly name = 'openai'
  private apiKey?: string
  private model: string

  constructor(options: OpenAIProviderOptions = {}) {
    this.apiKey = options.apiKey
    this.model = options.model ?? DEFAULT_MODEL
  }

  async generateAltText(params: GenerateAltTextParams): Promise<{ altText: string }> {
    const { image, prompt, maxLength } = params

    const openai = createOpenAI({
      apiKey: this.apiKey ?? process.env.OPENAI_API_KEY,
    })

    // Retry with exponential backoff for rate limits
    let result
    let retries = 0
    const maxRetries = 3

    while (retries <= maxRetries) {
      try {
        result = await generateText({
          model: openai(this.model),
          maxOutputTokens: 100,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  image: `data:${image.mediaType};base64,${image.base64Data}`,
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
        })
        break
      } catch (err) {
        const isRateLimit = err instanceof Error && (
          err.message.includes('429') ||
          err.message.includes('rate limit')
        )
        if (isRateLimit && retries < maxRetries) {
          const delay = Math.pow(2, retries) * 15000 // 15s, 30s, 60s
          await new Promise(resolve => setTimeout(resolve, delay))
          retries++
        } else {
          throw err
        }
      }
    }

    const altText = result!.text.trim().slice(0, maxLength)
    return { altText }
  }
}
