import type { Vehicle } from './types'

/**
 * Dados de demonstração — usados SOMENTE quando o Supabase não está configurado
 * (preview local). Em produção o estoque vem do painel.
 */
export const DEMO_VEHICLES: Vehicle[] = [
  {
    id: 'demo-sorento',
    slug: 'kia-sorento-ex-v6-demo',
    brand: 'Kia',
    model: 'Sorento',
    version: 'EX 3.5 V6',
    engine: '3.5 V6 · 270 cv',
    drivetrain: 'AWD',
    yearManufacture: 2017,
    yearModel: 2018,
    km: 62000,
    color: 'Branco Pérola',
    transmission: 'Automático 6 marchas',
    fuel: 'Gasolina',
    seats: 7,
    highlights: ['Teto solar panorâmico', 'Bancos em couro', '7 lugares', 'Rodas de liga leve', 'Câmera de ré'],
    headline: 'Sete lugares. Teto que abre o céu. Zero concessões.',
    description:
      'Versão top de linha com teto panorâmico, interior em couro claro e acabamento impecável. Pouco rodado, revisado e pronto para a próxima viagem em família.',
    status: 'disponivel',
    visible: true,
    featured: true,
    sortOrder: 0,
    photos: ['/seed/sorento-1.jpg', '/seed/sorento-2.jpg'],
  },
  {
    id: 'demo-sportage',
    slug: 'kia-sportage-ex-demo',
    brand: 'Kia',
    model: 'Sportage',
    version: 'EX 2.0',
    engine: '2.0 16V',
    drivetrain: '4x2',
    yearManufacture: 2013,
    yearModel: 2014,
    km: 71000,
    color: 'Prata',
    transmission: 'Automático',
    fuel: 'Flex',
    seats: 5,
    highlights: ['Teto solar', 'Bancos em couro', 'Rodas de liga leve', 'Chave presencial'],
    headline: 'Esportivo no nome, impecável no estado.',
    description: 'Sportage na versão mais completa, com teto solar e interior em couro. Conservação acima da média para o ano.',
    status: 'disponivel',
    visible: true,
    featured: false,
    sortOrder: 1,
    photos: ['/seed/sportage-1.jpg'],
  },
]
