# Profissional cria anotacoes por paciente

Data: 2026-06-05

## Motivo

- Foi decidido que profissionais tambem devem poder criar anotacoes administrativas/operacionais do paciente.
- A separacao clinica continua preservada: dados clinicos devem permanecer em `ClinicalRecord`.

## Alteracoes

- `PROFESSIONAL` agora pode criar anotacoes administrativas/operacionais em `/app/pacientes/[id]`.
- `PROFESSIONAL` continua sem permissao para arquivar anotacoes no MVP.
- `ADMIN` e `RECEPTIONIST` continuam podendo criar e arquivar anotacoes.
- A UI agora mostra o formulario de nova anotacao para profissionais.
- O botao `Arquivar` continua restrito a administradores e recepcionistas.
- A validacao server-side foi separada entre permissao de criacao e permissao de arquivamento.
- Spec SDD e backlog foram atualizados com a nova regra.

## Arquivos alterados

- `src/app/app/pacientes/actions.ts`
- `src/app/app/pacientes/[id]/page.tsx`
- `docs/specs/US-012-anotacoes-por-paciente.md`
- `docs/06-backlog-mvp.md`
- `logs/2026-06-05-plano-implementacao-anotacoes-paciente.md`

## Validacoes

- `npm run lint`
- `npm run build`
