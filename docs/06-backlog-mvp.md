# Backlog Do MVP

## Epic 1: Autenticacao E Usuarios

### US-001 Login

Como usuario, quero acessar o sistema com email e senha para usar funcionalidades protegidas.

Criterios de aceite:

- Login valido cria sessao autenticada.
- Login invalido exibe mensagem clara.
- Usuario inativo nao consegue entrar.

### US-002 Gerenciar Usuarios

Como administrador, quero criar e desativar usuarios para controlar o acesso ao sistema.

Criterios de aceite:

- Administrador cria usuario com nome, email e perfil.
- Email de usuario deve ser unico.
- Usuario desativado perde acesso.

## Epic 2: Pacientes

### US-003 Cadastrar Paciente

Como recepcionista, quero cadastrar pacientes para usar os dados em consultas futuras.

Criterios de aceite:

- Nome e telefone ou email sao obrigatorios.
- Documento nao pode duplicar quando informado.
- Paciente cadastrado aparece na busca.

### US-004 Buscar Paciente

Como usuario, quero buscar pacientes por nome, telefone ou documento para encontrar rapidamente um cadastro.

Criterios de aceite:

- Busca retorna resultados parciais por nome.
- Busca por documento retorna cadastro exato quando existir.
- Resultados exibem nome, telefone e status.

## Epic 3: Agenda E Consultas

### US-005 Agendar Consulta

Como recepcionista, quero agendar consulta para um paciente com um profissional.

Criterios de aceite:

- Consulta exige paciente, profissional, data, hora e valor.
- Sistema bloqueia conflito de horario para o mesmo profissional.
- Consulta nasce com status agendada e financeiro pendente.

### US-006 Alterar Status Da Consulta

Como usuario autorizado, quero alterar o status da consulta para acompanhar o atendimento.

Criterios de aceite:

- Status pode mudar para confirmada, em atendimento, realizada, cancelada ou falta.
- Consulta cancelada nao aparece como receita realizada.
- Alteracao registra usuario e data.

## Epic 4: Atendimento

### US-007 Registrar Atendimento

Como profissional, quero registrar informacoes da consulta para manter historico do paciente.

Criterios de aceite:

- Apenas profissional autorizado registra atendimento.
- Registro fica vinculado a consulta e ao paciente.
- Historico do paciente mostra registros anteriores.

## Epic 5: Financeiro

### US-008 Registrar Pagamento

Como recepcionista, quero registrar pagamento de consulta para controlar receitas.

Criterios de aceite:

- Pagamento exige valor, metodo, data e consulta.
- Pagamento confirmado atualiza status financeiro da consulta.
- Pagamento parcial deixa consulta como parcial.

### US-009 Registrar Despesa

Como administrador, quero registrar despesas para acompanhar o saldo do consultorio.

Criterios de aceite:

- Despesa exige descricao, categoria, valor e data.
- Despesa confirmada entra no relatorio financeiro.
- Despesa cancelada nao entra no saldo final.

## Epic 6: Relatorios

### US-010 Relatorio De Consultas

Como administrador, quero ver consultas por periodo para acompanhar movimento do consultorio.

Criterios de aceite:

- Filtro por data inicial e final.
- Filtro opcional por profissional e status.
- Resultado mostra quantidade e lista de consultas.

### US-011 Relatorio Financeiro

Como administrador, quero ver receitas, despesas e saldo para entender o resultado financeiro.

Criterios de aceite:

- Relatorio mostra total recebido, total pendente, despesas e saldo.
- Filtro por periodo.
- Considera apenas pagamentos e despesas confirmadas no saldo.

## Epic 7: Anotacoes Administrativas

### US-012 Anotacoes Por Paciente

Como usuario autorizado do consultorio, quero registrar anotacoes administrativas no cadastro do paciente para manter um historico interno de informacoes relevantes sem misturar com o registro clinico.

Criterios de aceite:

- Administrador e recepcionista criam anotacoes administrativas para um paciente do proprio consultorio.
- Profissional cria e visualiza anotacoes administrativas/operacionais, mas nao arquiva no MVP.
- Profissional so acessa anotacoes de pacientes vinculados as suas consultas.
- Anotacao exige categoria e conteudo.
- Lista de anotacoes aparece no detalhe do paciente em ordem da mais recente para a mais antiga.
- Anotacoes ativas podem ser corrigidas conforme permissao do perfil.
- Anotacoes arquivadas nao aparecem por padrao.
- Arquivamento nao exclui a anotacao do banco e registra usuario e data.
- Informacoes clinicas continuam restritas ao registro de atendimento.

Spec detalhada:

- `docs/specs/US-012-anotacoes-por-paciente.md`
