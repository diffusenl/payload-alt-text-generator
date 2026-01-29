'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@payloadcms/ui'
import { ImageRow } from './ImageRow'
import type { ImageWithoutAlt, AltTextSuggestion } from '../types'

interface AltTextModalProps {
  images: ImageWithoutAlt[]
  collectionSlug: string
  batchSize: number
  onComplete: () => void
  onClose: () => void
}

export const AltTextModal: React.FC<AltTextModalProps> = ({
  images = [],
  collectionSlug,
  batchSize,
  onComplete,
  onClose,
}) => {
  const safeImages = images ?? []
  const [suggestions, setSuggestions] = useState<Map<string, AltTextSuggestion>>(
    new Map()
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const cancelRef = useRef(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Generate alt text only (no save)
  const generateAltText = async (
    image: ImageWithoutAlt
  ): Promise<AltTextSuggestion> => {
    setSuggestions((prev) => {
      const next = new Map(prev)
      next.set(image.id, {
        id: image.id,
        filename: image.filename,
        imageUrl: image.url,
        suggestedAlt: '',
        status: 'generating',
      })
      return next
    })

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 min timeout for large images

      const response = await fetch(`/api/${collectionSlug}/generate-alt`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          imageUrl: image.url,
          filename: image.filename,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate')
      }

      const suggestion: AltTextSuggestion = {
        id: image.id,
        filename: image.filename,
        imageUrl: image.url,
        suggestedAlt: data.suggestedAlt,
        status: 'ready',
      }

      setSuggestions((prev) => {
        const next = new Map(prev)
        next.set(image.id, suggestion)
        return next
      })

      return suggestion
    } catch (error) {
      const errorMessage = error instanceof Error
        ? (error.name === 'AbortError' ? 'Request timed out' : error.message)
        : String(error)

      const errorSuggestion: AltTextSuggestion = {
        id: image.id,
        filename: image.filename,
        imageUrl: image.url,
        suggestedAlt: '',
        status: 'error',
        error: `Error: ${errorMessage}`,
      }

      setSuggestions((prev) => {
        const next = new Map(prev)
        next.set(image.id, errorSuggestion)
        return next
      })

      return errorSuggestion
    }
  }

  // Batch save multiple alt texts in one request
  const saveBatch = async (results: AltTextSuggestion[]) => {
    const toSave = results.filter((r) => r.status === 'ready' && r.suggestedAlt)
    if (toSave.length === 0) return

    try {
      const response = await fetch(`/api/${collectionSlug}/save-bulk-alt`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: toSave.map((s) => ({ id: s.id, alt: s.suggestedAlt })),
          collectionSlug,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuggestions((prev) => {
          const next = new Map(prev)
          for (const id of data.success || []) {
            const existing = next.get(id)
            if (existing) {
              next.set(id, { ...existing, status: 'saved' })
            }
          }
          return next
        })
      }
    } catch {
      // Silently fail - user will see the image wasn't saved
    }
  }

  const handleGenerateAll = async () => {
    cancelRef.current = false
    setIsCancelling(false)
    setIsGenerating(true)
    setProgress({ current: 0, total: safeImages.length })

    for (let i = 0; i < safeImages.length; i += batchSize) {
      // Check if cancelled before starting next batch
      if (cancelRef.current) {
        break
      }

      const batch = safeImages.slice(i, i + batchSize)
      // Generate alt text only (no auto-save)
      await Promise.all(batch.map(generateAltText))
      setProgress((prev) => ({
        ...prev,
        current: Math.min(i + batchSize, safeImages.length),
      }))
    }

    setIsGenerating(false)
    setIsCancelling(false)
  }

  const handleSaveAll = async () => {
    const readySuggestions = Array.from(suggestions.values()).filter(
      (s) => s.status === 'ready' && s.suggestedAlt
    )
    if (readySuggestions.length === 0) return
    await saveBatch(readySuggestions)
  }

  const handleCancel = () => {
    cancelRef.current = true
    setIsCancelling(true)
  }

  const handleUpdateSuggestion = (id: string, newAlt: string) => {
    setSuggestions((prev) => {
      const next = new Map(prev)
      const existing = next.get(id)
      if (existing) {
        next.set(id, { ...existing, suggestedAlt: newAlt })
      }
      return next
    })
  }

  const handleSaveAlt = async (id: string, newAlt: string) => {
    const response = await fetch(`/api/${collectionSlug}/save-alt`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageId: id,
        altText: newAlt,
        collectionSlug,
      }),
    })

    if (response.ok) {
      setSuggestions((prev) => {
        const next = new Map(prev)
        const existing = next.get(id)
        if (existing) {
          next.set(id, { ...existing, suggestedAlt: newAlt, status: 'saved' })
        }
        return next
      })
    }
  }

  const savedCount = Array.from(suggestions.values()).filter(
    (s) => s.status === 'saved'
  ).length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close modal"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          border: 'none',
          cursor: 'pointer',
        }}
      />

      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--theme-elevation-0)',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '90vw',
          maxWidth: '900px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--theme-elevation-100)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Generate Alt Texts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--theme-elevation-500)',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <p style={{ color: 'var(--theme-elevation-500)', margin: '0 0 1rem' }}>
            {safeImages.length} images missing alt text
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
            <Button
              onClick={handleGenerateAll}
              disabled={isGenerating || safeImages.length === 0}
            >
              {isGenerating
                ? `Generating... (${progress.current}/${progress.total})`
                : 'Generate All'}
            </Button>

            {isGenerating && (
              <Button
                onClick={handleCancel}
                buttonStyle="secondary"
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}

            {!isGenerating && Array.from(suggestions.values()).some((s) => s.status === 'ready') && (
              <Button
                onClick={handleSaveAll}
                buttonStyle="secondary"
              >
                Save All
              </Button>
            )}

            {savedCount > 0 && (
              <span style={{ fontSize: '0.875rem', color: 'var(--theme-success-500)' }}>
                {savedCount} saved
              </span>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: '4px',
            }}
          >
            {safeImages.map((image) => (
              <ImageRow
                key={image.id}
                image={image}
                suggestion={suggestions.get(image.id)}
                collectionSlug={collectionSlug}
                onGenerate={() => generateAltText(image)}
                onUpdate={(newAlt) => handleUpdateSuggestion(image.id, newAlt)}
                onSave={(newAlt) => handleSaveAlt(image.id, newAlt)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
