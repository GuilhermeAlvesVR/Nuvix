# Detalhe financeiro

Data: 2026-06-05

## Objetivo

Executar o primeiro passo do plano restante do dia: criar detalhes financeiros para pagamentos e despesas, mantendo as listas compactas do financeiro.

## Funcionalidades implementadas

- Nova rota `/app/financeiro/pagamentos/[id]`.
- Nova rota `/app/financeiro/despesas/[id]`.
- Linhas de pagamentos em `/app/financeiro` agora abrem o detalhe do pagamento.
- Linhas de despesas em `/app/financeiro` agora abrem o detalhe da despesa.
- Linhas de consultas financeiras em `/app/financeiro` agora abrem o detalhe da consulta.

## Detalhe de pagamento

- Mostra valor, status, forma e data.
- Mostra paciente com link para detalhe do paciente.
- Mostra consulta com link para detalhe da consulta.
- Mostra profissional, valor da consulta, status financeiro, usuário criador e observações.

## Detalhe de despesa

- Mostra descrição, categoria, valor, status e data.
- Mostra usuário criador, email, data de criação, data de atualização e observações.

## Segurança e escopo

- Todas as buscas filtram por `workspaceId`.
- Nao foram alteradas regras de negocio, status financeiros ou permissões existentes.

## Arquivos alterados

- `src/app/app/financeiro/page.tsx`
- `src/app/app/financeiro/pagamentos/[id]/page.tsx`
- `src/app/app/financeiro/despesas/[id]/page.tsx`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Plano restante

- Registrar pagamento a partir da consulta.
- Editar e inativar paciente.
- Relatorios reais.
- Melhorar configuracoes/usuarios escondendo campos profissionais quando o perfil nao for profissional.
- Ajustes de producao/upload.
