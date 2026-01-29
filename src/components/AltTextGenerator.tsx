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
  const [missingCount, setMissingCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [images, setImages] = useState<ImageWithoutAlt[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fetchCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/${collectionSlug}/missing-alt?countOnly=true`, {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.error) {
        console.error('API error:', data.error)
        setMissingCount(0)
      } else {
        setMissingCount(data.totalDocs ?? 0)
      }
    } catch (error) {
      console.error('Failed to fetch missing alt count:', error)
      setMissingCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [collectionSlug])

  const fetchImages = useCallback(async () => {
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
      console.error('Failed to fetch images:', error)
      setMissingCount(0)
      setImages([])
    }
  }, [collectionSlug])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  const handleClose = () => {
    setIsOpen(false)
    fetchCount()
  }

  // Don't render anything if loading or no images are missing alt text
  if (isLoading || missingCount === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <Button
        onClick={async () => {
          await fetchImages()
          setIsOpen(true)
        }}
        buttonStyle="secondary"
      >
        Generate Missing Alt Texts
        {!isLoading && missingCount > 0 && (
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
          onComplete={handleClose}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
