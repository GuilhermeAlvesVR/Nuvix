# Fluxo SaaS com aprovacao de empresas

Data: 2026-06-04

## Objetivo

Implementar o fluxo em que uma empresa se cadastra publicamente, cria o primeiro usuario administrador e so consegue acessar o sistema depois da aprovacao pelo administrador da plataforma.

## Funcionalidades implementadas

- Cadastro publico de empresa em `/cadastro`.
- Criacao transacional de empresa com status `PENDING_APPROVAL` e primeiro usuario `ADMIN`.
- Bloqueio de login para empresas com status:
  - `PENDING_APPROVAL`;
  - `SUSPENDED`;
  - `REJECTED`.
- Redirecionamento de `PLATFORM_ADMIN` para `/admin` apos login.
- Protecao do `/admin` para usuarios `PLATFORM_ADMIN`.
- Protecao do `/app` para usuarios de empresas ativas.
- Painel `/admin` com lista de empresas, contadores por status e acoes:
  - aprovar;
  - rejeitar;
  - suspender;
  - reativar.
- Script local para criar/atualizar o administrador da plataforma.
- SQL auxiliar para adaptar bancos existentes aos novos enums e campos.
- Script `migrate:saas-approval` para aplicar a migracao pelo Prisma quando `prisma db execute` nao concluir.

## Regras de negocio e seguranca

- Senhas continuam sendo salvas apenas com hash `scrypt`.
- Usuario inativo continua sem acesso.
- Somente `PLATFORM_ADMIN` acessa `/admin`.
- Administradores de empresa nao acessam `/admin`.
- Empresas nao aprovadas nao acessam `/app`.
- O workspace interno da plataforma nao aparece na lista de empresas e nao pode ser alterado pelas actions do painel.
- O cadastro publico exige nome da empresa, tipo, responsavel, email, telefone e senha inicial com pelo menos 8 caracteres.

## Arquivos alterados

- `package.json`
- `prisma/schema.prisma`
- `prisma/saas-approval-migration.sql`
- `prisma/apply-saas-approval-migration.mjs`
- `prisma/seed-platform-admin.mjs`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/app/login/actions.ts`
- `src/app/login/page.tsx`
- `src/app/app/layout.tsx`
- `src/app/app/page.tsx`
- `src/app/app/configuracoes/actions.ts`
- `src/app/app/configuracoes/page.tsx`
- `src/app/app/pacientes/actions.ts`
- `src/app/app/pacientes/page.tsx`
- `src/app/app/pacientes/novo/page.tsx`
- `src/app/cadastro/actions.ts`
- `src/app/cadastro/page.tsx`
- `src/app/admin/actions.ts`
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/lib/session.ts`
- `src/lib/workspace.ts`

## Validacoes executadas

- `npx prisma validate`: passou.
- `npm run prisma:generate`: passou.
- `npm run lint`: passou.
- `npm run build`: passou.
- `npm run migrate:saas-approval`: passou apos `prisma db execute` ficar sem retorno.
- `npm run seed:platform-admin`: passou para o email `guilherme.alves.stw@gmail.com`.

## Pendencias conhecidas

- Para novos ambientes, aplicar a alteracao do banco com `npm run migrate:saas-approval` antes de rodar o seed.
- O primeiro `PLATFORM_ADMIN` foi criado no banco atual.
- Em uma proxima etapa, implementar a gestao de usuarios dentro da empresa, conforme US-002.
