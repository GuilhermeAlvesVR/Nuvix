# Filtros financeiros

Data: 2026-06-04

## Objetivo

Permitir que os agrupamentos de pagamentos confirmados sejam filtrados por periodo e paciente.

## Funcionalidades implementadas

- Filtro por data inicial (`De`).
- Filtro por data final (`Ate`).
- Filtro por paciente.
- Botao para aplicar filtros.
- Botao para limpar filtros.
- Os cards de confirmados por dia, mes e paciente passam a respeitar os filtros escolhidos.
- O total geral de pagamentos confirmados tambem respeita os filtros.

## Regras preservadas

- Apenas pagamentos `CONFIRMED` entram nos totais filtrados.
- Todos os dados continuam filtrados por `workspaceId` da empresa logada.
- Pagamentos pendentes e cancelados nao entram nos totais confirmados.

## Arquivos alterados

- `src/app/app/financeiro/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha exportacao de relatorio.
- O relatorio financeiro completo com despesas permanece para US-011.
