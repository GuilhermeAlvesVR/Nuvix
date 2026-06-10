# Registro de atendimento clinico

Data: 2026-06-04

## Objetivo

Implementar a US-007 do MVP: permitir que o profissional autorizado registre informacoes da consulta e mantenha historico clinico do paciente.

## Funcionalidades implementadas

- Nova rota `/app/agenda/[id]/atendimento`.
- Link na agenda para acessar o atendimento da consulta.
- Formulario clinico com:
  - queixa ou motivo;
  - observacoes clinicas;
  - conduta e orientacoes;
  - retorno recomendado.
- Registro vinculado a consulta, paciente e profissional.
- Edicao do registro clinico existente da mesma consulta.
- Historico anterior do paciente com os ultimos registros clinicos.
- Visualizacao de auditoria basica do registro atual.

## Regras de negocio e seguranca

- Apenas usuario `PROFESSIONAL` vinculado ao profissional da consulta pode criar ou editar o atendimento.
- `ADMIN` da empresa pode visualizar o registro e historico, mas nao editar.
- `RECEPTIONIST` nao acessa dados clinicos da tela de atendimento.
- Consulta precisa pertencer ao `workspaceId` da sessao atual.
- Atendimento so pode ser salvo se a consulta estiver `IN_PROGRESS` ou `COMPLETED`.
- O servidor exige ao menos uma informacao clinica preenchida entre queixa, observacoes ou conduta.
- Cada criacao/edicao gera `AuditLog` com usuario, consulta, paciente e profissional.

## Criterios da US-007

- Apenas profissional autorizado registra atendimento: atendido.
- Registro fica vinculado a consulta e ao paciente: atendido via `ClinicalRecord`.
- Historico do paciente mostra registros anteriores: atendido na tela de atendimento.

## Arquivos alterados

- `src/app/app/agenda/actions.ts`
- `src/app/app/agenda/page.tsx`
- `src/app/app/agenda/[id]/atendimento/actions.ts`
- `src/app/app/agenda/[id]/atendimento/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha pagina dedicada de historico do paciente fora da consulta.
- Ainda nao ha anexos ou prescricoes.
- O proximo passo natural e US-009: registrar despesas, ou refinar relatorios.
