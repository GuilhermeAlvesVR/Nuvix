# Regras De Negocio

## Pacientes

- Um paciente deve ter pelo menos nome e telefone ou email.
- Documento do paciente deve ser unico quando informado.
- Pacientes inativos nao devem aparecer como primeira opcao em novos agendamentos.
- O historico de consultas nao deve ser removido quando um paciente for inativado.

## Consultas

- Uma consulta deve pertencer a um paciente e a um profissional.
- Um profissional nao pode ter duas consultas no mesmo horario.
- Consultas realizadas nao podem ser excluidas; devem ser canceladas ou corrigidas por usuario autorizado.
- Uma consulta cancelada nao deve contar como receita prevista, exceto se houver taxa de cancelamento configurada futuramente.
- Uma consulta com status falta pode gerar pendencia financeira se o consultorio definir essa politica.

## Atendimento

- Apenas profissional autorizado deve registrar ou editar dados clinicos da consulta.
- Alteracoes em registros clinicos devem manter auditoria minima: usuario, data e hora.
- O atendimento so pode ser registrado para consulta em status em atendimento ou realizada.

## Financeiro

- Uma consulta pode ter nenhum, um ou varios pagamentos.
- Pagamento parcial deve atualizar o status financeiro para parcial.
- Quando a soma dos pagamentos confirmados for igual ou maior que o valor da consulta, o status financeiro deve ser pago.
- Despesas devem ter descricao, categoria, valor, data e status.
- Relatorios financeiros devem considerar apenas pagamentos confirmados e despesas confirmadas, salvo filtro especifico.

## Usuarios E Acesso

- Usuario desativado nao pode acessar o sistema.
- Senhas nunca devem ser armazenadas em texto puro.
- Perfis de acesso devem limitar telas e acoes disponiveis.

## LGPD E Privacidade

- Dados de pacientes devem ser acessados apenas por usuarios autorizados.
- Exportacoes de relatorios com dados pessoais devem ser restritas.
- O sistema deve registrar quem acessa ou altera dados sensiveis quando possivel.
