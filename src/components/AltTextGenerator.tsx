'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@payloadcms/ui'
import { AltTextModal } from './AltTextModal'
import type { ImageWithoutAlt } from '../types'

interface AltTextGeneratorProps {
  collectionSlug: string
  options: {
    batchSize: number
    altFieldName: string
  }
}

export const AltTextGenerator: React.FC<AltTextGeneratorProps> = ({
  collectionSlug,
  options,
}) => {
  const [missingCount, setMissingCount] = useState<number | null>(null)
  const [images, setImages] = useState<ImageWithoutAlt[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fetchMissingAlt = useCallback(async () => {
    try {
      const response = await fetch(`/api/${collectionSlug}/missing-alt`, {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.error) {
        console.error('API error:', data.error)
        setMissingCount(0)
        setImages([])
        return
      }
      setMissingCount(data.totalDocs ?? 0)
      setImages(data.docs ?? [])
    } catch (error) {
      console.error('Failed to fetch missing alt count:', error)
      setMissingCount(0)
      setImages([])
    }
  }, [collectionSlug])

  useEffect(() => {
    fetchMissingAlt()
  }, [fetchMissingAlt])

  const handleComplete = () => {
    fetchMissingAlt()
    setIsOpen(false)
  }

  if (missingCount === null) {
    return null
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <Button
        onClick={async () => {
          await fetchMissingAlt()
          setIsOpen(true)
        }}
        buttonStyle="secondary"
        disabled={missingCount === 0}
      >
        Generate Missing Alt Texts
        {missingCount > 0 && (
          <span
            style={{
              marginLeft: '0.5rem',
              padding: '0.125rem 0.5rem',
              backgroundColor: 'var(--theme-error-500)',
              color: 'white',
              borderRadius: '999px',
              fontSize: '0.75rem',
            }}
          >
            {missingCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <AltTextModal
          images={images}
          collectionSlug={collectionSlug}
          batchSize={options.batchSize}
          onComplete={handleComplete}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
