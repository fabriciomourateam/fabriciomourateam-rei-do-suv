'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HEADLINE_SUGGESTIONS, HIGHLIGHT_SUGGESTIONS } from '@/lib/copy'
import type { Vehicle } from '@/lib/types'
import { saveVehicle } from './save'
import { createPhotoUpload } from './upload'

const BUCKET = 'suv-veiculos'
const MAX_DIM = 2000

/** Reduz para no máx. 2000px e exporta webp 0.82 (fallback jpeg). */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.82))
  const webp = await toBlob('image/webp')
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await toBlob('image/jpeg')
  if (!jpeg) throw new Error('Falha ao comprimir')
  return jpeg
}

const BRANDS = ['Kia', 'Hyundai', 'Toyota', 'Jeep', 'Volkswagen', 'Chevrolet', 'Mitsubishi', 'Honda']
const MODELS = ['Sorento', 'Santa Fe', 'Sportage', 'Tucson', 'Compass', 'SW4', 'Tiguan']

function Field({ name, label, defaultValue, type = 'text', required, inputMode }: {
  name: string; label: string; defaultValue?: string | number | null; type?: string; required?: boolean
  inputMode?: 'numeric'
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}{required && ' *'}</label>
      <input id={name} name={name} type={type} required={required} inputMode={inputMode}
        defaultValue={defaultValue ?? ''} className="field" />
    </div>
  )
}

/** Campo de texto livre + atalhos clicáveis (digitar sempre funciona). */
function ChipInput({ name, label, value, onChange, options, required }: {
  name: string; label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}{required && ' *'}</label>
      <input id={name} name={name} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Digite ou toque numa opção" autoComplete="off" className="field" />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button type="button" key={o} onClick={() => onChange(o)}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition ${value === o ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/10 text-muted hover:border-gold'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gold bg-coal p-5">
      <h2 className="font-display text-gold mb-4 text-sm">{title}</h2>
      {children}
    </section>
  )
}

const chip = 'rounded-full border px-3 py-1.5 text-xs transition'

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const [brand, setBrand] = useState(vehicle?.brand ?? '')
  const [model, setModel] = useState(vehicle?.model ?? '')
  const [transmission, setTransmission] = useState(vehicle?.transmission ?? '')
  const [fuel, setFuel] = useState(vehicle?.fuel ?? '')
  const [drivetrain, setDrivetrain] = useState(vehicle?.drivetrain ?? '')
  const [headline, setHeadline] = useState(vehicle?.headline ?? '')
  const [highlights, setHighlights] = useState<string[]>(vehicle?.highlights ?? [])
  const [custom, setCustom] = useState('')
  const [photos, setPhotos] = useState<string[]>(vehicle?.photos ?? [])
  const [progress, setProgress] = useState('')
  const [uploadError, setUploadError] = useState('')
  const uploading = progress !== ''

  const key = model.trim().toLowerCase()
  const headlineSuggestions = [...new Set([...(HEADLINE_SUGGESTIONS[key] ?? []), ...HEADLINE_SUGGESTIONS.default])]

  function toggleHighlight(h: string) {
    setHighlights((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]))
  }
  function addCustom() {
    const v = custom.trim()
    if (v && !highlights.includes(v)) setHighlights((p) => [...p, v])
    setCustom('')
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const files = Array.from(input.files ?? [])
    if (!files.length) return
    setUploadError('')
    const supabase = createClient()
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      setProgress(`Enviando ${i + 1} de ${files.length}…`)
      try {
        const blob = await compress(files[i])
        const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
        const signed = await createPhotoUpload(ext)
        if ('error' in signed) throw new Error(signed.error)
        const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(signed.path, signed.token, blob, { contentType: blob.type })
        if (error) throw new Error(error.message)
        urls.push(signed.publicUrl)
      } catch (err) {
        setUploadError(`Não consegui enviar "${files[i].name}": ${err instanceof Error ? err.message : 'erro'}`)
      }
    }
    if (urls.length) setPhotos((p) => [...p, ...urls])
    setProgress('')
    input.value = ''
  }

  function move(i: number, d: -1 | 1) {
    setPhotos((p) => {
      const j = i + d
      if (j < 0 || j >= p.length) return p
      const n = [...p]
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
  }
  function makeCover(i: number) {
    setPhotos((p) => [p[i], ...p.filter((_, j) => j !== i)])
  }

  const mini = 'rounded-md bg-black/70 px-2 py-1 text-xs text-white hover:bg-black disabled:opacity-30'

  return (
    <form action={saveVehicle} className="space-y-5 pb-28 md:pb-6">
      {vehicle && <input type="hidden" name="id" value={vehicle.id} />}
      <input type="hidden" name="photoUrls" value={JSON.stringify(photos)} />
      {highlights.map((h) => <input key={h} type="hidden" name="highlights" value={h} />)}

      <Section title="Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <ChipInput name="brand" label="Marca" value={brand} onChange={setBrand} options={BRANDS} required />
          <ChipInput name="model" label="Modelo (nome do carro)" value={model} onChange={setModel} options={MODELS} required />
          <Field name="version" label="Versão" defaultValue={vehicle?.version} />
          <Field name="engine" label="Motor" defaultValue={vehicle?.engine} />
        </div>
      </Section>

      <Section title="Ficha">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="yearManufacture" label="Ano fabricação" type="number" inputMode="numeric" defaultValue={vehicle?.yearManufacture} />
          <Field name="yearModel" label="Ano modelo" type="number" inputMode="numeric" defaultValue={vehicle?.yearModel} />
          <Field name="km" label="KM" type="number" inputMode="numeric" defaultValue={vehicle?.km} />
          <Field name="color" label="Cor" defaultValue={vehicle?.color} />
          <ChipInput name="transmission" label="Câmbio" value={transmission} onChange={setTransmission} options={['Automático', 'Manual', 'CVT']} />
          <ChipInput name="fuel" label="Combustível" value={fuel} onChange={setFuel} options={['Gasolina', 'Flex', 'Diesel', 'Híbrido']} />
          <ChipInput name="drivetrain" label="Tração" value={drivetrain} onChange={setDrivetrain} options={['4x2', '4x4', 'AWD']} />
          <Field name="seats" label="Lugares" type="number" inputMode="numeric" defaultValue={vehicle?.seats} />
        </div>
      </Section>

      <Section title="Fotos">
        <label className="btn-ghost inline-block cursor-pointer rounded-lg px-4 py-2 text-sm">
          Adicionar fotos
          <input type="file" accept="image/*" multiple onChange={onUpload} disabled={uploading} className="sr-only" />
        </label>
        {uploading && <p className="mt-2 text-sm text-gold-light">{progress}</p>}
        {uploadError && <p className="mt-2 text-sm text-red-400">{uploadError}</p>}
        <p className="mt-2 text-xs text-muted">A primeira foto é a capa. Imagens são comprimidas antes do envio.</p>
        {photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((u, i) => (
              <li key={u} className="relative overflow-hidden rounded-lg border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="aspect-[4/3] w-full object-cover" />
                {i === 0 && <span className="btn-gold absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase">Capa</span>}
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-1 bg-gradient-to-t from-black/80 p-2">
                  <div className="flex gap-1">
                    <button type="button" className={mini} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Mover para trás">←</button>
                    <button type="button" className={mini} disabled={i === photos.length - 1} onClick={() => move(i, 1)} aria-label="Mover para frente">→</button>
                  </div>
                  <div className="flex gap-1">
                    {i !== 0 && <button type="button" className={mini} onClick={() => makeCover(i)}>Capa</button>}
                    <button type="button" className={`${mini} !text-red-300`} onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}>Remover</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Destaques">
        <div className="flex flex-wrap gap-2">
          {[...HIGHLIGHT_SUGGESTIONS, ...highlights.filter((h) => !HIGHLIGHT_SUGGESTIONS.includes(h))].map((h) => {
            const on = highlights.includes(h)
            return (
              <button type="button" key={h} onClick={() => toggleHighlight(h)}
                className={`${chip} ${on ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/10 text-muted hover:border-gold'}`}>
                {on ? '✓ ' : '+ '}{h}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Outro destaque…" className="field"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }} />
          <button type="button" onClick={addCustom} className="btn-ghost shrink-0 rounded-lg px-4 text-sm">Adicionar</button>
        </div>
      </Section>

      <Section title="Copy">
        <label className="label" htmlFor="headline">Headline</label>
        <input id="headline" name="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} className="field" />
        <div className="mt-3 flex flex-wrap gap-2">
          {headlineSuggestions.map((s) => (
            <button type="button" key={s} onClick={() => setHeadline(s)}
              className={`${chip} text-left ${headline === s ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/10 text-muted hover:border-gold'}`}>
              {s}
            </button>
          ))}
        </div>
        <label className="label mt-5" htmlFor="description">Descrição</label>
        <textarea id="description" name="description" rows={5} defaultValue={vehicle?.description} className="field" />
      </Section>

      <Section title="Publicação">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={vehicle?.status ?? 'disponivel'} className="field">
              <option value="disponivel">Disponível</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>
          </div>
          <div className="flex flex-col justify-end gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="visible" defaultChecked={vehicle?.visible ?? true} className="accent-[#d4af37]" /> Visível no site</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={vehicle?.featured ?? false} className="accent-[#d4af37]" /> Destaque</label>
          </div>
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gold bg-coal/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <button type="submit" disabled={uploading}
          className="btn-gold w-full rounded-xl px-6 py-3.5 text-sm font-bold uppercase tracking-widest disabled:opacity-60 md:w-auto">
          {uploading ? 'Aguarde o envio das fotos…' : 'Salvar veículo'}
        </button>
      </div>
    </form>
  )
}
