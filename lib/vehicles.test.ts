import { describe, expect, it } from 'vitest'
import { DEMO_VEHICLES } from './demo'
import { WA_MESSAGES, formatKm, normalizePhone, specList, waLink, yearLabel } from './vehicles'

describe('vehicles helpers', () => {
  it('formata ano', () => {
    expect(yearLabel({ yearManufacture: 2017, yearModel: 2018 })).toBe('2017/2018')
    expect(yearLabel({ yearManufacture: 2018, yearModel: 2018 })).toBe('2018')
    expect(yearLabel({ yearManufacture: null, yearModel: null })).toBe('')
  })
  it('formata km', () => {
    expect(formatKm(58000)).toBe('58.000 km')
    expect(formatKm(null)).toBe('')
  })
  it('normaliza telefone', () => {
    expect(normalizePhone('+55 11 95396-5259')).toBe('5511953965259')
    expect(normalizePhone('(11) 95396-5259')).toBe('5511953965259')
  })
  it('monta link do WhatsApp com mensagem do carro', () => {
    const url = waLink('11953965259', WA_MESSAGES.vehicle(DEMO_VEHICLES[0]))
    expect(url.startsWith('https://wa.me/5511953965259?text=')).toBe(true)
    expect(decodeURIComponent(url.split('text=')[1])).toContain('Kia Sorento EX 3.5 V6 2017/2018')
  })
  it('ficha omite campos vazios', () => {
    const specs = specList({ ...DEMO_VEHICLES[0], fuel: '', seats: null })
    expect(specs.map((s) => s.label)).not.toContain('Combustível')
    expect(specs.map((s) => s.label)).not.toContain('Lugares')
  })
})
