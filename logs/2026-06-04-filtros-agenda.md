# Filtros avancados da agenda

Data: 2026-06-04

## Objetivo

Melhorar o uso diario da agenda com filtros por profissional e status, mantendo o filtro por dia.

## Funcionalidades implementadas

- Filtro por profissional em `/app/agenda`.
- Filtro por status da consulta em `/app/agenda`.
- Cache da agenda agora considera:
  - empresa;
  - dia;
  - profissional;
  - status.
- Link `Hoje` permanece disponivel.
- Link `Limpar` remove todos os filtros.
- Ao alterar status pela lista, a agenda volta para a mesma URL filtrada.
- Retorno seguro para `/app/agenda`, `/app/agenda?...` e `/app/agenda/[id]`.

## Arquivos alterados

- `src/lib/app-cache.ts`
- `src/app/app/agenda/page.tsx`
- `src/app/app/agenda/actions.ts`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- O filtro por dia continua sendo o padrao da agenda.
