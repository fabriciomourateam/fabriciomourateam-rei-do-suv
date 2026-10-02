import 'server-only'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import { DEMO_VEHICLES } from './demo'
import type { ConfigRow, SiteConfig, Vehicle, VehicleRow } from './types'
import { DEFAULT_CONFIG, rowToConfig, rowToVehicle } from './vehicles'

const SELECT = '*, suv_photos(url, sort_order)'

/** Sem variáveis do Supabase o site roda com dados de demonstração (útil para preview local). */
export const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

/**
 * Cliente sem cookies para leituras do site (permite cache/ISR). Roda só no servidor:
 * usa a service role quando disponível (as consultas abaixo já filtram visible=true),
 * para não depender das policies de RLS do banco.
 */
function publicClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createPublicClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function getVehicles(): Promise<Vehicle[]> {
  if (!hasSupabase) return DEMO_VEHICLES
  const { data, error } = await publicClient()
    .from('suv_vehicles')
    .select(SELECT)
    .eq('visible', true)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getVehicles', error.message)
    return []
  }
  const list = (data as VehicleRow[]).map(rowToVehicle)
  // vendidos sempre por último (prova social, sem roubar a cena)
  return [...list.filter((v) => v.status !== 'vendido'), ...list.filter((v) => v.status === 'vendido')]
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  if (!hasSupabase) return DEMO_VEHICLES.find((v) => v.slug === slug) ?? null
  const { data, error } = await publicClient()
    .from('suv_vehicles')
    .select(SELECT)
    .eq('slug', slug)
    .eq('visible', true)
    .maybeSingle()
  if (error) console.error('getVehicleBySlug', error.message)
  return data ? rowToVehicle(data as VehicleRow) : null
}

export async function getSiteConfig(): Promise<SiteConfig> {
  if (!hasSupabase) return DEFAULT_CONFIG
  const { data, error } = await publicClient().from('suv_config').select('*').eq('id', 1).maybeSingle()
  if (error) console.error('getSiteConfig', error.message)
  return rowToConfig(data as ConfigRow | null)
}
