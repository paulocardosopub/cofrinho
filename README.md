# Cofrinho App

Cofrinho App é um app financeiro web/mobile para organizar despesas, receitas, investimentos, FIIs, metas e relatórios com apoio de IA. O app prioriza importação por CSV, imagem ou PDF para evitar que o usuário precise entregar senha de banco.

## Funcionalidades

- Autenticação local para desenvolvimento e Supabase Auth quando configurado.
- Dados isolados por usuário.
- Dashboard com saldos, receitas, despesas, resultado mensal e patrimônio investido.
- CRUD de transações com filtros, busca, recorrência, tags e ações em massa.
- Importação de CSV real e prévia inteligente para imagens/PDF.
- CRUD de categorias com orçamento mensal.
- Carteira de investimentos com FIIs, CDB, renda fixa, ações, crypto e outros.
- Radar de FIIs com atualização de cotas, comparação de preço médio, valorização, proventos e retorno total.
- Guru financeiro com chat, insights, análise e metas.
- Relatórios visuais.
- Configurações, backup JSON e sincronização Supabase.

## Rodar localmente

```bash
npm install
npm run dev
```

O app abre em `http://localhost:5173`.

Conta demo local:

- E-mail: `paulo@cofrinho.local`
- Senha: `demo123`

## Build

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AI_ENDPOINT=
VITE_QUOTES_ENDPOINT=
```

- `VITE_SUPABASE_URL`: URL do projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: chave anon pública do Supabase.
- `VITE_AI_ENDPOINT`: endpoint seguro opcional para IA/OCR. Não coloque chave OpenAI no front-end.
- `VITE_QUOTES_ENDPOINT`: endpoint opcional para cotações. Se vazio, o app tenta usar `VITE_SUPABASE_URL/functions/v1/fund-quotes`.

Sem Supabase configurado, o app usa armazenamento local do navegador.

## Supabase

O schema inicial está em:

```bash
supabase/migrations/20260707000000_initial_schema.sql
```

Ele cria a tabela `public.cofrinho_user_app_data` com `payload jsonb` e políticas RLS para que cada usuário autenticado leia e grave apenas os próprios dados.

Aplicar via CLI:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
supabase functions deploy fund-quotes
```

No painel do Supabase, habilite Email/Password em Authentication. Depois configure as variáveis no ambiente do deploy.

## Deploy

O Supabase cuida de autenticação e dados. Para o front-end, use GitHub Pages, Vercel, Netlify ou outro host estático.

Este repositório já inclui o workflow `.github/workflows/deploy-pages.yml` para GitHub Pages. Configure Pages como "GitHub Actions" e adicione estes secrets no repositório, se for usar Supabase:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AI_ENDPOINT` opcional

Build command:

```bash
npm run build
```

Publish directory:

```bash
dist
```

## Observações de segurança

- O modo local é apenas para desenvolvimento e testes.
- A importação por imagem/PDF está mockada no front-end; produção deve chamar backend seguro para OCR/IA.
- O app não movimenta dinheiro, não faz pagamentos e não pede senha de banco.
- Open Finance não foi implementado porque a proposta atual é importação manual/assistida.
