# Gestao de usuarios da empresa

Data: 2026-06-04

## Objetivo

Implementar a US-002 do MVP: permitir que o administrador de uma empresa aprovada crie e desative usuarios para controlar o acesso ao sistema.

## Funcionalidades implementadas

- Nova rota `/app/configuracoes/usuarios`.
- Formulario para criar usuario da propria empresa com:
  - nome;
  - email;
  - senha inicial;
  - perfil `ADMIN`, `RECEPTIONIST` ou `PROFESSIONAL`.
- Listagem dos usuarios da empresa logada.
- Acao para desativar usuario.
- Acao para reativar usuario.
- Atalho em `/app/configuracoes` para admins acessarem a gestao de usuarios.

## Regras de negocio e seguranca

- Somente `ADMIN` da empresa acessa e executa as actions de gestao.
- Usuario so pode alterar usuarios do proprio `workspaceId`.
- `PLATFORM_ADMIN` nao pode ser criado nem alterado por essa tela.
- Email continua unico na plataforma.
- Senha inicial e salva apenas com hash `scrypt`.
- Usuario ativo/inativo continua respeitado no login.
- O administrador nao pode desativar o proprio usuario.

## Criterios da US-002

- Administrador cria usuario com nome, email e perfil: atendido.
- Email de usuario deve ser unico: atendido pela constraint e validacao de erro `P2002`.
- Usuario desativado perde acesso: atendido pelo bloqueio ja existente em login/sessao.

## Arquivos alterados

- `src/app/app/configuracoes/page.tsx`
- `src/app/app/configuracoes/usuarios/actions.ts`
- `src/app/app/configuracoes/usuarios/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha fluxo de troca de senha pelo proprio usuario.
- O perfil `PROFESSIONAL` ainda nao cria automaticamente um registro em `Professional`; isso deve ser conectado na etapa de cadastro de profissionais/agendamento.
