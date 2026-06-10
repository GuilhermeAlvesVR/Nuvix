# Contraste automatico do tema do cliente

Data: 2026-06-04

## Problema

Quando o cliente configurava a cor de fundo do painel como preta ou muito escura, os textos da area principal continuavam escuros e ficavam ilegíveis.

## Correcoes aplicadas

- Adicionado calculo de luminancia da cor de fundo no layout do `/app`.
- O layout agora injeta:
  - `--app-text`
  - `--app-muted-text`
- Fundos escuros passam a usar texto branco e texto secundario cinza claro.
- Fundos claros continuam usando texto escuro.
- Cards, labels, metadados, inputs, selects, textareas, placeholders e textos secundarios do `/app` usam as novas variaveis de contraste.

## Arquivos alterados

- `src/app/app/layout.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.
