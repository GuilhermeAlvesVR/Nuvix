# Cadastro de profissionais

Data: 2026-06-04

## Objetivo

Implementar a gestao minima de profissionais para destravar a proxima etapa do MVP: agendamento de consultas.

## Funcionalidades implementadas

- Nova rota `/app/profissionais`.
- Listagem de profissionais da empresa logada.
- Cadastro de profissional com:
  - nome obrigatorio;
  - especialidade;
  - registro profissional;
  - telefone;
  - email;
  - vinculo opcional com usuario `PROFESSIONAL` ativo e ainda nao vinculado.
- Ativar/desativar profissional.
- Link no menu lateral do app.
- Atalho na pagina inicial do app.

## Regras de negocio e seguranca

- Somente usuarios `ADMIN` da empresa podem criar, ativar ou desativar profissionais.
- Usuarios nao administradores podem visualizar a lista, mas nao gerenciar.
- Todas as actions filtram por `workspaceId` da sessao atual.
- O vinculo com usuario exige que o usuario seja da mesma empresa, ativo, tenha perfil `PROFESSIONAL` e ainda nao esteja vinculado a outro profissional.
- Email do profissional e opcional, mas validado quando informado.
- Profissional inativo permanece no historico/listagem, mas podera ser evitado em novos agendamentos na proxima etapa.

## Arquivos alterados

- `src/app/app/layout.tsx`
- `src/app/app/page.tsx`
- `src/app/app/profissionais/actions.ts`
- `src/app/app/profissionais/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha edicao de dados do profissional; por enquanto ha criar, ativar e desativar.
- O agendamento deve usar apenas profissionais ativos.
- A proxima etapa deve implementar US-005, bloqueando conflito de horario para o mesmo profissional.
