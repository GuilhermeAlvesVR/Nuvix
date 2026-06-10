# Filtro diario da agenda

Data: 2026-06-04

## Objetivo

Alterar a agenda para exibir consultas de um dia selecionado, em vez de listar os proximos 30 dias.

## Funcionalidades implementadas

- Filtro por dia em `/app/agenda` usando parametro `date`.
- Padrao da agenda passa a ser o dia atual.
- Botao `Hoje` para voltar rapidamente para a data atual.
- Formulario de nova consulta usa como data inicial o dia selecionado.
- Apos criar consulta, a agenda volta para o dia da consulta criada.
- Apos alterar status, a agenda volta para o dia da consulta alterada.

## Performance

- Cache da agenda agora e separado por empresa e data selecionada.
- A consulta de agendamentos busca apenas o intervalo do dia selecionado.
- Isso reduz o volume de dados carregados em comparacao com os proximos 30 dias.

## Arquivos alterados

- `src/lib/app-cache.ts`
- `src/app/app/agenda/page.tsx`
- `src/app/app/agenda/actions.ts`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Pendencias conhecidas

- Ainda nao ha filtro por profissional ou status na agenda.
- Esses filtros podem ser adicionados depois, se necessario.
