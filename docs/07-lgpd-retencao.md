# LGPD, Termos e Retencao de Dados

Este documento e uma minuta operacional para orientar o uso do Nuvix. Ele nao substitui revisao juridica por profissional habilitado antes de publicacao como politica oficial.

## Papeis e Responsabilidades

- Codefy/Nuvix: fornece a plataforma, infraestrutura, seguranca tecnica, controle de acesso, logs de auditoria e mecanismos de exportacao de dados.
- Empresa contratante: e responsavel pelos dados que cadastra, pela base legal para tratar dados de seus clientes/pacientes, pela orientacao de seus usuarios internos e pelo atendimento direto aos titulares quando aplicavel.
- Usuarios internos: devem acessar somente dados necessarios para sua funcao e manter sigilo sobre informacoes pessoais, financeiras e clinicas.

## Dados Tratados

- Dados de identificacao: nome, telefone, email, documento e endereco quando informados.
- Dados operacionais: agendamentos, status de atendimento, profissionais, configuracoes e historico de uso.
- Dados financeiros: pagamentos, despesas, faturas, status financeiro e identificadores de pagamento.
- Dados clinicos: registros de atendimento, queixas, condutas, observacoes e anexos futuros, quando existirem.
- Dados de auditoria: usuario, acao, entidade alterada, data/hora e metadados minimos da operacao.

## Finalidades

- Organizar a gestao da empresa contratante.
- Permitir cadastro, atendimento, agenda, financeiro, relatorios e faturamento.
- Manter historico operacional e clinico necessario para continuidade do atendimento.
- Cumprir obrigacoes legais, fiscais, contratuais, regulatorias e de defesa em processos administrativos/judiciais.
- Proteger a seguranca do sistema, prevenir fraude e registrar auditoria minima.

## Bases Legais Provaveis

- Execucao de contrato: para disponibilizar o sistema e processar dados necessarios ao servico contratado.
- Cumprimento de obrigacao legal/regulatoria: para dados fiscais, financeiros e documentos que a empresa precise manter.
- Legitimo interesse: para seguranca, auditoria, prevencao a fraude e melhoria operacional, respeitados os direitos do titular.
- Tutela da saude ou obrigacoes profissionais: quando houver dados clinicos tratados pela empresa contratante e seus profissionais habilitados.
- Consentimento: quando a empresa contratante optar por coletar aceite explicito de seus clientes/pacientes para finalidades especificas.

## Retencao

- Dados cadastrais, operacionais e financeiros podem ser mantidos enquanto a empresa usar o sistema e pelo periodo necessario ao cumprimento de obrigacoes legais, contratuais, fiscais ou de defesa de direitos.
- Dados clinicos nao devem ser removidos automaticamente, pois podem ser necessarios para continuidade do atendimento, historico profissional, defesa legal e obrigacoes regulatorias.
- Pacientes/clientes podem ser inativados para impedir uso operacional sem apagar historico existente.
- Exportacao dos dados do paciente/cliente deve estar disponivel para atendimento de solicitacoes LGPD.
- Exclusao definitiva ou anonimizacao deve ser analisada caso a caso, considerando obrigacoes legais, historico clinico, necessidade de auditoria e impacto na integridade do prontuario/historico.
- Backups podem manter dados por periodo tecnico necessario para recuperacao e continuidade do servico.

## Direitos do Titular

Quando aplicavel, titulares podem solicitar:

- Confirmacao de tratamento.
- Acesso aos dados.
- Correcao de dados incompletos, inexatos ou desatualizados.
- Portabilidade/exportacao, observados limites legais e tecnicos.
- Anonimizacao, bloqueio ou eliminacao de dados desnecessarios ou tratados em desconformidade.
- Informacoes sobre compartilhamento.

A empresa contratante deve avaliar cada solicitacao e acionar os recursos do sistema, como exportacao de dados e inativacao, quando cabivel.

## Consentimento e Transparencia

- O cadastro publico da empresa exige aceite explicito dos termos e registra data/hora e versao aceita no workspace.
- O cadastro de pacientes/clientes deve observar a politica da empresa contratante e as regras de seu setor.
- O sistema deve evitar uso de dados pessoais para finalidades nao relacionadas a operacao contratada.
- Mudancas relevantes em termos ou politica de privacidade devem gerar nova versao e, quando necessario, novo aceite.

## Texto de Aceite Atual no Cadastro Publico

> Declaro que sou responsavel pelos dados cadastrados pela empresa e aceito o tratamento de dados necessario para operacao do sistema, conforme a politica inicial de LGPD.

Sugestao para versao publica revisada:

> Declaro que li e aceito os Termos de Uso e a Politica de Privacidade do Nuvix. Confirmo que sou responsavel pelas informacoes cadastradas em nome da empresa e autorizo o tratamento dos dados necessarios para criacao da conta, prestacao do servico, seguranca, auditoria e cumprimento de obrigacoes legais e contratuais.

## Seguranca

- Acesso aos dados deve ser limitado por perfil de usuario.
- Senhas devem ser armazenadas somente com hash seguro.
- Dados sensiveis nao devem ser expostos em logs, CSVs ou mensagens de erro alem do estritamente necessario.
- Alteracoes clinicas, exportacoes LGPD e acoes sensiveis de administracao devem manter auditoria minima.
- Segredos de producao devem ser armazenados apenas em variaveis de ambiente seguras e rotacionados em caso de exposicao.
- Webhooks de pagamento devem validar assinatura oficial do provedor e conferir valor, moeda e referencia da fatura.

## Compartilhamento e Suboperadores

O sistema pode depender de fornecedores de infraestrutura e pagamento, como Vercel, Supabase e Mercado Pago. Esses fornecedores tratam dados apenas na medida necessaria para hospedagem, banco de dados, execucao da aplicacao, pagamentos, seguranca e disponibilidade.

## Incidentes

Em caso de suspeita de incidente:

- Bloquear usuarios ou workspaces suspeitos.
- Preservar logs de auditoria e evidencias.
- Rotacionar segredos e senhas afetadas.
- Avaliar impacto, dados envolvidos, titulares afetados e necessidade de comunicacao a clientes, titulares ou autoridades.
- Restaurar operacao a partir de backup confiavel, se necessario.

## Termos de Uso: Pontos Minimos

Uma versao publica dos termos deve cobrir:

- Descricao do servico.
- Responsabilidades da empresa contratante pelos dados cadastrados.
- Obrigacao dos usuarios de manter sigilo e credenciais seguras.
- Regras de pagamento, faturas, cancelamento e inadimplencia.
- Limitacoes do sistema e indisponibilidades eventuais.
- Proibicao de uso indevido, acesso nao autorizado, engenharia reversa ou tentativa de burlar seguranca.
- Tratamento de dados pessoais conforme politica de privacidade.
- Suporte, atualizacoes e mudancas no servico.
- Suspensao ou encerramento de contas em caso de abuso, inadimplencia ou risco de seguranca.

## Pendencias Para Politica Oficial

- Revisao juridica dos termos, politica de privacidade e texto de aceite.
- Validacao de prazos legais especificos por area de atuacao.
- Definicao de canal oficial para solicitacoes LGPD.
- Definicao formal de controlador/operador em contrato com cada empresa contratante.
- Publicacao dos links de Termos de Uso e Politica de Privacidade no cadastro e login.
