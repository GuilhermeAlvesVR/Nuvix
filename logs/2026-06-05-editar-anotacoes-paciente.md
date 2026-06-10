# Editar anotacoes por paciente

Data: 2026-06-05

## Alteracoes

- Adicionado campo `updatedByUserId` ao modelo `PatientNote`.
- Criada migracao `prisma/patient-notes-updated-by-migration.sql`.
- Criado script `prisma/apply-patient-notes-updated-by-migration.mjs`.
- Adicionado script npm `migrate:patient-notes-updated-by`.
- Criada action `updatePatientNote`.
- Adicionado formulario recolhivel `Editar` nas anotacoes ativas.
- `ADMIN` edita qualquer anotacao ativa do workspace.
- `RECEPTIONIST` edita apenas anotacoes ativas criadas pelo proprio usuario.
- `PROFESSIONAL` edita apenas anotacoes ativas criadas pelo proprio usuario e de paciente vinculado as suas consultas.
- Anotacoes arquivadas nao podem ser editadas.
- Edicao registra `AuditLog` com alteracoes de categoria/destaque, sem gravar o conteudo no metadata.
- Spec SDD e backlog foram atualizados.

## Execucao

- `npm run migrate:patient-notes-updated-by`
- `npm run prisma:generate`

## Observacao

- `npm run prisma:generate` falhou inicialmente com `EPERM` no Windows por processos Node segurando o Prisma engine.
- Com autorizacao do usuario, os processos Node foram encerrados e a geracao foi concluida com sucesso.

## Validacoes

- `npx prisma validate`
- `npm run lint`
- `npm run build`
