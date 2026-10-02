import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] tracking-[0.34em] text-gold-light uppercase">Página não encontrada</p>
      <h1 className="font-display mt-6 text-4xl text-silver md:text-6xl">Esse já saiu do pátio.</h1>
      <p className="font-serif mt-4 text-2xl text-gold italic">Mas o próximo pode ser o seu.</p>
      <Link href="/#estoque" className="btn-gold mt-10 rounded-full px-8 py-4 text-sm font-semibold">
        Ver o estoque
      </Link>
    </main>
  )
}
