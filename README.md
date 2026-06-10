# Sistema Para Consultorios

Projeto para gestao de consultorios, com foco em cadastro de pacientes, registro de consultas, relatorios e controle financeiro.

Este repositorio esta organizado pelo metodo SDD, aqui tratado como Spec-Driven Development: primeiro definimos claramente o comportamento esperado do sistema, depois implementamos o codigo guiado por essas especificacoes.

## Objetivo

Construir um sistema web para consultorios usarem no dia a dia para:

- Cadastrar e gerenciar pacientes.
- Agendar e registrar consultas.
- Guardar historico clinico basico.
- Controlar recebimentos, despesas e status financeiro.
- Gerar relatorios operacionais e financeiros.

## Documentacao SDD

- `docs/01-visao-produto.md`: visao geral, usuarios, escopo e modulos.
- `docs/02-requisitos.md`: requisitos funcionais e nao funcionais.
- `docs/03-regras-negocio.md`: regras principais do dominio.
- `docs/04-modelo-dados.md`: entidades e relacionamentos iniciais.
- `docs/05-arquitetura.md`: arquitetura tecnica sugerida.
- `docs/06-backlog-mvp.md`: backlog inicial com criterios de aceite.

## Modulos Do MVP

- Autenticacao e usuarios.
- Pacientes.
- Profissionais.
- Agenda e consultas.
- Prontuario/resumo da consulta.
- Financeiro.
- Relatorios.

## Stack Tecnica

- Next.js.
- TypeScript.
- PostgreSQL.
- Prisma ORM.

## Como Rodar Localmente

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

3. Ajuste `DATABASE_URL` no `.env` para apontar para o seu PostgreSQL.

4. Gere o Prisma Client:

```bash
npm run prisma:generate
```

5. Rode as migrations em desenvolvimento:

```bash
npm run prisma:migrate
```

6. Inicie o servidor:

```bash
npm run dev
```

Depois acesse `http://localhost:3000`.

## Comandos Uteis

- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run build`: gera build de producao.
- `npm run start`: inicia o build de producao.
- `npm run lint`: executa verificacao de lint.
- `npm run prisma:studio`: abre o painel visual do Prisma.

## Proximo Passo De Implementacao

Implementar autenticacao e o primeiro fluxo real do MVP: cadastro e busca de pacientes.
