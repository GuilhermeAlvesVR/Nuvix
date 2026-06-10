# Registrar pagamento a partir da consulta

Data: 2026-06-05

## Objetivo

Executar o segundo passo do plano restante: permitir registrar pagamento diretamente a partir do detalhe da consulta.

## Funcionalidades implementadas

- Botao `Registrar pagamento` no detalhe `/app/agenda/[id]` para ADMIN e RECEPTIONIST.
- O botao abre `/app/financeiro/pagamentos/novo` com a consulta preselecionada.
- O formulario de novo pagamento aceita `appointmentId` via query string.
- O formulario calcula e sugere o valor restante da consulta quando a consulta esta preselecionada.
- O formulario aceita `returnTo` seguro para voltar ao detalhe da consulta apos salvar.
- A action de pagamento revalida:
  - `/app/financeiro`
  - `/app/agenda`
  - `/app/agenda/[id]`
- Pagamentos listados no detalhe da consulta agora linkam para o detalhe do pagamento.

## Arquivos alterados

- `src/app/app/agenda/[id]/page.tsx`
- `src/app/app/financeiro/pagamentos/novo/page.tsx`
- `src/app/app/financeiro/actions.ts`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Plano restante

- Editar e inativar paciente.
- Relatorios reais.
- Melhorar configuracoes/usuarios escondendo campos profissionais quando o perfil nao for profissional.
- Ajustes de producao/upload.
