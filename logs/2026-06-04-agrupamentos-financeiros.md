# Agrupamentos de pagamentos confirmados

Data: 2026-06-04

## Objetivo

Melhorar a tela financeira para separar pagamentos confirmados por dia, por mes e por paciente.

## Funcionalidades implementadas

- Nova consulta de pagamentos `CONFIRMED` para alimentar os agrupamentos.
- Card "Confirmados por dia" com os ultimos totais diarios.
- Card "Confirmados por mes" com totais mensais.
- Card "Confirmados por paciente" com pacientes ordenados pelo maior total confirmado.
- O total geral de pagamentos confirmados agora usa a mesma base de pagamentos `CONFIRMED` dos agrupamentos.

## Regras de negocio preservadas

- Apenas pagamentos confirmados entram nos totais agrupados.
- Todos os dados continuam filtrados por `workspaceId` da empresa logada.
- Pagamentos pendentes e cancelados continuam aparecendo apenas no historico, sem compor totais confirmados.

## Arquivos alterados

- `src/app/app/financeiro/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha filtro por periodo escolhido pelo usuario.
- Os agrupamentos exibem uma amostra recente baseada nos ultimos pagamentos confirmados consultados.
- Relatorio financeiro completo por periodo permanece para a US-011.
