# Identidade visual Nuvix

Data: 2026-06-04

## Objetivo

Aplicar a identidade visual propria do Nuvix nas telas da plataforma, preservando o branding por cliente dentro do painel operacional `/app`.

## Paleta aplicada

- Branco puro: `#FFFFFF`
- Cinza claro: `#F4F4F4`
- Cinza medio: `#8C8C8C`
- Grafite escuro: `#1C1C1C`
- Preto absoluto: `#121212`

## Funcionalidades implementadas

- Criadas variaveis CSS `--nuvix-*` em `src/app/globals.css`.
- Criada classe `nuvix-surface` para telas institucionais da plataforma.
- Aplicado fundo grafite/preto com contraste branco nas telas Nuvix.
- Aplicada logo Nuvix nas telas publicas e no admin da plataforma.
- Ajustados botoes, inputs, cards, formularios e textos secundarios em superficies Nuvix.

## Telas alteradas

- `/`
- `/login`
- `/cadastro`
- `/admin`

## Arquivos alterados

- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/app/cadastro/page.tsx`
- `src/app/admin/layout.tsx`

## Observacao

- A logo foi encontrada em `public/brand/nuvix-logo.png.png`.
- O painel interno `/app` continua usando as cores configuradas por empresa.

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha favicon especifico do Nuvix.
- Se houver uma versao de icone separada, pode ser aplicada depois em `metadata.icons`.
