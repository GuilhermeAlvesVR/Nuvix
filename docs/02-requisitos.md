# Requisitos

## Requisitos Funcionais

### Autenticacao E Usuarios

- O sistema deve permitir login com email e senha.
- O sistema deve permitir perfis de acesso: administrador, recepcionista e profissional.
- O administrador deve poder criar, editar, ativar e desativar usuarios.

### Pacientes

- O sistema deve permitir cadastrar pacientes.
- O cadastro deve conter nome, data de nascimento, telefone, email, documento, endereco e observacoes.
- O sistema deve permitir buscar pacientes por nome, telefone ou documento.
- O sistema deve manter historico de consultas do paciente.

### Profissionais

- O sistema deve permitir cadastrar profissionais.
- O cadastro deve conter nome, especialidade, documento profissional, telefone, email e status.
- O sistema deve permitir vincular consultas a um profissional.

### Agenda E Consultas

- O sistema deve permitir criar consultas com paciente, profissional, data, horario, tipo, valor e status.
- Status previstos: agendada, confirmada, em atendimento, realizada, cancelada e falta.
- O sistema deve exibir consultas por dia, semana e profissional.
- O sistema deve impedir conflito de horario para o mesmo profissional.

### Registro De Atendimento

- O profissional deve poder registrar resumo da consulta.
- O sistema deve permitir registrar queixas, observacoes, conduta e retorno recomendado.
- O registro deve ficar vinculado ao paciente e a consulta.

### Financeiro

- O sistema deve permitir registrar pagamentos de consultas.
- O sistema deve controlar status financeiro: pendente, pago, parcial, cancelado.
- O sistema deve permitir cadastrar despesas.
- O sistema deve permitir filtrar receitas e despesas por periodo.

### Relatorios

- O sistema deve gerar relatorio de consultas por periodo.
- O sistema deve gerar relatorio de pacientes atendidos por periodo.
- O sistema deve gerar relatorio financeiro com receitas, despesas, saldo e pendencias.

## Requisitos Nao Funcionais

- O sistema deve ser responsivo para desktop, tablet e celular.
- O sistema deve proteger dados sensiveis com autenticacao e controle de acesso.
- O sistema deve registrar datas de criacao e atualizacao dos principais registros.
- O sistema deve ter backups regulares em ambiente de producao.
- O sistema deve responder consultas comuns em ate 2 segundos em uso normal.
- O sistema deve ser preparado para LGPD, com controle de acesso e possibilidade de anonimizar ou excluir dados quando aplicavel.

## Permissoes Iniciais

| Acao | Administrador | Recepcionista | Profissional |
| --- | --- | --- | --- |
| Gerenciar usuarios | Sim | Nao | Nao |
| Gerenciar pacientes | Sim | Sim | Consulta/edicao limitada |
| Gerenciar agenda | Sim | Sim | Consulta propria |
| Registrar atendimento | Sim | Nao | Sim |
| Gerenciar financeiro | Sim | Sim | Nao |
| Ver relatorios financeiros | Sim | Nao | Nao |
