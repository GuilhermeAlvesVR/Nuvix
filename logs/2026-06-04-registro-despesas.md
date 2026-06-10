# Registro de despesas

Data: 2026-06-04

## Objetivo

Implementar a US-009 do MVP: registrar despesas do consultorio e considerar apenas despesas confirmadas no resultado financeiro.

## Funcionalidades implementadas

- Formulario de nova despesa em `/app/financeiro`.
- Campos da despesa:
  - descricao;
  - categoria;
  - valor;
  - status;
  - data;
  - observacoes.
- Listagem de despesas registradas no periodo filtrado.
- Resumo financeiro atualizado com:
  - pagamentos confirmados;
  - saldo pendente em consultas;
  - despesas confirmadas;
  - saldo confirmado.
- Cache financeiro atualizado para incluir despesas.
- Invalidacao do cache financeiro ao registrar despesa.

## Regras de negocio e seguranca

- Apenas `ADMIN` pode registrar despesas.
- Despesa exige descricao, categoria, valor positivo, status e data.
- Apenas despesas `CONFIRMED` entram no total de despesas e no saldo confirmado.
- Despesas `CANCELLED` permanecem no historico, mas nao entram no saldo.
- Todos os dados sao filtrados por `workspaceId` da empresa logada.

## Criterios da US-009

- Despesa exige descricao, categoria, valor e data: atendido.
- Despesa confirmada entra no relatorio financeiro: atendido no resumo financeiro atual.
- Despesa cancelada nao entra no saldo final: atendido.

## Arquivos alterados

- `src/app/app/financeiro/actions.ts`
- `src/app/app/financeiro/page.tsx`
- `src/lib/app-cache.ts`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha edicao/cancelamento posterior de despesas.
- O relatorio financeiro completo por periodo permanece para US-011.
