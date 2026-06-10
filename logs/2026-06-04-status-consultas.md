# Alteracao de status da consulta

Data: 2026-06-04

## Objetivo

Implementar a US-006 do MVP: permitir que usuarios autorizados alterem o status da consulta e registrar usuario/data da alteracao.

## Funcionalidades implementadas

- Formulario de alteracao de status em cada card da agenda.
- Status disponiveis:
  - `SCHEDULED` / Agendada;
  - `CONFIRMED` / Confirmada;
  - `IN_PROGRESS` / Em atendimento;
  - `COMPLETED` / Realizada;
  - `CANCELLED` / Cancelada;
  - `NO_SHOW` / Falta.
- Mensagem de sucesso ao atualizar status.
- Registro de auditoria em `AuditLog` para cada mudanca real de status.
- Ao cancelar consulta, o status financeiro passa para `CANCELLED`.

## Regras de negocio e seguranca

- A action exige usuario autenticado de empresa ativa.
- A consulta alterada precisa pertencer ao `workspaceId` da sessao atual.
- Status recebido pelo formulario e validado contra o enum permitido.
- Alteracao registra em `AuditLog`:
  - usuario;
  - empresa;
  - entidade `Appointment`;
  - id da consulta;
  - status anterior;
  - novo status;
  - status financeiro anterior;
  - novo status financeiro.
- `AuditLog.createdAt` registra a data/hora da alteracao.
- Consulta cancelada fica com financeiro cancelado para nao ser considerada receita realizada.

## Criterios da US-006

- Status pode mudar para confirmada, em atendimento, realizada, cancelada ou falta: atendido.
- Consulta cancelada nao aparece como receita realizada: atendido ao marcar financeiro como `CANCELLED`.
- Alteracao registra usuario e data: atendido via `AuditLog.userId` e `AuditLog.createdAt`.

## Arquivos alterados

- `src/app/app/agenda/actions.ts`
- `src/app/app/agenda/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha tela para visualizar o historico de auditoria da consulta.
- Ainda nao ha filtros de agenda por status/data/profissional.
- A proxima etapa natural e US-007: registrar atendimento/prontuario.
