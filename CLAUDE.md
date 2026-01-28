# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build    # Build with tsup (outputs to dist/)
npm run dev      # Build in watch mode
npm run lint     # Run ESLint on src/
```

## Architecture

This is a Payload CMS 3.x plugin that adds AI-powered alt text generation using Claude Vision API.

### Entry Points

The package has two separate build outputs configured in `tsup.config.ts`:
- **Server-side** (`src/index.ts` → `dist/index.js`): Plugin registration and API endpoints
- **Client-side** (`src/components/index.ts` → `dist/components/index.js`): React components with `"use client"` banner

### Plugin Structure

`src/plugin.ts` - Main plugin factory that:
- Adds 4 REST endpoints to configured collections (`/missing-alt`, `/generate-alt`, `/save-alt`, `/save-bulk-alt`)
- Injects `AltTextGenerator` component as `beforeListTable` (bulk generation modal)
- Injects `GenerateAltButton` component as `afterInput` on the alt field (single image generation)

### Endpoints (`src/endpoints/`)

| File | Purpose |
|------|---------|
| `getMissingAlt.ts` | Queries images where alt field is empty/null/missing |
| `generateAlt.ts` | Fetches image, converts to base64, calls Claude Vision API |
| `saveAlt.ts` | Saves alt text for single image |
| `saveBulkAlt.ts` | Batch saves alt text for multiple images |

### Components (`src/components/`)

| File | Purpose |
|------|---------|
| `AltTextGenerator.tsx` | Button + badge shown above media list, opens modal |
| `AltTextModal.tsx` | Modal with batch generation UI, progress tracking |
| `ImageRow.tsx` | Single image row with thumbnail, editable input, status |
| `GenerateAltButton.tsx` | "Generate with AI" button below alt field in edit view |

### State Flow

1. `AltTextGenerator` fetches missing images on mount and when modal opens
2. `AltTextModal` manages generation state in a `Map<string, AltTextSuggestion>`
3. Status progression: `pending` → `generating` → `ready` → `saved` (or `error`)
4. Batch processing: generates in parallel batches, then bulk saves results

## Testing Locally

Use `npm link` to test in a Payload project:
```bash
# In this repo
npm link

# In your Payload project
npm link @diffusenl/payload-alt-text-generator
npx payload generate:importmap
```
