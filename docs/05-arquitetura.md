# Arquitetura Sugerida

## Objetivo Tecnico

Criar um sistema web seguro, responsivo e facil de manter, com separacao clara entre interface, regras de negocio e persistencia.

## Stack Sugerida

- Frontend/backend: Next.js com TypeScript.
- Banco de dados: PostgreSQL.
- ORM: Prisma.
- Autenticacao: Auth.js ou implementacao propria com sessoes seguras.
- UI: Tailwind CSS ou biblioteca de componentes escolhida pelo time.
- Testes: Vitest para unidade e Playwright para fluxos principais.

## Alternativa Mais Simples

- Laravel + PostgreSQL ou MySQL.
- Blade/Inertia para interface.
- Policies/Gates para permissoes.

## Camadas

- Interface: telas, formularios, tabelas e filtros.
- Aplicacao: casos de uso como cadastrar paciente, agendar consulta e registrar pagamento.
- Dominio: regras de negocio e validacoes.
- Persistencia: banco de dados, migrations e consultas.

## Principais Fluxos

### Cadastro De Paciente

1. Usuario preenche dados minimos.
2. Sistema valida documento, telefone/email e campos obrigatorios.
3. Sistema salva paciente ativo.
4. Sistema registra auditoria.

### Agendamento

1. Usuario escolhe paciente, profissional, data e horario.
2. Sistema verifica conflito de agenda.
3. Sistema cria consulta com status agendada.
4. Sistema registra valor previsto e status financeiro pendente.

### Registro De Atendimento

1. Profissional acessa consulta.
2. Sistema verifica permissao.
3. Profissional registra resumo, observacoes e conduta.
4. Sistema salva registro clinico e marca consulta como realizada.

### Pagamento

1. Usuario registra pagamento vinculado a consulta.
2. Sistema valida valor e metodo.
3. Sistema atualiza status financeiro da consulta.
4. Sistema inclui pagamento nos relatorios.

## Seguranca

- Hash de senha com algoritmo seguro.
- Controle de acesso por perfil.
- Protecao contra acesso direto a registros sem permissao.
- Validacao no servidor, nao apenas no frontend.
- Logs de alteracao para dados sensiveis.

## Ambientes

- Desenvolvimento local.
- Homologacao para validacao do cliente.
- Producao com backup automatico.
