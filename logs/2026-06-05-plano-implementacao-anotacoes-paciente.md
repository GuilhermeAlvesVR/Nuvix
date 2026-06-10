# Plano de implementacao: anotacoes por paciente

Data: 2026-06-05

## Passos

1. Atualizar `prisma/schema.prisma` com `PatientNote` e `PatientNoteCategory`.
2. Criar/aplicar migracao e gerar Prisma Client.
3. Criar server actions para criar e arquivar anotacao, com validacao e RBAC.
4. Atualizar detalhe do paciente em `/app/pacientes/[id]`.
5. Adicionar formulario e lista de anotacoes.
6. Adicionar auditoria/invalidação da rota do paciente.
7. Validar com `npx prisma validate`, `npm run prisma:generate`, `npm run lint` e `npm run build`.

## Escopo MVP

- Criar, listar e arquivar anotacoes administrativas por paciente.
- Sem edicao, anexos, tags, busca avancada ou exclusao definitiva no MVP.
- `ADMIN` e `RECEPTIONIST` podem criar.
- `PROFESSIONAL` cria e visualiza anotacoes administrativas/operacionais, mas nao arquiva no MVP.
- Dados clinicos continuam em `ClinicalRecord`.
