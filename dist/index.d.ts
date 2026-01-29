import { Plugin } from 'payload';

type AIProvider = 'anthropic' | 'openai' | 'google';
interface AnthropicProviderConfig {
    provider: 'anthropic';
    apiKey?: string;
    model?: string;
}
interface OpenAIProviderConfig {
    provider: 'openai';
    apiKey?: string;
    model?: string;
}
interface GoogleProviderConfig {
    provider: 'google';
    apiKey?: string;
    model?: string;
}
type ProviderConfig = AnthropicProviderConfig | OpenAIProviderConfig | GoogleProviderConfig;
interface AltTextGeneratorPluginOptions {
    /**
     * Collection slugs to add alt-text generation to
     * @default ['media']
     */
    collections?: string[];
    /**
     * Custom prompt for AI vision API
     * Use {filename} as placeholder for the image filename
     */
    prompt?: string;
    /**
     * Maximum length for generated alt text
     * @default 125
     */
    maxLength?: number;
    /**
     * Number of images to process in parallel
     * @default 5
     */
    batchSize?: number;
    /**
     * AI provider configuration
     * @default { provider: 'openai' }
     */
    provider?: ProviderConfig;
    /**
     * AI model to use for vision
     * @default 'gpt-4o-mini'
     * @deprecated Use provider.model instead
     */
    model?: string;
    /**
     * Field name for alt text in your collection
     * @default 'alt'
     */
    altFieldName?: string;
    /**
     * Language for generated alt texts
     * @default 'English'
     */
    language?: string;
}
interface ImageWithoutAlt {
    id: string;
    filename: string;
    url: string;
    alt: string | null;
}
interface AltTextSuggestion {
    id: string;
    filename: string;
    imageUrl: string;
    suggestedAlt: string;
    status: 'pending' | 'generating' | 'ready' | 'saved' | 'error';
    error?: string;
}

declare const altTextGeneratorPlugin: (pluginOptions?: AltTextGeneratorPluginOptions) => Plugin;

export { type AIProvider, type AltTextGeneratorPluginOptions, type AltTextSuggestion, type AnthropicProviderConfig, type GoogleProviderConfig, type ImageWithoutAlt, type OpenAIProviderConfig, type ProviderConfig, altTextGeneratorPlugin };
