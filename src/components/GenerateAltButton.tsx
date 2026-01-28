'use client'

import React, { useState, useRef } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useParams } from 'next/navigation'

interface GenerateAltButtonProps {
  collectionSlug: string
  altFieldName: string
}

export const GenerateAltButton: React.FC<GenerateAltButtonProps> = ({
  collectionSlug,
  altFieldName,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const documentInfo = useDocumentInfo()
  const params = useParams()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Get ID from documentInfo or fall back to URL params
  const id = documentInfo?.id || (params?.segments as string[] | undefined)?.at(-1)

  const updateFieldValue = (value: string) => {
    // Find the input field by name attribute
    const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `input[name="${altFieldName}"], textarea[name="${altFieldName}"]`
    )

    if (input) {
      // Use native value setter to bypass React's synthetic event system
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set

      const setter = input.tagName === 'TEXTAREA' ? nativeTextAreaValueSetter : nativeInputValueSetter
      setter?.call(input, value)

      // Dispatch input event to trigger React's onChange
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  const handleGenerate = async () => {
    if (!id) return

    setIsGenerating(true)

    try {
      // First get the document to find the image URL and filename
      const docResponse = await fetch(`/api/${collectionSlug}/${id}`, {
        credentials: 'include',
      })
      const doc = await docResponse.json()

      if (!doc.url || !doc.filename) {
        console.error('No image URL or filename found')
        return
      }

      const response = await fetch(`/api/${collectionSlug}/generate-alt`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: id,
          imageUrl: doc.url,
          filename: doc.filename,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate')
      }

      if (data.suggestedAlt) {
        updateFieldValue(data.suggestedAlt)
      }
    } catch (error) {
      console.error('Failed to generate alt text:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleGenerate}
      disabled={isGenerating || !id}
      className="generate-alt-btn"
      style={{
        marginTop: '0.5rem',
        padding: '0.4rem 0.75rem',
        backgroundColor: 'transparent',
        border: '1px solid var(--theme-elevation-250)',
        borderRadius: '4px',
        cursor: isGenerating || !id ? 'not-allowed' : 'pointer',
        fontSize: '0.8rem',
        color: 'var(--theme-elevation-800)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        opacity: isGenerating || !id ? 0.6 : 1,
      }}
    >
      {isGenerating && (
        <span
          aria-hidden="true"
          className="generate-spinner"
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            border: '2px solid var(--theme-elevation-400)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
          }}
        />
      )}
      {isGenerating ? 'Generating...' : 'Generate with AI'}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .generate-spinner {
          animation: spin 1s linear infinite;
        }
        .generate-alt-btn:focus-visible {
          outline: 2px solid var(--theme-elevation-500);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .generate-spinner {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>
    </button>
  )
}
