# Correcoes de cache, datas e profissionais

Data: 2026-06-04

## Objetivo

Corrigir erro de data causado por dados serializados em cache e reduzir custo da consulta de profissionais.

## Problemas identificados

- Dados vindos de `unstable_cache` podem retornar datas serializadas como string.
- `Intl.DateTimeFormat` quebrava quando recebia valor invalido ou nao convertido para `Date`.
- A tela de profissionais usava filtro relacional `professional: null`, potencialmente mais custoso.

## Melhorias implementadas

- `formatDateTime` da agenda agora aceita `Date` ou `string` e valida antes de formatar.
- Formatadores do financeiro e atendimento tambem aceitam `Date` ou `string`.
- Consulta de profissionais foi simplificada:
  - busca profissionais;
  - busca usuarios profissionais ativos;
  - filtra usuarios ja vinculados em memoria.

## Arquivos alterados

- `src/app/app/agenda/page.tsx`
- `src/app/app/agenda/[id]/atendimento/page.tsx`
- `src/app/app/financeiro/page.tsx`
- `src/lib/app-cache.ts`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- A primeira abertura apos reiniciar ou invalidar cache pode continuar mais lenta.
- A segunda abertura da mesma rota deve ser mais rapida.
