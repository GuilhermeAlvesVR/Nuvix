# Financeiro compacto

Data: 2026-06-04

## Problema

A tela `/app/financeiro` ainda estava visualmente poluida, com muitos cards grandes exibindo nomes, valores e metadados em excesso.

## Alteracoes aplicadas

- Substituidos os tres cards grandes de agrupamentos por uma barra compacta de insights.
- Consultas financeiras passaram de cards grandes para linhas compactas.
- Ultimos pagamentos passaram de cards grandes para linhas compactas.
- Despesas passaram de cards grandes para linhas compactas.
- Titulos internos do financeiro ficaram menores.
- Descricoes repetitivas das secoes financeiras foram ocultadas.
- Linhas financeiras exibem apenas informacao essencial no primeiro nivel:
  - nome/descricao;
  - status;
  - valor principal;
  - detalhe curto.

## Arquivos alterados

- `src/app/app/financeiro/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- Os dados continuam vindo das mesmas queries e regras de negocio.
- A mudanca e visual/estrutural no HTML da tela para reduzir densidade e altura.
