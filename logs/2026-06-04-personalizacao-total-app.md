# Personalizacao visual ampliada no app

Data: 2026-06-04

## Objetivo

Fazer a personalizacao por cliente afetar tambem o fundo da area principal e as superficies internas do painel, nao apenas a lateral e os botoes.

## Correcoes aplicadas

- Criadas variaveis de superficie do app derivadas das cores do cliente:
  - `--app-page-bg`
  - `--app-surface`
  - `--app-surface-strong`
  - `--app-surface-muted`
  - `--app-border`
- O fundo de `.app-main` agora usa gradiente derivado de `primaryColor` e `accentColor`.
- Cards, formularios, filtros, listas, empty states e blocos clinicos/financeiros passam a usar superficies derivadas da paleta do cliente.
- Inputs, selects e textareas dentro do `/app` passam a usar bordas/fundos relacionados ao tema do cliente.
- Callouts, divisores e listas internas tambem usam as cores do cliente.

## Arquivos alterados

- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- A customizacao ainda usa as duas cores existentes do workspace: cor principal e cor de destaque.
- Se for necessario controle absoluto no futuro, pode ser adicionado um terceiro campo especifico para `cor de fundo`.
