# Administrador profissional e textos em portugues

Data: 2026-06-05

## Alteracoes

- O formulario de criacao de usuarios agora permite marcar um `ADMIN` como profissional que tambem atende pacientes.
- `PROFESSIONAL` continua criando cadastro profissional automaticamente.
- `ADMIN` marcado como profissional cria um registro em `Professional` vinculado ao usuario administrador.
- Atendimento clinico agora pode ser visto/editado por `ADMIN` ou `PROFESSIONAL` somente quando o usuario for o profissional vinculado a consulta.
- Administrador sem vinculo profissional com a consulta nao abre o atendimento clinico daquela consulta.
- Botao `Atendimento` na agenda so aparece para usuario vinculado como profissional da consulta.
- Sidebar e cabecalho agora exibem papeis em portugues: Administrador, Recepcionista, Profissional.
- Rotulo padrao da navegacao mudou de `Clientes` para `Pacientes`.

## Arquivos alterados

- `src/app/app/configuracoes/usuarios/actions.ts`
- `src/app/app/configuracoes/usuarios/user-role-fields.tsx`
- `src/app/app/agenda/page.tsx`
- `src/app/app/agenda/[id]/page.tsx`
- `src/app/app/agenda/[id]/atendimento/page.tsx`
- `src/app/app/agenda/[id]/atendimento/actions.ts`
- `src/app/app/layout.tsx`

## Validacoes

- `npm run lint`
- `npm run build`
