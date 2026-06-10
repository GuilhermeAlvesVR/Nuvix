# Revisao geral: ajustes criticos

Data: 2026-06-05

## Ajustes realizados

- Agenda agora filtra consultas por profissional vinculado quando o usuario e `PROFESSIONAL`.
- Profissional nao recebe filtro de profissional na agenda, pois ve apenas a propria agenda.
- Profissional nao ve valores das consultas na lista da agenda.
- Detalhe da consulta bloqueia profissional que nao e o profissional vinculado.
- Alteracao de status da consulta agora valida permissao no servidor.
- Consulta `COMPLETED` so pode ter status alterado por `ADMIN`.
- Modulo financeiro foi removido da navegacao de `PROFESSIONAL`.
- `/app/financeiro` mostra acesso restrito para `PROFESSIONAL`.
- Detalhes de pagamento bloqueiam `PROFESSIONAL`.
- Detalhes de despesa ficam restritos a `ADMIN`.
- Detalhe do paciente oculta totais financeiros, status financeiro e pagamentos para `PROFESSIONAL`.
- Consultas listadas no detalhe do paciente para `PROFESSIONAL` ficam restritas as consultas do proprio profissional.
- Cadastro direto de paciente foi bloqueado para `PROFESSIONAL` na pagina e na action.
- Cadastro inicial de paciente ganhou campo de nascimento.
- Documento de paciente passou a ser normalizado antes de salvar/comparar.
- Relatorios ganharam filtro por profissional e status.
- Relatorios ganharam lista de consultas do periodo.
- Relatorios exibem total pendente e pacientes atendidos.
- Auditoria minima adicionada para criacao/edicao/status de paciente, criacao de consulta, criacao de pagamento e criacao de despesa.

## Arquivos principais alterados

- `src/lib/app-cache.ts`
- `src/app/app/layout.tsx`
- `src/app/app/agenda/page.tsx`
- `src/app/app/agenda/actions.ts`
- `src/app/app/agenda/[id]/page.tsx`
- `src/app/app/pacientes/page.tsx`
- `src/app/app/pacientes/novo/page.tsx`
- `src/app/app/pacientes/[id]/page.tsx`
- `src/app/app/pacientes/actions.ts`
- `src/app/app/financeiro/page.tsx`
- `src/app/app/financeiro/actions.ts`
- `src/app/app/financeiro/pagamentos/[id]/page.tsx`
- `src/app/app/financeiro/despesas/[id]/page.tsx`
- `src/app/app/relatorios/page.tsx`

## Validacoes

- `npm run lint`
- `npm run build`

## Pendencias restantes

- Protecao forte contra corrida em conflito de agenda ainda depende de constraint/lock no banco.
- `Patient.notes` legado ainda existe e pode ser revisado/removido depois.
- Edicao de usuarios ainda nao foi implementada.
- Tela de auditoria ainda nao existe; os eventos sao gravados no banco.
- README ainda precisa ser atualizado para refletir o estado atual do sistema.
