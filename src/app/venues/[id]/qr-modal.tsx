'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export function VenueQrModal({ venueId, venueName }: { venueId: string; venueName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Construct origin-based venue check-in URL
  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/venues/${venueId}`
    : `https://venuity.local/venues/${venueId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="View Venue QR Code"
        className="w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md flex items-center justify-center text-on-surface active:scale-95 transition-transform duration-150 border border-outline-variant/40 hover:bg-surface-container-lowest cursor-pointer"
        title="Venue Check-in QR Code"
      >
        <span className="material-symbols-outlined text-[19px]">qr_code_2</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-outline-variant/50 shadow-2xl flex flex-col items-center text-center relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
            </div>

            <h3 className="font-headline-sm text-lg font-bold text-on-surface">
              {venueName}
            </h3>
            <p className="font-body-sm text-xs text-outline mt-1 mb-5">
              Scan to view live availability, schedule, and instantly request reservations.
            </p>

            <div className="p-4 bg-white rounded-2xl border-2 border-outline-variant/30 shadow-inner mb-4 flex items-center justify-center">
              <QRCodeSVG
                value={qrUrl}
                size={180}
                bgColor="#ffffff"
                fgColor="#241B00"
                level="Q"
                aria-label={`QR Code for ${venueName}`}
              />
            </div>

            <p className="text-[11px] font-mono text-outline break-all bg-surface-container-low px-3 py-1.5 rounded-lg mb-4 w-full">
              {qrUrl}
            </p>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-sm font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied URL!' : 'Copy Venue URL'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
