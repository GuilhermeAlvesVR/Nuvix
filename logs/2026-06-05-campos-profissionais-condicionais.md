# Campos profissionais condicionais

Data: 2026-06-05

## Alterações

- O formulário de criação de usuários agora mostra os dados profissionais apenas quando o perfil selecionado é `PROFESSIONAL`.
- Criado componente client pequeno para controlar somente o seletor de perfil e os campos profissionais.
- Mantida a página principal como server component.
- Ajustada a validação server-side para validar email profissional somente quando o perfil for `PROFESSIONAL`.
- A criação automática de `Professional` continua ocorrendo no servidor apenas para usuários profissionais.

## Validações

- `npm run lint`
- `npm run build`

## Arquivos alterados

- `src/app/app/configuracoes/usuarios/page.tsx`
- `src/app/app/configuracoes/usuarios/actions.ts`
- `src/app/app/configuracoes/usuarios/user-role-fields.tsx`
