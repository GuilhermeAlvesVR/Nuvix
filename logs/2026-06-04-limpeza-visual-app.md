# Limpeza visual do painel interno

Data: 2026-06-04

## Alterações

- Reduzi o ruído visual do shell interno `/app` usando fundo mais plano e sombras mais leves.
- Troquei a sidebar de um bloco em gradiente forte para uma superfície neutra que ainda usa a cor primária no item ativo.
- Simplifiquei estados da navegação, ícones textuais, espaçamentos e rodapé da sidebar.
- Ajustei o header interno para ocupar menos altura e competir menos com o conteúdo.
- Refinei o dashboard com tipografia menor, cards menos pesados e listas com divisórias simples em vez de caixas aninhadas.
- Reduzi atalhos do dashboard para ações operacionais compactas, removendo cards genéricos de configuração/equipe da tela inicial.

## Observações

- A personalização por cliente foi preservada via `--primary`, `--accent`, `--workspace-background`, `--app-text` e `--app-muted-text`.
- Não houve alteração em regras de negócio, consultas ou estrutura de dados.
