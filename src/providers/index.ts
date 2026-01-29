import type { ProviderConfig } from '../types'
import type { AIVisionProvider } from './types'
import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'

export type { AIVisionProvider, ImageInput, GenerateAltTextParams } from './types'

export function createProvider(config?: ProviderConfig): AIVisionProvider {
  if (!config) {
    return new OpenAIProvider()
  }

  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider({
        apiKey: config.apiKey,
        model: config.model,
      })

    case 'openai':
      return new OpenAIProvider({
        apiKey: config.apiKey,
        model: config.model,
      })

    case 'google': {
      // Lazy load Google provider to avoid requiring @ai-sdk/google when not used
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GoogleProvider } = require('./google')
      return new GoogleProvider({
        apiKey: config.apiKey,
        model: config.model,
      })
    }

    default: {
      const exhaustiveCheck: never = config
      throw new Error(`Unknown provider: ${(exhaustiveCheck as ProviderConfig).provider}`)
    }
  }
}
