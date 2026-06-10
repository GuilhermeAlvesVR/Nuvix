# Camada visual minimalista global

Data: 2026-06-05

## Objetivo

Deixar o sistema inteiro com visual mais minimalista, reduzindo poluicao visual sem alterar regras de negocio, RBAC ou queries.

## Alteracoes aplicadas

- Removidos gradientes mais fortes das telas Nuvix e do painel interno.
- Reduzidas sombras em cards, formularios, listas e paineis.
- Botoes ficaram menores, com bordas menos arredondadas e sem deslocamento no hover.
- Inputs, selects e textareas ficaram mais compactos.
- Page headers ficaram mais baixos e discretos.
- Eyebrows viraram marcadores minimalistas com borda e texto pequeno.
- Sidebar ficou mais limpa, estreita e neutra.
- Cards e superficies do `/app` ficaram mais planos.
- Linhas compactas, badges, métricas e detalhes ficaram com tipografia menor.
- Espaçamentos globais foram reduzidos.
- Telas externas da marca Nuvix ficaram mais simples, com fundo preto/grafite plano.

## Arquivo alterado

- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- A personalizacao por cliente foi preservada usando as variaveis existentes do workspace.
