# Passo 1: schema de anotacoes por paciente

Data: 2026-06-05

## Alteracoes

- Adicionado enum `PatientNoteCategory` com valores `ADMINISTRATIVE` e `OPERATIONAL`.
- Adicionado modelo `PatientNote` em `prisma/schema.prisma`.
- Adicionados relacionamentos com `Workspace`, `Patient` e `User`.
- Adicionados campos de arquivamento: `archivedAt` e `archivedByUserId`.
- Adicionados campos de autoria: `createdByUserId`, `createdAt` e `updatedAt`.
- Adicionados indices para consultas por workspace, paciente, data, arquivamento e autor.

## Validacoes

- `npx prisma validate`

## Proximo passo

- Passo 2: criar/aplicar migracao e gerar Prisma Client.
