'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronIcon, CloseIcon } from './icons'

export function Gallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(false)
  const track = useRef<HTMLDivElement>(null)

  const go = useCallback(
    (i: number) => {
      const n = (i + photos.length) % photos.length
      setIndex(n)
      const el = track.current
      if (el) el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
    },
    [photos.length],
  )

  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false)
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % photos.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + photos.length) % photos.length)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [zoom, photos.length])

  if (!photos.length) return <div className="aspect-[4/5] rounded-[24px] bg-coal" />

  return (
    <div>
      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-coal">
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget
            setIndex(Math.round(el.scrollLeft / el.clientWidth))
          }}
          className="no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto"
        >
          {photos.map((src, i) => (
            <button key={src + i} type="button" onClick={() => setZoom(true)} className="relative h-full w-full shrink-0 snap-center cursor-zoom-in" aria-label="Ampliar foto">
              <Image src={src} alt={`${alt} — foto ${i + 1}`} fill priority={i === 0} sizes="(min-width:1024px) 55vw, 100vw" className="object-cover object-[50%_58%]" />
            </button>
          ))}
        </div>
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} className="absolute top-1/2 left-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 md:flex" aria-label="Foto anterior">
              <ChevronIcon dir="left" />
            </button>
            <button type="button" onClick={() => go(index + 1)} className="absolute top-1/2 right-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 md:flex" aria-label="Próxima foto">
              <ChevronIcon />
            </button>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <span key={i} className={`h-1 rounded-full transition-all ${i === index ? 'w-6 bg-[var(--gold)]' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
            <span className="absolute top-4 right-4 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {photos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => go(i)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border transition ${i === index ? 'border-[var(--gold)]' : 'border-transparent opacity-55 hover:opacity-100'}`}
              aria-label={`Ver foto ${i + 1}`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95" onClick={() => setZoom(false)}>
          <button type="button" className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white" aria-label="Fechar">
            <CloseIcon />
          </button>
          <div className="relative h-[88vh] w-[94vw]" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[index]} alt={alt} fill sizes="94vw" className="object-contain" />
          </div>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + photos.length) % photos.length) }} className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Anterior">
                <ChevronIcon dir="left" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % photos.length) }} className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Próxima">
                <ChevronIcon />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
