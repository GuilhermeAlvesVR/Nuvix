# Restricao de profissional por vinculo com paciente

Data: 2026-06-05

## Motivo

- Melhorar LGPD e privacidade no acesso a pacientes.
- Evitar que um profissional visualize detalhes e anotacoes de qualquer paciente do workspace apenas por conhecer a URL.

## Alteracoes

- Criado helper `src/lib/patient-access.ts`.
- Profissional agora so acessa detalhe de paciente se existir consulta vinculada ao profissional do usuario.
- Profissional so cria anotacao se tiver acesso ao paciente por consulta vinculada.
- Busca/listagem de pacientes foi restringida para profissionais, retornando apenas pacientes vinculados as consultas do profissional.
- Links de novo paciente e agendar foram ocultados para profissionais na tela de pacientes.
- `ADMIN` e `RECEPTIONIST` continuam com acesso amplo aos pacientes do workspace.
- Spec SDD e backlog foram atualizados com a nova regra.

## Arquivos alterados

- `src/lib/patient-access.ts`
- `src/lib/patients.ts`
- `src/app/app/pacientes/page.tsx`
- `src/app/app/pacientes/[id]/page.tsx`
- `src/app/app/pacientes/actions.ts`
- `docs/specs/US-012-anotacoes-por-paciente.md`
- `docs/06-backlog-mvp.md`

## Validacoes

- `npm run lint`
- `npm run build`
