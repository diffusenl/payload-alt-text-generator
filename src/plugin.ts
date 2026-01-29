import type { Config, Plugin } from 'payload'
import type { AltTextGeneratorPluginOptions, ProviderConfig } from './types'
import { getMissingAlt } from './endpoints/getMissingAlt'
import { generateAlt } from './endpoints/generateAlt'
import { saveAlt } from './endpoints/saveAlt'
import { saveBulkAlt } from './endpoints/saveBulkAlt'
import { createProvider } from './providers'

interface InternalOptions extends Required<AltTextGeneratorPluginOptions> {
  provider: ProviderConfig
}

const defaultOptions: InternalOptions = {
  collections: ['media'],
  prompt: `Generate a short alt text for this image IN {language}. The filename is "{filename}".

Rules:
- Write in {language}
- Keep it short: aim for 5-10 words, max {maxLength} characters
- For logos: just use the company/brand name followed by "logo" (e.g. "Rivas Zorggroep logo")
- For icons or decorative images: say "decorative"
- For photos: briefly describe the key subject
- Don't start with "Image of", "Photo of", "Picture of" or translations thereof
- The filename often contains the subject — use it as a strong hint

Respond with ONLY the alt text, nothing else.`,
  maxLength: 80,
  batchSize: 5,
  model: 'gpt-4o-mini',
  altFieldName: 'alt',
  language: 'English',
  provider: { provider: 'openai' },
}

/**
 * Resolve provider configuration with backwards compatibility
 */
function resolveProviderConfig(pluginOptions: AltTextGeneratorPluginOptions): ProviderConfig {
  // If explicit provider config is provided, use it
  if (pluginOptions.provider) {
    return pluginOptions.provider
  }

  // Backwards compatibility: if only model is specified, detect provider from model name
  if (pluginOptions.model) {
    console.warn(
      '[alt-text-generator] The "model" option is deprecated. Use "provider: { provider: \'...\', model: \'...\' }" instead.'
    )
    // Detect provider from model name
    if (pluginOptions.model.startsWith('claude')) {
      return { provider: 'anthropic', model: pluginOptions.model }
    } else if (pluginOptions.model.startsWith('gemini')) {
      return { provider: 'google', model: pluginOptions.model }
    }
    return { provider: 'openai', model: pluginOptions.model }
  }

  // Default to OpenAI (most cost-effective)
  return { provider: 'openai' }
}

export const altTextGeneratorPlugin = (
  pluginOptions: AltTextGeneratorPluginOptions = {}
): Plugin => {
  const providerConfig = resolveProviderConfig(pluginOptions)
  const options: InternalOptions = {
    ...defaultOptions,
    ...pluginOptions,
    provider: providerConfig,
  }

  // Create the AI provider instance
  const aiProvider = createProvider(providerConfig)

  return (incomingConfig: Config): Config => {
    // Find and modify the specified collections
    const collections = (incomingConfig.collections || []).map((collection) => {
      if (!options.collections.includes(collection.slug)) {
        return collection
      }

      // Add GenerateAltButton as afterInput on the alt field
      const fields = (collection.fields || []).map((field) => {
        if (!('name' in field) || field.name !== options.altFieldName) {
          return field
        }

        const existingAdmin = 'admin' in field ? (field.admin || {}) : {}
        const existingComponents = ('components' in existingAdmin ? existingAdmin.components : {}) || {}
        const existingAfterInput = ('afterInput' in existingComponents && Array.isArray(existingComponents.afterInput))
          ? existingComponents.afterInput
          : []

        return {
          ...field,
          admin: {
            ...existingAdmin,
            components: {
              ...existingComponents,
              afterInput: [
                ...existingAfterInput,
                {
                  path: '@diffusenl/payload-alt-text-generator/components#GenerateAltButton',
                  clientProps: {
                    collectionSlug: collection.slug,
                    altFieldName: options.altFieldName,
                  },
                },
              ],
            },
          },
        } as typeof field
      })

      return {
        ...collection,
        fields,
        endpoints: [
          ...(collection.endpoints || []),
          {
            path: '/missing-alt',
            method: 'get' as const,
            handler: getMissingAlt(options),
          },
          {
            path: '/generate-alt',
            method: 'post' as const,
            handler: generateAlt({ ...options, aiProvider }),
          },
          {
            path: '/save-alt',
            method: 'post' as const,
            handler: saveAlt(options),
          },
          {
            path: '/save-bulk-alt',
            method: 'post' as const,
            handler: saveBulkAlt(options),
          },
        ],
        admin: {
          ...collection.admin,
          components: {
            ...collection.admin?.components,
            beforeListTable: [
              ...(collection.admin?.components?.beforeListTable || []),
              {
                path: '@diffusenl/payload-alt-text-generator/components#AltTextGenerator',
                clientProps: {
                  collectionSlug: collection.slug,
                  options: {
                    batchSize: options.batchSize,
                    altFieldName: options.altFieldName,
                  },
                },
              },
            ],
          },
        },
      }
    })

    return {
      ...incomingConfig,
      collections,
    }
  }
}
