import type { Metadata, Viewport } from 'next'
import { Archivo, Cormorant_Garamond, Inter } from 'next/font/google'
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Rei do SUV | SUVs premium topo de linha',
    template: '%s | Rei do SUV',
  },
  description:
    'Curadoria de SUVs premium: Sorento, Santa Fe, Sportage e mais. Só versões topo de linha, baixa quilometragem e estado de showroom. Agende sua visita.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Rei do SUV',
    images: [{ url: '/seed/sorento-1.jpg', width: 900, height: 1600 }],
  },
  icons: { icon: '/logo.jpg', apple: '/logo.jpg' },
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
