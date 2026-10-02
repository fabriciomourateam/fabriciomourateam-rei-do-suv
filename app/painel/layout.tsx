import Image from 'next/image'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'

const LINKS = [
  { href: '/painel', label: 'Visão geral' },
  { href: '/painel/veiculos', label: 'Veículos' },
  { href: '/painel/veiculos/novo', label: 'Novo veículo' },
  { href: '/painel/config', label: 'Configurações' },
  { href: '/painel/usuarios', label: 'Usuários' },
]

const navCls = 'whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-gold-light'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-ink text-text md:flex">
      {/* Desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gold bg-coal p-5 md:flex">
        <div className="mb-8 flex items-center gap-3">
          <Image src="/logo.jpg" alt="" width={40} height={40} className="rounded-full" />
          <span className="font-display text-gold text-sm">Rei do SUV</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={navCls}>{l.label}</Link>
          ))}
          <Link href="/" target="_blank" className={navCls}>Ver site ↗</Link>
        </nav>
        <form action="/auth/sign-out" method="post">
          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:text-white">Sair</button>
        </form>
      </aside>

      {/* Mobile */}
      <header className="sticky top-0 z-30 border-b border-gold bg-coal/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="" width={32} height={32} className="rounded-full" />
            <span className="font-display text-gold text-xs">Rei do SUV</span>
          </div>
          <form action="/auth/sign-out" method="post">
            <button className="px-2 py-1 text-xs text-muted">Sair</button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={navCls}>{l.label}</Link>
          ))}
          <Link href="/" target="_blank" className={navCls}>Ver site ↗</Link>
        </nav>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  )
}
