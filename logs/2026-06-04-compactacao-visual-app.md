# 2026-06-04 - Compactação visual do painel interno

## Alterações

- Compactei o dashboard `/app` com métricas menores, listas em linhas e atalhos sem descrições visíveis.
- Reduzi metadados exibidos no primeiro nível das listas do dashboard, priorizando nome, status ou valor essencial.
- Ajustei CSS global do painel para cards/listas mais baixos em pacientes, agenda, financeiro, profissionais e usuários.
- Reduzi padding, raios, sombras, gaps, botões, campos de formulário e prévias de configurações.
- Mantive as variáveis de personalização por cliente (`--primary`, `--accent`, `--workspace-background`, `--app-text`, `--app-muted-text`) como base visual.

## Escopo preservado

- Nenhuma regra de negócio, query sensível, RBAC ou validação de servidor foi alterada.
- A compactação foi feita principalmente por CSS, com ajuste pontual de metadados renderizados no dashboard.
