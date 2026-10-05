/**
 * Todo o texto editável do site (painel → "Textos do site").
 * Fica salvo como JSON no Storage (bucket suv-veiculos, arquivo site/content.json),
 * mesclado por cima destes padrões — campos não salvos usam o texto padrão.
 *
 * Convenções nos textos:
 *  - quebra de linha (Enter) vira quebra de linha no site
 *  - *texto entre asteriscos* vira destaque dourado
 *  - nas mensagens de WhatsApp, {carro} é trocado pelo nome do carro
 */

export const SECTION_IDS = ['marquee', 'manifesto', 'inventory', 'pillars', 'steps', 'visit', 'faq', 'finalCta'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export const SECTION_LABELS: Record<SectionId, string> = {
  marquee: 'Faixa de modelos (rolando)',
  manifesto: 'Manifesto',
  inventory: 'Estoque',
  pillars: 'O Padrão Rei',
  steps: 'Como funciona',
  visit: 'Visita com hora marcada',
  faq: 'Perguntas frequentes',
  finalCta: 'Chamada final',
}

export interface TitleText {
  title: string
  text: string
}

export interface SiteContent {
  sections: { id: SectionId; visible: boolean }[]
  seo: { title: string; description: string }
  hero: {
    eyebrow: string
    titleTop: string
    titleBottom: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    proof: TitleText[]
    featuredLabel: string
    scrollLabel: string
  }
  marquee: string[]
  manifesto: { eyebrow: string; title: string; body: string }
  inventory: { eyebrow: string; title: string; subtitle: string; empty: string; emptyCta: string; cta: string; ctaSold: string; featuredBadge: string; filterAll: string }
  pillars: { eyebrow: string; title: string; subtitle: string; items: TitleText[] }
  steps: { eyebrow: string; title: string; items: TitleText[] }
  visit: { eyebrow: string; title: string; body: string; cta: string; whereLabel: string; whenLabel: string }
  faq: { eyebrow: string; title: string; subtitle: string; items: { q: string; a: string }[] }
  finalCta: { title: string; subtitle: string; cta: string }
  vehiclePage: {
    badge: string
    highlightsTitle: string
    aboutTitle: string
    cta: string
    ctaSold: string
    note: string
    pillarsTitle: string
    othersTitle: string
    breadcrumbHome: string
    breadcrumbStock: string
    seeAll: string
  }
  header: { whatsappButton: string; nav: { estoque: string; padrao: string; visita: string; duvidas: string } }
  footer: { tagline: string; copyright: string; teamLink: string }
  notFound: { eyebrow: string; title: string; subtitle: string; cta: string }
  whatsapp: { general: string; visit: string; vehicle: string; sold: string }
}

export const DEFAULT_CONTENT: SiteContent = {
  sections: SECTION_IDS.map((id) => ({ id, visible: true })),
  seo: {
    title: 'Rei do SUV | SUVs premium top de linha',
    description:
      'Curadoria de SUVs premium: Sorento, Santa Fe, Sportage e mais. Só versões top de linha, baixa quilometragem e estado de showroom. Agende sua visita.',
  },
  hero: {
    eyebrow: 'Curadoria de SUVs premium',
    titleTop: 'Não é só um SUV.',
    titleBottom: 'É o melhor exemplar dele.',
    subtitle:
      'Só versões top de linha, quilometragem baixa e estado de showroom. Cada carro aqui passou pelo nosso crivo antes de chegar à sua garagem.',
    ctaPrimary: 'Ver o estoque',
    ctaSecondary: 'Agendar uma visita',
    proof: [
      { title: 'Top de linha', text: 'Só as versões mais completas' },
      { title: 'KM baixo', text: 'Carros pouco rodados' },
      { title: 'Procedência', text: 'Histórico conferido' },
      { title: 'Hora marcada', text: 'O carro te espera' },
    ],
    featuredLabel: 'Em destaque',
    scrollLabel: 'Role',
  },
  marquee: ['Sorento', 'Santa Fe', 'Sportage', 'Teto panorâmico', 'Bancos em couro', 'Baixa quilometragem', 'Versões top de linha'],
  manifesto: {
    eyebrow: 'O critério do Rei',
    title: 'A gente *recusa* mais carros\ndo que compra.',
    body: 'Não trabalhamos com volume. Trabalhamos com escolha. Se não é a versão mais completa, se a quilometragem não convence, se o histórico tem lacuna — não entra. O que sobra é o que você vê aqui: poucos carros, todos impecáveis.',
  },
  inventory: {
    eyebrow: 'Estoque selecionado',
    title: 'Poucos. Todos excepcionais.',
    subtitle: 'Unidades únicas. Quando sai, não volta.',
    empty: 'Estoque se renovando. Chama no WhatsApp e descubra o que está chegando antes de todo mundo.',
    emptyCta: 'Quero saber primeiro',
    cta: 'Quero esse',
    ctaSold: 'Quero um parecido',
    featuredBadge: 'Destaque',
    filterAll: 'Todos',
  },
  pillars: {
    eyebrow: 'O Padrão Rei',
    title: 'Quatro regras.\n*Nenhuma exceção.*',
    subtitle: 'Todo carro que entra no nosso estoque passa pelo mesmo crivo. Se falhar em uma delas, não chega até você.',
    items: [
      { title: 'Só top de linha', text: 'Teto solar, couro, rodas de liga, tecnologia completa. Versão de entrada não entra no nosso pátio.' },
      { title: 'Quilometragem baixa', text: 'Carros pouco rodados, com uso real comprovado. Nenhuma surpresa no painel.' },
      { title: 'Procedência conferida', text: 'Histórico, documentação e revisões checados antes de qualquer anúncio.' },
      { title: 'Estado de showroom', text: 'Higienizado, revisado e pronto pra rodar. Você chega, olha e sente a diferença.' },
    ],
  },
  steps: {
    eyebrow: 'Como funciona',
    title: 'Do primeiro olhar *à chave na mão.*',
    items: [
      { title: 'Escolha', text: 'Navegue pelo estoque e separe o que te tirou o fôlego.' },
      { title: 'Chame no WhatsApp', text: 'Um clique e você fala direto com a gente. Sem robô, sem fila.' },
      { title: 'Visite com hora marcada', text: 'O carro te espera limpo, posicionado e com tempo pra você avaliar sem pressa.' },
      { title: 'Saia dirigindo', text: 'Condições, troca e documentação resolvidas junto com você. Simples assim.' },
    ],
  },
  visit: {
    eyebrow: 'Atendimento exclusivo',
    title: 'Sem vitrine lotada.\n*Sem vendedor te cercando.*',
    body: 'Você agenda, o carro te espera. Atendemos com hora marcada em um espaço reservado, pra você olhar cada detalhe com calma — do jeito que uma compra desse nível merece.',
    cta: 'Agendar minha visita',
    whereLabel: 'Onde',
    whenLabel: 'Quando',
  },
  faq: {
    eyebrow: 'Dúvidas',
    title: 'Perguntas\n*frequentes*',
    subtitle: 'Não achou o que procurava? Chama a gente — resposta rápida, de gente de verdade.',
    items: [
      {
        q: 'Por que vocês não mostram o preço no site?',
        a: 'Porque cada carro aqui é único e merece ser apresentado direito. Chama no WhatsApp: passamos valor, condições e todos os detalhes na hora, sem enrolação.',
      },
      { q: 'Vocês financiam?', a: 'Sim. Simulamos as condições com você, sem compromisso, e te ajudamos a encontrar a melhor forma de pagamento.' },
      { q: 'Aceitam meu carro na troca?', a: 'Avaliamos sim. Mande fotos e informações do seu carro pelo WhatsApp e já te passamos um retorno.' },
      { q: 'Posso ver e dirigir o carro antes de decidir?', a: 'Pode e deve. Agende sua visita: o carro fica reservado pra você no horário combinado.' },
      { q: 'Onde vocês ficam?', a: 'Atendemos com hora marcada em um espaço reservado. O endereço exato é enviado no agendamento pelo WhatsApp.' },
    ],
  },
  finalCta: {
    title: 'O próximo SUV da sua garagem já está aqui.',
    subtitle: 'Ele não vai ficar esperando muito tempo.',
    cta: 'Chamar no WhatsApp',
  },
  vehiclePage: {
    badge: 'Unidade única',
    highlightsTitle: 'Destaques',
    aboutTitle: 'Sobre este carro',
    cta: 'Quero esse — agendar visita',
    ctaSold: 'Quero um parecido',
    note: 'Valor e condições direto no WhatsApp. Resposta rápida, de gente de verdade.',
    pillarsTitle: 'O Padrão Rei',
    othersTitle: 'Outros SUVs *do Rei*',
    breadcrumbHome: 'Início',
    breadcrumbStock: 'Estoque',
    seeAll: 'Ver todo o estoque',
  },
  header: {
    whatsappButton: 'Falar no WhatsApp',
    nav: { estoque: 'Estoque', padrao: 'O Padrão Rei', visita: 'Visita', duvidas: 'Dúvidas' },
  },
  footer: {
    tagline: 'SUVs premium',
    copyright: 'Rei do SUV Multimarcas. Todos os direitos reservados.',
    teamLink: 'Área da equipe',
  },
  notFound: {
    eyebrow: 'Página não encontrada',
    title: 'Esse já saiu do pátio.',
    subtitle: 'Mas o próximo pode ser o seu.',
    cta: 'Ver o estoque',
  },
  whatsapp: {
    general: 'Olá! Vim pelo site do Rei do SUV e quero conhecer os carros disponíveis.',
    visit: 'Olá! Vim pelo site do Rei do SUV e quero agendar uma visita.',
    vehicle: 'Olá! Vi o {carro} no site do Rei do SUV e tenho interesse. Quando posso ver de perto?',
    sold: 'Olá! Vi que o {carro} foi vendido. Quero ser avisado quando chegar um parecido.',
  },
}

type Plain = Record<string, unknown>
const isObj = (v: unknown): v is Plain => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Mescla o JSON salvo sobre os padrões: objetos campo a campo, listas substituídas inteiras, tipos errados ignorados. */
export function mergeContent(saved: unknown): SiteContent {
  function merge(base: unknown, over: unknown): unknown {
    if (over === undefined || over === null) return base
    if (isObj(base)) {
      if (!isObj(over)) return base
      const out: Plain = {}
      for (const k of Object.keys(base)) out[k] = merge(base[k], over[k])
      return out
    }
    if (Array.isArray(base)) return Array.isArray(over) ? over : base
    return typeof over === typeof base ? over : base
  }
  const c = merge(DEFAULT_CONTENT, saved) as SiteContent
  // garante todas as seções, sem duplicadas, na ordem salva
  const seen = new Set<SectionId>()
  const sections = c.sections.filter(
    (s) => isObj(s) && SECTION_IDS.includes(s.id) && !seen.has(s.id) && seen.add(s.id),
  )
  for (const id of SECTION_IDS) if (!seen.has(id)) sections.push({ id, visible: true })
  return { ...c, sections }
}

/** Troca {carro} pelo nome do veículo. */
export function fillCar(template: string, carro: string): string {
  return template.replaceAll('{carro}', carro)
}
