export interface ImageInput {
  base64Data: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

export interface GenerateAltTextParams {
  image: ImageInput
  prompt: string
  maxLength: number
}

export interface AIVisionProvider {
  readonly name: string
  generateAltText(params: GenerateAltTextParams): Promise<{ altText: string }>
}
