# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-01-29

### Added

- **Cancel button** - Cancel batch generation at any time; already-saved images are preserved
- **Auto-resize large images** - Images over 4MB or 7500px are automatically resized before sending to Claude
- **SVG support** - SVG files get alt text derived from filename (Claude doesn't support SVG analysis)
- **Non-image filtering** - Videos, PDFs, and other non-image files are filtered from the missing alt text list
- **Rate limit handling** - Automatic retry with exponential backoff (15s, 30s, 60s) for 429 errors
- **Immediate saves** - Each image saves immediately after generation instead of batching saves
- **Lazy loading thumbnails** - Modal thumbnails load on scroll for better performance
- **Empty alt text support** - Clear a field to remove alt text and keep image in the review list

### Changed

- "Generate with AI" button now only appears when editing existing images, not during upload
- Refetch images when modal opens to exclude already-processed items
- Better error messages showing actual API error details
- Reduced client-side timeout to 2 minutes for large images

### Fixed

- Fixed race condition in tsup build that could cause missing dist files
- Fixed modal not reopening after being dismissed during generation

## [1.0.2] - 2025-01-28

- Initial public release
