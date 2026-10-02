import type { Metadata, Viewport } from 'next'
import { Archivo, Cormorant_Garamond, Inter } from 'next/font/google'
import { getSiteContent } from '@/lib/content-store'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['italic', 'normal'],
  variable: '--font-cormorant',
  display: 'swap',
})
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSiteContent()
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: seo.title,
      template: '%s | Rei do SUV',
    },
    description: seo.description,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Rei do SUV',
    },
    icons: { icon: '/logo.jpg', apple: '/logo.jpg' },
  }
}

export const viewport: Viewport = {
  themeColor: '#09090a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ink text-text">{children}</body>
    </html>
  )
}
