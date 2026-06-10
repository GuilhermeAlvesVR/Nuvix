# Passo 3: server actions de anotacoes por paciente

Data: 2026-06-05

## Alteracoes

- Adicionada action `createPatientNote` em `src/app/app/pacientes/actions.ts`.
- Adicionada action `archivePatientNote` em `src/app/app/pacientes/actions.ts`.
- Criada validacao de categoria `PatientNoteCategory`.
- Criado controle de permissao para anotações administrativas.
- `ADMIN` e `RECEPTIONIST` podem criar e arquivar anotacoes.
- `PROFESSIONAL` nao cria nem arquiva no MVP.
- Todas as operacoes filtram por `workspaceId`.
- Criacao valida paciente existente no workspace, categoria, conteudo minimo e limite de 2000 caracteres.
- Arquivamento usa `archivedAt` e `archivedByUserId`, sem exclusao fisica.
- Criacao e arquivamento registram `AuditLog` sem gravar o conteudo da anotacao no metadata.
- Rotas de paciente sao revalidadas apos mutacoes.

## Validacoes

- `npm run lint`
- `npm run build`

## Proximo passo

- Passo 4: atualizar detalhe do paciente em `/app/pacientes/[id]` para carregar e exibir anotacoes.
