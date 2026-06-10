# Padrao compacto nas paginas internas

Data: 2026-06-04

## Objetivo

Aplicar o mesmo padrao visual compacto usado no financeiro nas demais paginas internas do painel, reduzindo cards grandes e excesso de informacao visivel.

## Alteracoes aplicadas

- Pacientes agora usam linhas compactas em vez de cards grandes.
- Agenda agora usa linhas compactas com horario, paciente, profissional, valor, status e acoes essenciais.
- Profissionais agora usam linhas compactas com status, vinculo de usuario e acoes.
- Usuarios agora usam linhas compactas com email, perfil, status e acao.
- Historico clinico anterior agora usa linhas compactas.
- Adicionados estilos compartilhados para:
  - `compact-list-table`
  - `compact-list-row`
  - `compact-row-actions`
  - `compact-status-form`
  - `compact-link-form`

## Arquivos alterados

- `src/app/app/pacientes/page.tsx`
- `src/app/app/agenda/page.tsx`
- `src/app/app/profissionais/page.tsx`
- `src/app/app/configuracoes/usuarios/page.tsx`
- `src/app/app/agenda/[id]/atendimento/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- As informacoes completas continuam disponiveis no backend e nas rotas, mas o primeiro nivel visual agora prioriza nome, status, valor/detalhe essencial e acao principal.
