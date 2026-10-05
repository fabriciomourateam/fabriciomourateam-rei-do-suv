'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { SiteContent } from '@/lib/content'
import { CloseIcon } from './icons'
import { WaButton } from './wa-button'

export function Header({ waHref, visibleIds, content }: { waHref: string; visibleIds?: string[]; content: SiteContent['header'] }) {
  const ALL_LINKS = [
    { href: '/#estoque', label: content.nav.estoque, section: 'inventory' },
    { href: '/#padrao', label: content.nav.padrao, section: 'pillars' },
    { href: '/#visita', label: content.nav.visita, section: 'visit' },
    { href: '/#duvidas', label: content.nav.duvidas, section: 'faq' },
  ]
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const LINKS = ALL_LINKS.filter((l) => !visibleIds || visibleIds.includes(l.section))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'border-b border-gold bg-ink/80 backdrop-blur-xl' : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Rei do SUV — início">
          <Image src="/logo.jpg" alt="Rei do SUV Multimarcas" width={52} height={52} priority className="h-11 w-11 rounded-full ring-1 ring-[var(--gold)]/40 md:h-[52px] md:w-[52px]" />
          <span className="hidden leading-none sm:block">
            <span className="font-display block text-[15px] text-gold">Rei do SUV</span>
            <span className="mt-1 block text-[10px] tracking-[0.32em] text-muted uppercase">Multimarcas</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] tracking-[0.14em] text-text/75 uppercase transition hover:text-gold-light">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <WaButton href={waHref} className="btn-gold hidden items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold md:inline-flex">
            {content.whatsappButton}
          </WaButton>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[6px] rounded-full border border-white/15 md:hidden"
            aria-label="Abrir menu"
          >
            <span className="h-px w-5 bg-text" />
            <span className="h-px w-3.5 bg-gold" />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-ink/97 backdrop-blur-xl transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex h-[72px] items-center justify-between px-5">
          <Image src="/logo.jpg" alt="" width={44} height={44} className="h-11 w-11 rounded-full" />
          <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15" aria-label="Fechar menu">
            <CloseIcon />
          </button>
        </div>
        <nav className="flex flex-1 flex-col justify-center gap-7 px-8">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-3xl text-text transition hover:text-gold"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="p-6">
          <WaButton href={waHref} className="btn-gold flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold">
            {content.whatsappButton}
          </WaButton>
        </div>
      </div>
    </header>
  )
}
