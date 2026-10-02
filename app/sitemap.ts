import type { MetadataRoute } from 'next'
import { getVehicles } from '@/lib/data'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const vehicles = await getVehicles()
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    ...vehicles.map((v) => ({ url: `${base}/estoque/${v.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
