export type VehicleStatus = 'disponivel' | 'reservado' | 'vendido'

export interface Vehicle {
  id: string
  slug: string
  brand: string
  model: string
  version: string
  engine: string
  drivetrain: string
  yearManufacture: number | null
  yearModel: number | null
  km: number | null
  color: string
  transmission: string
  fuel: string
  seats: number | null
  highlights: string[]
  headline: string
  description: string
  status: VehicleStatus
  visible: boolean
  featured: boolean
  sortOrder: number
  photos: string[]
}

export interface SiteConfig {
  whatsapp: string
  instagram: string
  tiktok: string
  city: string
  addressNote: string
  hours: string
  heroTitle: string
  heroSubtitle: string
}

/** Linha crua de suv_vehicles (snake_case) com fotos aninhadas */
export interface VehicleRow {
  id: string
  slug: string
  brand: string
  model: string
  version: string | null
  engine: string | null
  drivetrain: string | null
  year_manufacture: number | null
  year_model: number | null
  km: number | null
  color: string | null
  transmission: string | null
  fuel: string | null
  seats: number | null
  highlights: string[] | null
  headline: string | null
  description: string | null
  status: VehicleStatus
  visible: boolean
  featured: boolean
  sort_order: number
  suv_photos?: { url: string; sort_order: number }[]
}

export interface ConfigRow {
  whatsapp: string | null
  instagram: string | null
  tiktok: string | null
  city: string | null
  address_note: string | null
  hours: string | null
  hero_title: string | null
  hero_subtitle: string | null
}
