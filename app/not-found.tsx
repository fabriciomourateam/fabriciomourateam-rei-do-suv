import Link from 'next/link'
import { getSiteContent } from '@/lib/content-store'

export default async function NotFound() {
  const { notFound } = await getSiteContent()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] tracking-[0.34em] text-gold-light uppercase">{notFound.eyebrow}</p>
      <h1 className="font-display mt-6 text-4xl text-silver md:text-6xl">{notFound.title}</h1>
      <p className="font-serif mt-4 text-2xl text-gold italic">{notFound.subtitle}</p>
      <Link href="/#estoque" className="btn-gold mt-10 rounded-full px-8 py-4 text-sm font-semibold">
        {notFound.cta}
      </Link>
    </main>
  )
}
