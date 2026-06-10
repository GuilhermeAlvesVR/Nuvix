# Registro de pagamentos

Data: 2026-06-04

## Objetivo

Implementar o primeiro fluxo financeiro real do MVP: registrar pagamentos de consultas e atualizar automaticamente o status financeiro da consulta.

## Funcionalidades implementadas

- Rota `/app/financeiro` substituida por tela funcional.
- Resumo financeiro com:
  - total de pagamentos confirmados;
  - saldo pendente em consultas;
  - quantidade de consultas nao canceladas financeiramente.
- Formulario de pagamento com:
  - consulta;
  - valor;
  - forma de pagamento;
  - status do pagamento;
  - data;
  - observacoes.
- Listagem de consultas com valor, total pago confirmado, restante e status financeiro.
- Historico dos ultimos pagamentos registrados.

## Regras de negocio e seguranca

- Somente `ADMIN` e `RECEPTIONIST` podem registrar pagamentos.
- Todos os dados sao filtrados por `workspaceId` da sessao atual.
- Pagamento exige consulta, valor positivo, metodo, status e data.
- Consulta com financeiro `CANCELLED` nao aceita pagamento.
- Apenas pagamentos `CONFIRMED` atualizam o status financeiro da consulta.
- Status financeiro calculado:
  - sem pagamento confirmado: `PENDING`;
  - pagamento confirmado menor que o valor da consulta: `PARTIAL`;
  - pagamento confirmado igual ou maior que o valor da consulta: `PAID`.

## Criterios da US-008

- Pagamento exige valor, metodo, data e consulta: atendido.
- Pagamento confirmado atualiza status financeiro da consulta: atendido.
- Pagamento parcial deixa consulta como parcial: atendido.

## Arquivos alterados

- `src/app/app/financeiro/actions.ts`
- `src/app/app/financeiro/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha edicao/cancelamento posterior de pagamento.
- Ainda nao ha despesas; isso pertence a US-009.
- Ainda nao ha relatorio financeiro consolidado por periodo; isso pertence a US-011.
