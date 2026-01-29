# @diffusenl/payload-alt-text-generator

[![npm version](https://img.shields.io/npm/v/@diffusenl/payload-alt-text-generator.svg)](https://www.npmjs.com/package/@diffusenl/payload-alt-text-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

AI-powered alt text generation for Payload CMS 3.x with multi-provider support.

Automatically generate accessible, SEO-friendly alt text for your images using your choice of AI provider: **Anthropic Claude**, **OpenAI GPT-4**, or **Google Gemini**. Works with any image collection in Payload CMS.

## Features

- **Multi-Provider Support** - Choose from Anthropic Claude, OpenAI GPT-4, or Google Gemini
- **Bulk Generation** - Process hundreds of images missing alt text in one click
- **Single Image Generation** - Generate alt text directly on individual media pages
- **Cancellable** - Cancel batch generation at any time, already-saved images are kept
- **Auto-resize** - Large images are automatically resized before processing
- **SVG Support** - SVG files get alt text derived from filename
- **Multi-language Support** - Generate alt text in any language
- **Smart Prompts** - Uses filename context for better results
- **Review & Edit** - Review AI suggestions before saving
- **Manual Save Control** - Generate all, review, then save individually or all at once
- **Rate Limit Handling** - Automatic retry with exponential backoff
- **Extend Prompt** - Add custom context to the default prompt without replacing it
- **Accessible UI** - Keyboard navigation, screen reader support, reduced motion

## Requirements

- Payload CMS 3.x
- React 18 or 19
- API key for your chosen provider:
  - **OpenAI** (default): [Get API key](https://platform.openai.com/api-keys)
  - **Anthropic**: [Get API key](https://console.anthropic.com/)
  - **Google Gemini**: [Get API key](https://aistudio.google.com/apikey)

## Installation

```bash
npm install @diffusenl/payload-alt-text-generator
# or
yarn add @diffusenl/payload-alt-text-generator
# or
pnpm add @diffusenl/payload-alt-text-generator
```

## Quick Start

### 1. Add your API key

Set the environment variable for your chosen provider:

```env
# OpenAI (default)
OPENAI_API_KEY=sk-...

# Or Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Or Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### 2. Add the plugin to your Payload config

```typescript
import { buildConfig } from 'payload'
import { altTextGeneratorPlugin } from '@diffusenl/payload-alt-text-generator'

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

  // AI provider configuration (see "AI Providers" section below)
  provider: { provider: 'openai' },

  // Language for generated alt texts
  language: 'English',

  // Maximum characters for alt text
  maxLength: 80,

  // Images to process in parallel (for bulk generation)
  batchSize: 5,

  // Field name for alt text in your collection
  altFieldName: 'alt',

  // Custom prompt (see below for details)
  prompt: '...',

  // Extra context to append to the default prompt
  extendPrompt: 'This is a healthcare website. Use formal tone.',
})
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `collections` | `string[]` | `['media']` | Collection slugs to enable alt text generation on |
| `provider` | `ProviderConfig` | `{ provider: 'openai' }` | AI provider configuration (see below) |
| `language` | `string` | `'English'` | Language for generated alt texts |
| `maxLength` | `number` | `80` | Maximum characters for generated alt text |
| `batchSize` | `number` | `5` | Number of images to process in parallel |
| `altFieldName` | `string` | `'alt'` | Field name for alt text in your collection |
| `prompt` | `string` | See below | Custom prompt template for the AI |
| `extendPrompt` | `string` | `''` | Additional context appended to the default prompt |

## AI Providers

The plugin uses the [Vercel AI SDK](https://sdk.vercel.ai/) for unified multi-provider support. OpenAI and Anthropic are included by default; Google Gemini requires installing the AI SDK adapter.

### OpenAI GPT-4 (Default)

Uses GPT-4's vision capabilities. No additional installation needed. This is the default provider as it offers the best cost-to-quality ratio with `gpt-4o-mini`.

```typescript
altTextGeneratorPlugin({
  provider: {
    provider: 'openai',
    model: 'gpt-4o-mini', // optional, this is the default
    apiKey: process.env.OPENAI_API_KEY, // optional, uses env var by default
  },
})
```

**Environment variable:** `OPENAI_API_KEY`

**Available models:** `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`, etc.

### Anthropic Claude

Uses Claude's vision capabilities. No additional installation needed.

```typescript
altTextGeneratorPlugin({
  provider: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514', // optional, this is the default for Anthropic
    apiKey: process.env.ANTHROPIC_API_KEY, // optional, uses env var by default
  },
})
```

**Environment variable:** `ANTHROPIC_API_KEY`

**Available models:** `claude-sonnet-4-20250514`, `claude-opus-4-20250514`, `claude-haiku-3-20240307`, etc.

### Google Gemini

Uses Gemini's vision capabilities. Requires the AI SDK Google adapter.

```bash
npm install @ai-sdk/google
```

```typescript
altTextGeneratorPlugin({
  provider: {
    provider: 'google',
    model: 'gemini-1.5-flash', // optional, this is the default for Google
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY, // optional, uses env var by default
  },
})
```

**Environment variable:** `GOOGLE_GENERATIVE_AI_API_KEY`

**Available models:** `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, etc.

### Provider Comparison

| Provider | Default Model | Speed | Cost | Best For |
|----------|---------------|-------|------|----------|
| OpenAI (default) | gpt-4o-mini | Fast | Low | Best cost-to-quality ratio |
| Anthropic | claude-sonnet-4-20250514 | Fast | Medium | High quality descriptions |
| Google | gemini-1.5-flash | Very Fast | Low | High volume processing |

## Multi-language Support

Generate alt texts in any language by setting the `language` option:

```typescript
altTextGeneratorPlugin({
  language: 'Dutch', // or 'German', 'French', 'Spanish', etc.
})
```

The AI will generate alt texts in the specified language.

## Custom Prompts

You can customize the prompt sent to the AI. Use these placeholders:

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

### Extending the Default Prompt

Use `extendPrompt` to add extra context without replacing the default prompt:

```typescript
altTextGeneratorPlugin({
  extendPrompt: `Additional context:
- This is a healthcare website, use medical terminology appropriately
- Brand name is "MedCare" - always capitalize it
- Prefer formal tone`,
})
```

The `extendPrompt` is appended to the default prompt and supports the same placeholders: `{filename}`, `{maxLength}`, and `{language}`.

### Custom Prompt Example

If you need full control, replace the entire prompt:

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
4. Click **"Generate All"** to process all images (or generate individually)
5. Review and edit suggestions inline if needed
6. Click **"Save"** on individual images or **"Save All"** to save all generated alt texts

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
- **SVG files**: Alt text derived from filename (vision APIs don't support SVG)

## Performance

The plugin is optimized for performance:

- **Lazy thumbnails**: Modal thumbnails load on scroll
- **Efficient queries**: Only fetches required fields (`id`, `filename`, `url`, `alt`)
- **Smart batching**: Processes images in configurable batch sizes
- **Bulk save**: Save all generated alt texts in a single request

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

Try customizing the prompt to give the AI more context about your specific use case. The filename is used as a hint, so descriptive filenames help.

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
import type {
  AltTextGeneratorPluginOptions,
  ProviderConfig,
  AIProvider,
  AnthropicProviderConfig,
  OpenAIProviderConfig,
  GoogleProviderConfig,
} from '@diffusenl/payload-alt-text-generator'

const options: AltTextGeneratorPluginOptions = {
  collections: ['media', 'products'],
  language: 'German',
  provider: {
    provider: 'openai',
    model: 'gpt-4o',
  },
}
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Credits

Built with [Payload CMS](https://payloadcms.com) and [Vercel AI SDK](https://sdk.vercel.ai/). Supports [Anthropic Claude](https://anthropic.com), [OpenAI](https://openai.com), and [Google Gemini](https://ai.google.dev/).
