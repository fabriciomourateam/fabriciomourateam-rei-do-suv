import { createClient } from '@supabase/supabase-js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    try {
      const body: unknown = await request.json().catch(() => null)
      const raw = body && typeof body === 'object' ? (body as { vehicleId?: unknown }).vehicleId : undefined
      const vehicleId = typeof raw === 'string' && UUID.test(raw) ? raw : null
      const supabase = createClient(url, key, { auth: { persistSession: false } })
      await supabase.from('suv_clicks').insert({ vehicle_id: vehicleId })
    } catch {
      /* silencioso */
    }
  }
  return new Response(null, { status: 204 })
}
