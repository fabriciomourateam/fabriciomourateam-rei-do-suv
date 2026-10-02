'use client'

import { WhatsAppIcon } from './icons'

interface Props {
  href: string
  vehicleId?: string
  className?: string
  children: React.ReactNode
  icon?: boolean
  label?: string
}

/** Link para o WhatsApp que registra o clique (sem atrasar a navegação). */
export function WaButton({ href, vehicleId, className = '', children, icon = true, label }: Props) {
  function track() {
    try {
      const body = JSON.stringify({ vehicleId: vehicleId && !vehicleId.startsWith('demo') ? vehicleId : undefined })
      navigator.sendBeacon?.('/api/click', new Blob([body], { type: 'application/json' }))
    } catch {
      /* rastreio é opcional */
    }
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={track} className={className} aria-label={label}>
      {icon && <WhatsAppIcon className="h-[1.1em] w-[1.1em] shrink-0" />}
      {children}
    </a>
  )
}
