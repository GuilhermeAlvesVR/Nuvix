# Relatórios reais

Data: 2026-06-05

## Alterações

- Substituída a tela placeholder de `/app/relatorios` por relatórios reais.
- Adicionado filtro por período com padrão no mês atual.
- Adicionado resumo de consultas por período.
- Adicionado agrupamento de consultas por status.
- Adicionado agrupamento de consultas por profissional.
- Adicionado resumo financeiro com pagamentos confirmados, despesas confirmadas e saldo.
- Adicionadas listas compactas com links para detalhes de pagamentos e despesas.
- Relatórios financeiros consideram apenas registros `CONFIRMED` por padrão.
- Acesso restrito a usuários `ADMIN` da empresa.

## Validações

- `npm run lint`
- `npm run build`

## Arquivos alterados

- `src/app/app/relatorios/page.tsx`
