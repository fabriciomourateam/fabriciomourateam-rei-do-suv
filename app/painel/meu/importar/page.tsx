import Link from 'next/link'
import { requireOwner } from '@/lib/auth'
import { getFinanceConfig } from '@/lib/finance-store'
import { Importer } from './importer'

export const dynamic = 'force-dynamic'

const EXAMPLE = `{
  "movimentacoes": [
    { "data": "2026-10-19", "tipo": "pagamento", "direcao": "saida", "descricao": "...", "valor": "12.547,39", "carro": "Sorento preta", "obs": "" }
  ],
  "carros": [
    {
      "nome": "Kia Sorento 2014 branca", "versao": "", "ano": "2014", "placa": "OGF-0B59",
      "compra": { "valor": "63.000,00", "data": "2026-09-20", "pagoPor": "Fabricio" },
      "custos": [
        { "categoria": "auto_avaliar", "descricao": "Taxa Auto Avaliar", "valor": "1.000,00", "data": null, "pagoPor": "Fabricio", "dividir": false }
      ],
      "venda": { "valor": "86.900,00", "data": "2026-10-15", "recebidoPor": "Élcio" }
    }
  ]
}`

export default async function ImportarPage() {
  await requireOwner()
  const config = await getFinanceConfig()
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/painel/meu" className="text-sm text-muted hover:text-gold-light">← Meu financeiro</Link>
      <h1 className="font-display text-gold mb-1 mt-2 text-2xl">Importar histórico</h1>
      <p className="text-xs text-muted">🔒 Só você vê esta área</p>
      <p className="mt-4 text-sm text-muted">
        Cole aqui o JSON que o Claude preparou, confira o resumo e importe. Pode importar o mesmo arquivo de novo sem medo: carro com o mesmo nome é atualizado e movimentação igual é ignorada.
        Os carros viram registros &quot;histórico&quot; no Financeiro.
      </p>

      <details className="mt-4 rounded-xl border border-gold bg-coal p-4 text-sm">
        <summary className="cursor-pointer text-gold-light">Formato</summary>
        <div className="mt-3 space-y-2 text-muted">
          <p>Valores aceitam texto em reais (&quot;12.547,39&quot;) ou número (12547.39). Datas no formato AAAA-MM-DD.</p>
          <p>
            <code>tipo</code>: aporte, retirada, pagamento, recebimento, acerto_socio, outro. <code>direcao</code>: entrada ou saida
            (opcional, exceto em acerto_socio e outro).
          </p>
          <p>
            <code>pagoPor</code> / <code>recebidoPor</code>: nome de um sócio ({config.partners.map((p) => p.name).join(', ')}), &quot;Metade cada&quot;,
            &quot;Descontado da venda&quot; (só em custos) ou vazio. <code>dividir: false</code> = custo só de quem pagou.
          </p>
          <p><code>categoria</code>: auto_avaliar, manutencao, transporte, documentacao, estetica, comissao, outros.</p>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-text">{EXAMPLE}</pre>
        </div>
      </details>

      <Importer partners={config.partners} />
    </div>
  )
}
