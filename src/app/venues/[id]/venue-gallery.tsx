'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { VenueQrModal } from './qr-modal'

interface VenueGalleryProps {
  images: string[]
  venueName: string
  venueId: string
  isCurrentlyOccupied: boolean
  isReservedLater: boolean
}

export function VenueGallery({
  images,
  venueName,
  venueId,
  isCurrentlyOccupied,
  isReservedLater,
}: VenueGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const activeImage = images[selectedIndex] || images[0] || '/images/venues/auditorium/front-view.jpeg'

  return (
    <div className="relative w-full bg-surface-container overflow-hidden">
      {/* Active Main Image Container */}
      <div className="relative w-full h-[300px] sm:h-[360px] overflow-hidden bg-black/40">
        <Image
          src={activeImage}
          alt={`${venueName} - Photo ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1000px"
          className="w-full h-full object-cover transition-all duration-300"
        />
        {/* Subtle gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75 pointer-events-none" />

        {/* Floating Top Nav Bar */}
        <header className="absolute top-0 left-0 right-0 pt-4 px-4 sm:px-5 flex justify-between items-center z-20">
          <Link
            href="/venues"
            aria-label="Go Back"
            className="w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md flex items-center justify-center text-on-surface active:scale-95 transition-transform duration-150 border border-outline-variant/40 hover:bg-surface-container-lowest"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="flex items-center gap-2">
            <VenueQrModal venueId={venueId} venueName={venueName} />
            <Link
              href="/dashboard/availability"
              aria-label="Check Availability"
              className="w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md flex items-center justify-center text-on-surface active:scale-95 transition-transform duration-150 border border-outline-variant/40 hover:bg-surface-container-lowest"
            >
              <span className="material-symbols-outlined text-[19px]">search</span>
            </Link>
          </div>
        </header>

        {/* Image Counter Badge if multiple images */}
        {images.length > 1 && (
          <div className="absolute top-16 right-4 sm:right-5 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1 border border-white/10 shadow-sm">
            <span className="material-symbols-outlined text-[14px]">photo_camera</span>
            <span>
              {selectedIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Status Pill on bottom of Hero */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2">
          {isCurrentlyOccupied ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur-md border border-error shadow-sm font-label-sm text-label-sm text-error font-medium">
              <span className="w-2 h-2 rounded-full bg-error" />
              Occupied Now
            </span>
          ) : isReservedLater ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur-md border border-secondary-container shadow-sm font-label-sm text-label-sm text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              Reserved Later
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur-md border border-tertiary-fixed shadow-sm font-label-sm text-label-sm text-tertiary font-medium">
              <span className="w-2 h-2 rounded-full bg-tertiary" />
              Available Today
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/40 font-label-sm text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">domain</span>
            Campus Space
          </span>
        </div>
      </div>

      {/* Thumbnails Strip (if more than 1 image) */}
      {images.length > 1 && (
        <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-150 cursor-pointer ${
                selectedIndex === idx
                  ? 'border-primary ring-2 ring-primary/20 scale-105'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${venueName} thumbnail ${idx + 1}`}
                fill
                sizes="64px"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

