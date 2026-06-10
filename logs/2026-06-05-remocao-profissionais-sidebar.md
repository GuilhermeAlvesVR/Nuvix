# Remocao de profissionais da sidebar

Data: 2026-06-05

## Objetivo

Simplificar a navegacao lateral removendo a pagina `Profissionais` como modulo principal, ja que o fluxo oficial agora cria profissional automaticamente ao criar usuario com perfil profissional.

## Alteracoes aplicadas

- Removido o item `Profissionais` da sidebar.
- Mantida a rota `/app/profissionais` sem exclusao, para evitar quebra de acesso tecnico ou vinculos existentes.
- Fluxo principal passa a ficar centralizado em `Configuracoes > Usuarios`.

## Arquivo alterado

- `src/app/app/layout.tsx`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- A entidade `Professional` continua existindo e sendo usada por agenda, historico clinico e vinculo com usuario.
