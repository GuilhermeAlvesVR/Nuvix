# Usuario profissional cria profissional automaticamente

Data: 2026-06-05

## Objetivo

Evitar o fluxo duplicado de criar um usuario com perfil `PROFESSIONAL` e depois criar/vincular manualmente um profissional em outra tela.

## Alteracoes aplicadas

- O formulario de `Configuracoes > Usuarios` agora possui uma secao `Dados profissionais`.
- Ao criar usuario com perfil `Profissional`, o sistema cria automaticamente um registro em `Professional`.
- O profissional criado fica vinculado ao usuario pelo campo `userId`.
- O nome profissional pode ser diferente do nome do usuario.
- Se o nome profissional ficar vazio, o sistema usa o nome do usuario.
- Email profissional pode ser diferente; se vazio, usa o email do usuario.
- Ao desativar um usuario profissional, o profissional vinculado tambem e desativado.
- Ao reativar um usuario profissional, o profissional vinculado tambem e reativado.
- A lista de usuarios mostra o nome profissional vinculado quando existir.

## Arquivos alterados

- `src/app/app/configuracoes/usuarios/actions.ts`
- `src/app/app/configuracoes/usuarios/page.tsx`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacoes

- A criacao de usuario e profissional ocorre em transacao.
- A agenda e a lista de profissionais sao revalidadas/invalidadas apos as alteracoes.
