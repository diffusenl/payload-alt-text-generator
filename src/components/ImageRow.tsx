'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@payloadcms/ui'
import type { ImageWithoutAlt, AltTextSuggestion } from '../types'

interface ImageRowProps {
  image: ImageWithoutAlt
  suggestion?: AltTextSuggestion
  collectionSlug: string
  onGenerate: () => void
  onUpdate: (newAlt: string) => void
  onSave: (newAlt: string) => Promise<void>
}

export const ImageRow: React.FC<ImageRowProps> = ({
  image,
  suggestion,
  onGenerate,
  onUpdate,
  onSave,
}) => {
  const status = suggestion?.status || 'pending'
  const [isSaving, setIsSaving] = useState(false)
  const originalValueRef = useRef(suggestion?.suggestedAlt || '')

  const statusColors: Record<string, string> = {
    pending: 'var(--theme-elevation-400)',
    generating: 'var(--theme-warning-500)',
    ready: 'var(--theme-success-500)',
    saved: 'var(--theme-success-700)',
    error: 'var(--theme-error-500)',
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr auto',
        gap: '1rem',
        padding: '1rem',
        borderBottom: '1px solid var(--theme-elevation-100)',
        alignItems: 'center',
        opacity: status === 'generating' ? 0.7 : 1,
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '80px',
          height: '60px',
          backgroundColor: 'var(--theme-elevation-50)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <img
          src={image.url}
          alt=""
          width={80}
          height={60}
          loading="lazy"
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Filename + Input */}
      <div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--theme-elevation-500)',
            marginBottom: '0.25rem',
          }}
        >
          {image.filename}
        </div>

        {status === 'generating' ? (
          <div
            role="status"
            aria-label={`Generating alt text for ${image.filename}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--theme-warning-500)',
              fontSize: '0.875rem',
            }}
          >
            <span
              aria-hidden="true"
              className="alt-spinner"
              style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                border: '2px solid var(--theme-warning-500)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
              }}
            />
            Generating alt text...
          </div>
        ) : status === 'error' ? (
          <div
            role="alert"
            aria-label={`Error for ${image.filename}`}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--theme-error-500)',
              borderRadius: '4px',
              fontSize: '0.875rem',
              backgroundColor: 'var(--theme-error-50)',
              color: 'var(--theme-error-500)',
            }}
          >
            {suggestion?.error || 'Failed to generate alt text'}
          </div>
        ) : suggestion && (status === 'ready' || status === 'saved') ? (
          <input
            type="text"
            value={suggestion.suggestedAlt}
            onChange={(e) => {
              onUpdate(e.target.value)
            }}
            onFocus={() => {
              originalValueRef.current = suggestion.suggestedAlt
            }}
            onBlur={async (e) => {
              const newValue = e.target.value
              if (newValue !== originalValueRef.current) {
                setIsSaving(true)
                await onSave(newValue)
                setIsSaving(false)
                originalValueRef.current = newValue
              }
            }}
            disabled={isSaving}
            placeholder="Alt text..."
            aria-label={`Alt text for ${image.filename}`}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: `1px solid ${status === 'saved' ? 'var(--theme-success-500)' : 'var(--theme-elevation-150)'}`,
              borderRadius: '4px',
              fontSize: '0.875rem',
              backgroundColor: status === 'saved' ? 'var(--theme-success-50)' : undefined,
            }}
          />
        ) : (
          <span
            style={{ color: 'var(--theme-elevation-400)', fontSize: '0.875rem' }}
          >
            Click Generate to create alt text
          </span>
        )}
      </div>

      {/* Status + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          role="status"
          aria-label={`Status: ${status}`}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColors[status],
          }}
        />

        {status === 'pending' && (
          <Button onClick={onGenerate} buttonStyle="secondary" size="small">
            Generate
          </Button>
        )}

        {status === 'generating' && (
          <span style={{ fontSize: '0.75rem', color: 'var(--theme-warning-500)' }}>
            Loading...
          </span>
        )}

        {status === 'error' && (
          <Button onClick={onGenerate} buttonStyle="secondary" size="small">
            Retry
          </Button>
        )}

        {status === 'saved' && (
          <span
            style={{ fontSize: '0.75rem', color: 'var(--theme-success-500)' }}
          >
            Saved
          </span>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .alt-spinner {
          animation: spin 1s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .alt-spinner {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}
