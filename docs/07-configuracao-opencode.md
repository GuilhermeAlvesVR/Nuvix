# Configuracao Do Opencode

Este documento registra a configuracao local criada para ajudar no desenvolvimento do `nuvix-consultorios`.

## Arquivos Criados

- `opencode.json`: configuracao local do opencode.
- `.opencode/instructions/project-context.md`: resumo principal do projeto.
- `.opencode/instructions/domain-summary.md`: resumo de dominio e regras centrais.
- `.opencode/instructions/development-standards.md`: padroes de desenvolvimento e verificacao.
- `.opencode/agent/*.md`: agentes especializados.
- `.opencode/skills/*/SKILL.md`: skills locais do projeto.

## Instrucoes Sempre Carregadas

O `opencode.json` aponta para tres arquivos compactos em `.opencode/instructions/`. Eles existem para economizar tokens e evitar reler todos os documentos grandes em tarefas simples.

- `project-context.md`: contexto do produto, stack e fontes de verdade.
- `domain-summary.md`: personas, modulos, regras de negocio e entidades principais.
- `development-standards.md`: padroes tecnicos, comandos e cuidados de seguranca.

Quando a tarefa exigir detalhes exatos, consulte os documentos completos em `docs/`.

## Agentes Criados

- `sdd-product-planner`: planeja trabalho a partir de requisitos, backlog e criterios de aceite.
- `nextjs-prisma-builder`: implementa features com Next.js, TypeScript e Prisma.
- `clinic-domain-reviewer`: revisa regras de pacientes, agenda, atendimento, financeiro e relatorios.
- `security-lgpd-reviewer`: revisa autenticacao, permissoes, dados sensiveis e LGPD.
- `frontend-ux-builder`: cria e revisa interfaces responsivas para o sistema.
- `qa-test-planner`: planeja validacao, lint, build, testes e criterios de aceite.

## Skills Criadas

- `sdd-workflow`: usar em SDD, requisitos, backlog e criterios de aceite.
- `clinic-domain`: usar em pacientes, profissionais, consultas, prontuario, pagamentos, despesas e relatorios.
- `nextjs-prisma`: usar em Next.js App Router, TypeScript, Prisma e PostgreSQL.
- `auth-rbac-lgpd`: usar em login, sessoes, papeis, permissoes, dados clinicos e LGPD.
- `testing-quality`: usar antes de finalizar features, validando criterios, lint, build e Prisma.

## Permissoes

A configuracao local usa permissoes prudentes:

- Edicoes pedem confirmacao.
- Comandos comuns de validacao podem ser permitidos.
- Comandos destrutivos como `rm`, `del`, `Remove-Item`, `git reset`, `git checkout` e `git clean` sao negados.
- Acesso a diretorios externos pede confirmacao.

## Prompts Uteis

- `Use o agente sdd-product-planner para transformar a US-003 em plano tecnico.`
- `Use o agente nextjs-prisma-builder para implementar cadastro de pacientes.`
- `Use o agente clinic-domain-reviewer para revisar as regras de agendamento.`
- `Use o agente security-lgpd-reviewer para revisar login e permissoes.`
- `Use o agente qa-test-planner para listar verificacoes antes de finalizar.`

## Aplicar Mudancas

O opencode carrega configuracoes ao iniciar. Depois de criar ou alterar `opencode.json`, agentes ou skills, feche e abra o opencode novamente para a configuracao entrar em vigor.
