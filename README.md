# Rei do SUV — site + painel

Landing page premium do **Rei do SUV Multimarcas** (estoque de SUVs topo de linha, sem preço, contato pelo WhatsApp) e painel interno para cadastrar veículos e fotos.

Stack: Next.js 16 · React 19 · Tailwind CSS 4 · Supabase (banco, login e fotos).

## Colocar no ar (uma vez só)

### 1. Banco de dados (Supabase)
1. Abra o projeto no Supabase → **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`supabase/migrations/0001_rei_do_suv.sql`](supabase/migrations/0001_rei_do_suv.sql) e, no fim do arquivo, troque `DEFINA_A_SENHA` pela senha do primeiro acesso. Clique em **Run**.

Isso cria as tabelas (`suv_*`), as regras de segurança, o bucket de fotos `suv-veiculos` e o primeiro acesso ao painel:
- e-mail: `fabriciomouratreinador@gmail.com`
- senha: a que você definiu no passo acima (se esse e-mail já existia no projeto, continua valendo a senha antiga)

### 2. Hospedagem (Vercel)
1. Em vercel.com → **Add New → Project** → importe este repositório.
2. Em **Environment Variables**, cadastre:

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://odwouhhxvlkpkjklwoxo.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave **anon** (Supabase → Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | chave **service_role**. Ela é secreta: nunca vai para o código |
| `NEXT_PUBLIC_SITE_URL` | o domínio do site, ex.: `https://reidosuv.com.br` |

3. Clique em **Deploy**.

## Uso do dia a dia
- **Painel:** acesse `seusite.com/painel`. Também há o link "Área da equipe" no rodapé.
- **Veículos:**
  - Para cadastrar: **Novo veículo**. Preencha a ficha, clique nos destaques e na headline sugerida e suba as fotos. As fotos são comprimidas automaticamente, e a primeira é a capa.
  - **Status:**
    - *Disponível*: o carro aparece normalmente.
    - *Reservado*: ganha um selo.
    - *Vendido*: vai para o fim da lista com o selo, como prova social. Para sumir do site, desmarque *Visível*.
  - **Destaque:** o carro vai para a capa do site e aparece primeiro.
- **Usuários:** cadastre o e-mail e a senha do sócio. Ele terá acesso completo ao painel.
- **Configurações:** WhatsApp, Instagram, TikTok, cidade, horário e, se quiser, título e subtítulo da capa.
- **Visão geral:** mostra os cliques no WhatsApp por carro nos últimos 30 dias, ou seja, quais carros estão chamando mais atenção.

## Textos do site
Todas as frases (capa, manifesto, pilares, FAQ etc.) ficam em [`lib/copy.ts`](lib/copy.ts).

## Desenvolvimento
```bash
npm ci
npm run dev      # sem .env.local o site roda com 2 carros de demonstração
npm test         # testes
npm run lint
npm run build
```
Crie um `.env.local` a partir do `.env.example` para conectar ao Supabase.
