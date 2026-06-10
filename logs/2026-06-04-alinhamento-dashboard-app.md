# Alinhamento dos cards do dashboard

Data: 2026-06-04

## Problema

Os cards do dashboard em `/app` estavam desalinhados por causa de diferencas de conteudo, alturas e regras de compactacao sobrepostas.

## Correcoes aplicadas

- Grid do dashboard passa a usar tres colunas iguais.
- Cards do dashboard usam altura consistente.
- Cards usam estrutura interna com cabecalho e area de lista alinhada.
- Linhas das listas do dashboard receberam altura minima.
- Textos secundários das linhas truncam com ellipsis e alinhamento a direita.
- Atalhos inferiores seguem o mesmo alinhamento de colunas.
- Responsivo preserva uma coluna no mobile.

## Arquivo alterado

- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.
