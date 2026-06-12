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
- `docs/07-lgpd-retencao.md`: politica inicial de retencao e consentimento.

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

## Deploy Na Vercel

O projeto possui `vercel.json` com cron para:

- `/api/billing/monthly-invoices`: roda no dia 1 de cada mes as 08:00 UTC.

1. Configure o projeto na Vercel apontando para este repositorio.

2. Configure as variaveis de ambiente na Vercel:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
CRON_SECRET="..."
MERCADO_PAGO_ACCESS_TOKEN="..."
MERCADO_PAGO_WEBHOOK_SECRET="..."
```

Use valores fortes e fixos para `AUTH_SECRET`, `CRON_SECRET` e `MERCADO_PAGO_WEBHOOK_SECRET`. Nao gere esses valores novamente depois do deploy, porque isso pode invalidar sessoes ou chamadas externas.

3. Faça o deploy pela Vercel.

4. Garanta que o banco de producao esta com o schema atualizado. Em ambientes novos, aplique as migracoes/scripts necessarios antes de liberar uso:

```bash
npm run migrate:saas-approval
npm run migrate:performance
npm run migrate:patient-notes
npm run migrate:patient-notes-updated-by
npm run migrate:workspace-types
npm run migrate:workspace-background
npm run migrate:workspace-custom-amount
npm run migrate:workspace-terms
```

Depois rode os seeds necessarios:

```bash
PLATFORM_ADMIN_EMAIL="admin@seudominio.com" PLATFORM_ADMIN_PASSWORD="senha-forte" npm run seed:platform-admin
npm run seed:templates
```

5. Configure o webhook do Mercado Pago para o dominio de producao:

```text
https://seu-dominio.vercel.app/api/mercado-pago/webhook
```

Configure tambem a chave secreta de webhook no painel do Mercado Pago e use o mesmo valor em `MERCADO_PAGO_WEBHOOK_SECRET`. O webhook valida a assinatura oficial enviada pelo Mercado Pago; nao coloque segredo na URL.

No Mercado Pago, use credencial `TEST-...` apenas para sandbox e `APP_USR-...` para producao. Para teste real, crie uma fatura pequena e pague com uma conta/cartao diferente da conta vendedora.

6. Para testar os crons manualmente:

```bash
curl -X GET https://seu-dominio.vercel.app/api/billing/monthly-invoices -H "Authorization: Bearer SEU_CRON_SECRET"
```

Na Vercel, quando `CRON_SECRET` esta configurado, os Vercel Crons enviam automaticamente o header `Authorization: Bearer <CRON_SECRET>`.

7. Checklist antes de liberar producao:

```bash
npm run lint
npm test
npm run build
```

8. Checklist funcional depois do deploy:

- Login com admin da plataforma.
- Aprovar uma empresa cadastrada.
- Login com admin da empresa aprovada.
- Criar paciente, profissional e atendimento.
- Registrar pagamento e despesa.
- Gerar fatura SaaS pelo cron ou admin.
- Clicar em `Pagar` e concluir pagamento Mercado Pago.
- Confirmar que a fatura muda para `PAID` e salva `paidAt` e `mercadoPagoPaymentId`.
- Confirmar que `/api/billing/monthly-invoices` responde `401` sem segredo e `200` com segredo correto.

## Operacao Segura

- Ative backups automáticos no Supabase.
- Rode backup manual antes de migracoes ou alteracoes grandes:

```powershell
.\scripts\backup.ps1
```

- Guarde backups fora do repositorio. A pasta `backups/` é ignorada pelo Git.
- Monitore os logs da Vercel apos deploy, pagamento e cadastro publico.
- Rotacione imediatamente qualquer segredo exposto em chat, print, log ou commit.
- Revogue/suspenda workspaces suspeitos pelo painel da plataforma.
- Para incidente de pagamento: cancele faturas abertas, confira o pagamento no Mercado Pago e compare valor/moeda antes de marcar manualmente como pago.
- Para incidente de dados: bloqueie usuarios suspeitos, exporte logs de auditoria, troque senhas e preserve evidencias.

## Checklist De Blindagem

- `npm run lint`, `npm test` e `npm run build` passando.
- Webhook Mercado Pago configurado sem segredo na URL e com assinatura ativa.
- `CRON_SECRET`, `AUTH_SECRET`, `DATABASE_URL`, `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` fortes e exclusivos de producao.
- Backups Supabase ativos e restore testado periodicamente.
- LGPD/termos revisados juridicamente antes de uso publico definitivo.

## Proximos Passos

O MVP ja possui os fluxos principais implementados e o deploy de producao esta ativo. As proximas frentes sao:

- Melhorar acabamento comercial do admin SaaS: planos configuraveis, valor customizado por empresa, reenvio de link e historico integrado.
- Criar documentacao LGPD: politica de retencao de dados e termos/consentimento, se aprovado pelo produto.
- Manter validacoes de seguranca, webhook Mercado Pago, PIX e crons acompanhados em producao.
- Evoluir testes conforme novas regras forem adicionadas.

Consulte `docs/ajustes-pendentes.md` para a lista de pendencias.
