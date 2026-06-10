# Detalhe por item: consulta

Data: 2026-06-04

## Objetivo

Criar a pagina de detalhe da consulta/agendamento para centralizar status, financeiro, paciente, profissional, pagamentos e acesso ao atendimento clinico.

## Funcionalidades implementadas

- Nova rota `/app/agenda/[id]`.
- Agenda agora tem link `Detalhes` por consulta.
- Historico de consultas no detalhe do paciente agora abre o detalhe da consulta.
- Detalhe da consulta mostra:
  - paciente;
  - profissional;
  - horario de inicio e fim;
  - status;
  - status financeiro;
  - valor;
  - restante;
  - observacoes administrativas;
  - pagamentos vinculados;
  - resumo do atendimento clinico quando permitido.
- Administradores e recepcionistas podem alterar status pelo detalhe.
- Alteracao de status no detalhe retorna para a propria pagina da consulta.

## Privacidade e RBAC

- Consulta sempre filtrada por `workspaceId`.
- Acesso ao atendimento clinico continua restrito a `ADMIN` ou profissional vinculado.
- Dados clinicos nao sao expostos para recepcionista no detalhe.

## Arquivos alterados

- `src/app/app/agenda/[id]/page.tsx`
- `src/app/app/agenda/page.tsx`
- `src/app/app/agenda/actions.ts`
- `src/app/app/pacientes/[id]/page.tsx`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Proximo passo sugerido

- Criar detalhe financeiro para pagamento/despesa, ou adicionar filtros por profissional/status na agenda.
