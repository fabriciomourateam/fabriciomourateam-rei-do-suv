import type { ConfigRow, SiteConfig, Vehicle, VehicleRow } from './types'

export const DEFAULT_CONFIG: SiteConfig = {
  whatsapp: '5511953965259',
  instagram: '',
  tiktok: '',
  city: 'São Paulo · SP',
  addressNote: 'Atendimento com hora marcada',
  hours: 'Seg a Sáb · 9h às 19h',
  heroTitle: '',
  heroSubtitle: '',
}

export function rowToVehicle(r: VehicleRow): Vehicle {
  return {
    id: r.id,
    slug: r.slug,
    brand: r.brand,
    model: r.model,
    version: r.version ?? '',
    engine: r.engine ?? '',
    drivetrain: r.drivetrain ?? '',
    yearManufacture: r.year_manufacture,
    yearModel: r.year_model,
    km: r.km,
    color: r.color ?? '',
    transmission: r.transmission ?? '',
    fuel: r.fuel ?? '',
    seats: r.seats,
    highlights: r.highlights ?? [],
    headline: r.headline ?? '',
    description: r.description ?? '',
    status: r.status,
    visible: r.visible,
    featured: r.featured,
    sortOrder: r.sort_order,
    photos: [...(r.suv_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((p) => p.url),
  }
}

export function rowToConfig(r: ConfigRow | null): SiteConfig {
  if (!r) return DEFAULT_CONFIG
  return {
    whatsapp: r.whatsapp || DEFAULT_CONFIG.whatsapp,
    instagram: r.instagram ?? '',
    tiktok: r.tiktok ?? '',
    city: r.city || DEFAULT_CONFIG.city,
    addressNote: r.address_note || DEFAULT_CONFIG.addressNote,
    hours: r.hours || DEFAULT_CONFIG.hours,
    heroTitle: r.hero_title ?? '',
    heroSubtitle: r.hero_subtitle ?? '',
  }
}

/** "Kia Sorento" */
export function vehicleName(v: Pick<Vehicle, 'brand' | 'model'>): string {
  return `${v.brand} ${v.model}`.trim()
}

/** "2017/2018" ou "2018" */
export function yearLabel(v: Pick<Vehicle, 'yearManufacture' | 'yearModel'>): string {
  const { yearManufacture: f, yearModel: m } = v
  if (f && m && f !== m) return `${f}/${m}`
  return String(m ?? f ?? '')
}

/** 58000 -> "58.000 km" */
export function formatKm(km: number | null): string {
  if (km == null) return ''
  return `${new Intl.NumberFormat('pt-BR').format(km)} km`
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

export function waLink(phone: string, text?: string): string {
  const num = normalizePhone(phone)
  const base = `https://wa.me/${num}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

/** "Kia Sorento EX 3.5 V6 2017/2018" — usado em {carro} nas mensagens de WhatsApp */
export function carDescription(v: Vehicle): string {
  return [vehicleName(v), v.version, yearLabel(v)].filter(Boolean).join(' ')
}

export const STATUS_LABEL: Record<Vehicle['status'], string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
}

/** Specs exibidas na ficha, na ordem, sem vazios */
export function specList(v: Vehicle): { label: string; value: string }[] {
  const items: [string, string][] = [
    ['Ano', yearLabel(v)],
    ['Quilometragem', formatKm(v.km)],
    ['Motor', v.engine],
    ['Câmbio', v.transmission],
    ['Cor', v.color],
    ['Tração', v.drivetrain],
    ['Combustível', v.fuel],
    ['Lugares', v.seats ? String(v.seats) : ''],
  ]
  return items.filter(([, value]) => value).map(([label, value]) => ({ label, value }))
}
