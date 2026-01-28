export interface AltTextGeneratorPluginOptions {
  /**
   * Collection slugs to add alt-text generation to
   * @default ['media']
   */
  collections?: string[]

  /**
   * Custom prompt for Claude vision API
   * Use {filename} as placeholder for the image filename
   */
  prompt?: string

  /**
   * Maximum length for generated alt text
   * @default 125
   */
  maxLength?: number

  /**
   * Number of images to process in parallel
   * @default 5
   */
  batchSize?: number

  /**
   * Claude model to use for vision
   * @default 'claude-sonnet-4-20250514'
   */
  model?: string

  /**
   * Field name for alt text in your collection
   * @default 'alt'
   */
  altFieldName?: string

  /**
   * Language for generated alt texts
   * @default 'English'
   */
  language?: string
}

export interface ImageWithoutAlt {
  id: string
  filename: string
  url: string
  alt: string | null
}

export interface AltTextSuggestion {
  id: string
  filename: string
  imageUrl: string
  suggestedAlt: string
  status: 'pending' | 'generating' | 'ready' | 'saved' | 'error'
  error?: string
}
