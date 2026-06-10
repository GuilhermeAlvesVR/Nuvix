# Agendamento de consultas

Data: 2026-06-04

## Objetivo

Implementar a US-005 do MVP: permitir que administradores e recepcionistas agendem consulta para um paciente com um profissional, bloqueando conflito de horario.

## Funcionalidades implementadas

- Rota `/app/agenda` substituida por agenda real.
- Formulario de agendamento com:
  - paciente ativo;
  - profissional ativo;
  - data;
  - hora;
  - duracao;
  - valor;
  - tipo de atendimento;
  - observacoes administrativas.
- Listagem das consultas dos proximos 30 dias.
- Exibicao de paciente, profissional, horario, valor, status e financeiro.
- Bloqueio de sobreposicao de horarios para o mesmo profissional.

## Regras de negocio e seguranca

- Somente usuarios `ADMIN` e `RECEPTIONIST` podem criar agendamentos.
- Usuarios autenticados da empresa podem visualizar a agenda da propria empresa.
- Agendamento filtra paciente e profissional por `workspaceId` da sessao atual.
- Apenas pacientes ativos aparecem no formulario e sao aceitos no servidor.
- Apenas profissionais ativos aparecem no formulario e sao aceitos no servidor.
- Conflito e verificado por intervalo: `startsAt < novoFim` e `endsAt > novoInicio`.
- Consultas canceladas ou falta (`CANCELLED`, `NO_SHOW`) nao bloqueiam novo agendamento no mesmo horario.
- Consulta nasce com `status = SCHEDULED` e `financialStatus = PENDING`.
- Valor e obrigatorio e deve ser positivo.
- Duracao deve ficar entre 15 e 480 minutos.

## Criterios da US-005

- Consulta exige paciente, profissional, data, hora e valor: atendido.
- Sistema bloqueia conflito de horario para o mesmo profissional: atendido.
- Consulta nasce com status agendada e financeiro pendente: atendido.

## Arquivos alterados

- `src/app/app/agenda/actions.ts`
- `src/app/app/agenda/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha tela para alterar status da consulta; isso pertence a US-006.
- Ainda nao ha filtros de agenda por data/profissional; a tela lista os proximos 30 dias.
- Ainda nao ha edicao ou cancelamento de consulta.
