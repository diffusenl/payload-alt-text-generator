import type { ProviderConfig } from '../types'
import type { AIVisionProvider } from './types'
import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'
import { GoogleProvider } from './google'

export type { AIVisionProvider, ImageInput, GenerateAltTextParams } from './types'

export function createProvider(config?: ProviderConfig): AIVisionProvider {
  if (!config) {
    return new AnthropicProvider()
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

    case 'google':
      return new GoogleProvider({
        apiKey: config.apiKey,
        model: config.model,
      })

    default: {
      const exhaustiveCheck: never = config
      throw new Error(`Unknown provider: ${(exhaustiveCheck as ProviderConfig).provider}`)
    }
  }
}
