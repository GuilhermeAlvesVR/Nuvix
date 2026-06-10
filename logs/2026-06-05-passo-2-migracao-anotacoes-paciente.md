# Passo 2: migracao de anotacoes por paciente

Data: 2026-06-05

## Alteracoes

- Criado SQL de migracao `prisma/patient-notes-migration.sql`.
- Criado script `prisma/apply-patient-notes-migration.mjs`.
- Adicionado script npm `migrate:patient-notes`.
- Criado enum PostgreSQL `PatientNoteCategory` quando inexistente.
- Criada tabela `patient_notes` quando inexistente.
- Criadas chaves estrangeiras para `workspaces`, `patients` e `users`.
- Criados indices para consultas por workspace, paciente, data, arquivamento e autor.

## Execucao

- Primeira execucao falhou porque o Prisma nao aceita multiplos comandos em um unico prepared statement.
- O script foi ajustado para executar cada statement separadamente.
- `npm run migrate:patient-notes` executou com sucesso.
- `npm run prisma:generate` falhou inicialmente com `EPERM` no Windows porque processos Node seguravam o Prisma engine.
- Com autorizacao do usuario, os processos Node foram encerrados.
- `npm run prisma:generate` executou com sucesso depois disso.

## Validacoes

- `npx prisma validate`
- `npm run migrate:patient-notes`
- `npm run prisma:generate`
- `npx prisma validate`

## Proximo passo

- Passo 3: criar server actions para criar e arquivar anotacao, com validacao e RBAC.
