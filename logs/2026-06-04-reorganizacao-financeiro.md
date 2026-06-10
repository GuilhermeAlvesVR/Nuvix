# Reorganizacao do financeiro

Data: 2026-06-04

## Objetivo

Separar o dashboard financeiro dos formularios de pagamento e despesa para melhorar usabilidade e manter a tela principal mais leve.

## Funcionalidades implementadas

- Dashboard principal mantido em `/app/financeiro`.
- Novo pagamento movido para `/app/financeiro/pagamentos/novo`.
- Nova despesa movida para `/app/financeiro/despesas/nova`.
- Dashboard ganhou atalhos no topo:
  - `Novo pagamento` para usuarios `ADMIN` e `RECEPTIONIST`;
  - `Nova despesa` para usuarios `ADMIN`.
- Formularios dedicados reaproveitam as actions existentes.
- Mensagens de erro das actions agora retornam para a tela correta de origem.

## Regras preservadas

- Apenas `ADMIN` e `RECEPTIONIST` registram pagamentos.
- Apenas `ADMIN` registra despesas.
- Cache financeiro continua sendo invalidado ao criar pagamento ou despesa.
- Dashboard continua exibindo resumo, filtros, consultas financeiras, pagamentos e despesas.

## Arquivos alterados

- `src/app/app/financeiro/page.tsx`
- `src/app/app/financeiro/actions.ts`
- `src/app/app/financeiro/pagamentos/novo/page.tsx`
- `src/app/app/financeiro/despesas/nova/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha paginas completas de historico de pagamentos e historico de despesas separadas.
- Isso pode ser feito depois, se o dashboard ficar grande novamente.
