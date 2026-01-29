# payload-alt-text-generator

[![npm version](https://img.shields.io/npm/v/payload-alt-text-generator.svg)](https://www.npmjs.com/package/payload-alt-text-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

AI-powered alt text generation for Payload CMS 3.x using Claude Vision API.

Automatically generate accessible, SEO-friendly alt text for your images using Anthropic's Claude AI. Works with any image collection in Payload CMS.

## Features

- **Bulk Generation** - Process hundreds of images missing alt text in one click
- **Single Image Generation** - Generate alt text directly on individual media pages
- **Cancellable** - Cancel batch generation at any time, already-saved images are kept
- **Auto-resize** - Large images are automatically resized before processing
- **SVG Support** - SVG files get alt text derived from filename
- **Multi-language Support** - Generate alt text in any language
- **Smart Prompts** - Uses filename context for better results
- **Review & Edit** - Review AI suggestions before saving
- **Rate Limit Handling** - Automatic retry with exponential backoff
- **Auto-save** - Each image saves immediately after generation
- **Accessible UI** - Keyboard navigation, screen reader support, reduced motion

## Requirements

- Payload CMS 3.x
- React 18 or 19
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Installation

```bash
npm install payload-alt-text-generator
# or
yarn add payload-alt-text-generator
# or
pnpm add payload-alt-text-generator
```

## Quick Start

### 1. Add your Anthropic API key

```env
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Add the plugin to your Payload config

```typescript
import { buildConfig } from 'payload'
import { altTextGeneratorPlugin } from 'payload-alt-text-generator'

export default buildConfig({
  // ... your config
  plugins: [
    altTextGeneratorPlugin(),
  ],
})
```

### 3. Add the component to your import map

In your Payload config or import map file, ensure the plugin components are registered:

```typescript
// payload.config.ts
export default buildConfig({
  // ... your config
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  plugins: [
    altTextGeneratorPlugin(),
  ],
})
```

Then run:

```bash
npx payload generate:importmap
```

### 4. Start using it

- **Bulk generation**: Go to your Media collection list view and click "Generate Missing Alt Texts"
- **Single image**: Open any media item and click "Generate with AI" below the alt text field

## Configuration

All options are optional with sensible defaults:

```typescript
altTextGeneratorPlugin({
  // Collections to enable alt text generation on
  collections: ['media'],

  // Language for generated alt texts
  language: 'English',

  // Maximum characters for alt text
  maxLength: 80,

  // Images to process in parallel (for bulk generation)
  batchSize: 5,

  // Claude model to use
  model: 'claude-sonnet-4-20250514',

  // Field name for alt text in your collection
  altFieldName: 'alt',

  // Custom prompt (see below for details)
  prompt: '...',
})
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `collections` | `string[]` | `['media']` | Collection slugs to enable alt text generation on |
| `language` | `string` | `'English'` | Language for generated alt texts |
| `maxLength` | `number` | `80` | Maximum characters for generated alt text |
| `batchSize` | `number` | `5` | Number of images to process in parallel |
| `model` | `string` | `'claude-sonnet-4-20250514'` | Claude model for vision analysis |
| `altFieldName` | `string` | `'alt'` | Field name for alt text in your collection |
| `prompt` | `string` | See below | Custom prompt template for Claude |

## Multi-language Support

Generate alt texts in any language by setting the `language` option:

```typescript
altTextGeneratorPlugin({
  language: 'Dutch', // or 'German', 'French', 'Spanish', etc.
})
```

The AI will generate alt texts in the specified language.

## Custom Prompts

You can customize the prompt sent to Claude. Use these placeholders:

- `{filename}` - The image filename
- `{maxLength}` - The configured max length
- `{language}` - The configured language

### Default Prompt

```
Generate a short alt text for this image IN {language}. The filename is "{filename}".

Rules:
- Write in {language}
- Keep it short: aim for 5-10 words, max {maxLength} characters
- For logos: just use the company/brand name followed by "logo" (e.g. "Rivas Zorggroep logo")
- For icons or decorative images: say "decorative"
- For photos: briefly describe the key subject
- Don't start with "Image of", "Photo of", "Picture of" or translations thereof
- The filename often contains the subject — use it as a strong hint

Respond with ONLY the alt text, nothing else.
```

### Custom Prompt Example

```typescript
altTextGeneratorPlugin({
  prompt: `Describe this image for an e-commerce product listing in {language}.
The product name from the filename is: {filename}

Requirements:
- Max {maxLength} characters
- Focus on product features visible in the image
- Include color and material if visible
- Be specific and descriptive

Return ONLY the alt text.`,
})
```

## How It Works

### Bulk Generation (List View)

1. Navigate to your Media collection in the admin panel
2. Click the **"Generate Missing Alt Texts"** button (shows count of images needing alt text)
3. A modal opens displaying all images without alt text
4. Click **"Generate All"** to process all images
5. Review and edit suggestions inline if needed
6. Changes auto-save, or edit and blur to save individual changes

### Single Image Generation (Edit View)

1. Open any media document
2. Find the alt text field
3. Click **"Generate with AI"** below the field
4. The generated alt text fills the field automatically
5. Edit if needed, then save the document

## API Endpoints

The plugin adds these endpoints to your configured collections:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/{collection}/missing-alt` | GET | Get all images missing alt text |
| `/api/{collection}/generate-alt` | POST | Generate alt text for a single image |
| `/api/{collection}/save-alt` | POST | Save alt text for a single image |
| `/api/{collection}/save-bulk-alt` | POST | Save alt text for multiple images |

## Supported File Types

The plugin only processes image files:

- **Supported**: jpg, jpeg, png, gif, webp, avif, bmp, tiff, svg
- **Not supported**: Videos (mp4, mov), PDFs, documents, etc.

Non-image files are automatically filtered from the "missing alt text" list.

### Image Limitations

Large images are automatically handled:

- **File size > 4MB**: Resized to 1600×1600 max
- **Dimensions > 7500px**: Resized to 1600×1600 max
- **SVG files**: Alt text derived from filename (Claude doesn't support SVG)

## Performance

The plugin is optimized for performance:

- **Immediate saves**: Each image saves right after generation
- **Lazy thumbnails**: Modal thumbnails load on scroll
- **Efficient queries**: Only fetches required fields (`id`, `filename`, `url`, `alt`)
- **Smart batching**: Processes images in configurable batch sizes

## Accessibility

The plugin UI follows web accessibility guidelines:

- All interactive elements are keyboard accessible
- Proper ARIA labels on buttons and status indicators
- Respects `prefers-reduced-motion` for animations
- Focus management in modal dialogs
- Screen reader compatible status updates

## Troubleshooting

### "Generate with AI" button doesn't appear

- The button only shows when **editing** existing images, not when uploading new ones
- Make sure you've run `npx payload generate:importmap` after installing the plugin

### API returns 401 Unauthorized

The endpoints require authentication. Make sure you're logged into the Payload admin panel.

### Alt text is empty or generic

Try customizing the prompt to give Claude more context about your specific use case. The filename is used as a hint, so descriptive filenames help.

### Rate limiting (429 errors)

The plugin automatically retries rate-limited requests with exponential backoff (15s, 30s, 60s delays). If you're on Anthropic's free tier (5 requests/minute), set `batchSize: 1`:

```typescript
altTextGeneratorPlugin({
  batchSize: 1, // Avoid rate limits on free tier
})
```

### Large images fail

Images larger than 4MB or 7500px are automatically resized. If you still see errors, the image may be corrupted or in an unsupported format.

## TypeScript

The plugin exports its types:

```typescript
import type { AltTextGeneratorPluginOptions } from 'payload-alt-text-generator'

const options: AltTextGeneratorPluginOptions = {
  collections: ['media', 'products'],
  language: 'German',
}
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Credits

Built with [Payload CMS](https://payloadcms.com) and [Anthropic Claude](https://anthropic.com).
