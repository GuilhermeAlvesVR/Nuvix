# US-012 Anotacoes Por Paciente

## Objetivo

Permitir que usuarios autorizados registrem anotacoes administrativas ou operacionais vinculadas a um paciente, mantendo historico, autoria e data, sem substituir o registro clinico da consulta.

A funcionalidade deve apoiar a rotina do consultorio com informacoes internas como preferencias de contato, instrucoes administrativas, lembretes operacionais e observacoes de recepcao.

## Escopo MVP

Dentro do escopo inicial:

- Criar anotacao vinculada a um paciente.
- Listar anotacoes na tela de detalhe do paciente.
- Editar anotacoes ativas com permissao.
- Exibir conteudo, categoria, autor e data de criacao.
- Arquivar anotacao sem exclusao fisica.
- Ocultar anotacoes arquivadas por padrao.
- Validar permissoes no servidor.
- Registrar auditoria minima para criacao e arquivamento quando a estrutura estiver disponivel.

Fora do escopo inicial:

- Exclusao definitiva.
- Anexos.
- Tags livres.
- Comentarios em thread.
- Notificacoes.
- Busca avancada em anotacoes.
- Uso como prontuario clinico.

## Diferenca Entre Anotacao E Registro Clinico

Anotacoes por paciente sao administrativas ou operacionais.

Exemplos permitidos:

- Prefere contato por WhatsApp.
- Solicita ligacao apos 18h.
- Enviar recibos por email.
- Evitar remarcacao em determinado periodo.

Registros clinicos devem continuar em `ClinicalRecord`, vinculados a uma consulta.

Exemplos que nao devem ser registrados em anotacoes administrativas:

- Queixa principal.
- Evolucao clinica.
- Hipotese diagnostica.
- Conduta.
- Prescricao.
- Observacoes clinicas sensiveis.

Regra principal: anotacoes por paciente nao substituem prontuario, evolucao ou resumo clinico.

## Telas Necessarias

### Detalhe Do Paciente

Rota existente:

- `/app/pacientes/[id]`

Adicionar uma secao chamada `Anotacoes` com:

- formulario simples para nova anotacao;
- lista das anotacoes ativas em ordem da mais recente para a mais antiga;
- autor e data de criacao;
- categoria;
- acao de arquivar conforme permissao;
- estado vazio quando nao houver anotacoes.

### Visualizacao De Arquivadas

Para o MVP, anotacoes arquivadas nao aparecem por padrao.

Pode ser adicionada depois uma opcao `Ver arquivadas`, restrita a perfis autorizados.

## Regras De Negocio

- Uma anotacao pertence a um unico paciente.
- Uma anotacao pertence a um unico workspace.
- Uma anotacao deve ter conteudo obrigatorio.
- Uma anotacao deve registrar o usuario criador.
- Anotacoes nao devem ser apagadas fisicamente no fluxo comum.
- Anotacoes podem ser arquivadas.
- Anotacoes arquivadas nao aparecem por padrao.
- Usuario so pode acessar anotacoes do proprio workspace.
- Profissional so pode acessar anotacoes de pacientes vinculados a consultas do proprio profissional.
- Paciente inativo pode receber anotacao, mas a interface deve indicar que ele esta inativo.
- Dados clinicos sensiveis nao devem ser registrados nesta funcionalidade.
- Criacao e arquivamento devem ser validados no servidor.
- Criacao e arquivamento devem registrar auditoria quando a estrutura estiver disponivel.

## Permissoes

### ADMIN

Pode:

- visualizar anotacoes administrativas do paciente;
- criar anotacao;
- arquivar qualquer anotacao;
- visualizar anotacoes arquivadas quando o filtro existir.

### RECEPTIONIST

Pode:

- visualizar anotacoes administrativas do paciente;
- criar anotacao administrativa ou operacional;
- arquivar anotacoes administrativas, conforme regra do MVP.

Nao pode:

- registrar dados clinicos nesta funcionalidade;
- acessar registros clinicos por meio desta funcionalidade.

### PROFESSIONAL

Pode:

- visualizar anotacoes administrativas relevantes ao atendimento.
- criar anotacoes administrativas ou operacionais que nao contenham dados clinicos.

Nao deve:

- usar anotacoes administrativas como prontuario;
- registrar evolucao clinica nesta funcionalidade.
- acessar pacientes sem consulta vinculada ao proprio profissional.

Decisao MVP: profissional pode criar anotacoes administrativas/operacionais apenas para pacientes vinculados as suas consultas, mas nao pode arquivar anotacoes.

### PLATFORM_ADMIN

Nao deve acessar dados de pacientes por padrao.

## Campos Do Banco

Nova entidade sugerida: `PatientNote`.

Campos:

- `id`: identificador unico.
- `workspaceId`: workspace dono da anotacao.
- `patientId`: paciente vinculado.
- `content`: conteudo textual da anotacao.
- `category`: categoria da anotacao.
- `important`: marcador opcional de destaque.
- `archivedAt`: data de arquivamento, nulo quando ativa.
- `archivedByUserId`: usuario que arquivou, nulo quando ativa.
- `createdByUserId`: usuario que criou.
- `createdAt`: data de criacao.
- `updatedAt`: data de atualizacao tecnica.
- `updatedByUserId`: usuario que editou a anotacao pela ultima vez.

Enum sugerido: `PatientNoteCategory`.

Valores iniciais:

- `ADMINISTRATIVE`
- `OPERATIONAL`

Nao criar categoria `CLINICAL` no MVP para evitar confusao com `ClinicalRecord`.

Relacionamentos:

- `Workspace` possui muitas `PatientNote`.
- `Patient` possui muitas `PatientNote`.
- `User` cria muitas `PatientNote`.
- `User` arquiva muitas `PatientNote`.

Indices recomendados:

- `workspaceId, patientId, createdAt`
- `workspaceId, patientId, archivedAt`
- `workspaceId, createdByUserId`

## Validacoes

### Conteudo

- Obrigatorio.
- Remover espacos no inicio e fim.
- Minimo sugerido: 3 caracteres.
- Maximo sugerido: 2000 caracteres.
- Nao aceitar HTML como conteudo renderizado.

### Categoria

- Obrigatoria.
- Deve ser uma das categorias permitidas.

### Paciente

- Deve existir.
- Deve pertencer ao workspace do usuario autenticado.
- Se o usuario for `PROFESSIONAL`, deve ter consulta vinculada ao profissional do usuario.

### Permissao

- Validar sempre no servidor.
- Usuario inativo nao pode criar ou arquivar.
- `PROFESSIONAL` pode criar anotacao administrativa ou operacional, mas nao pode arquivar no MVP.

### Arquivamento

- Deve preencher `archivedAt`.
- Deve preencher `archivedByUserId`.
- Nao deve apagar a linha do banco.
- Anotacao ja arquivada nao deve ser arquivada novamente.

### Edicao

- Anotacao arquivada nao pode ser editada.
- `ADMIN` pode editar qualquer anotacao ativa do workspace.
- `RECEPTIONIST` pode editar apenas anotacoes ativas criadas pelo proprio usuario.
- `PROFESSIONAL` pode editar apenas anotacoes ativas criadas pelo proprio usuario e de paciente vinculado as suas consultas.
- Edicao deve preencher `updatedByUserId`.
- Edicao deve registrar auditoria sem gravar o conteudo da anotacao no metadata.

## Fluxo Do Usuario

### Criar Anotacao

1. Usuario acessa o detalhe do paciente.
2. Sistema valida acesso ao paciente pelo workspace e perfil.
3. Usuario preenche categoria e conteudo.
4. Sistema valida conteudo, categoria e permissao.
5. Sistema salva anotacao vinculada ao paciente e workspace.
6. Sistema registra autoria e data.
7. Sistema registra auditoria quando disponivel.
8. Tela exibe a anotacao no historico do paciente.

### Listar Anotacoes

1. Usuario acessa o detalhe do paciente.
2. Sistema busca anotacoes ativas do paciente no mesmo workspace.
3. Sistema exibe anotacoes da mais recente para a mais antiga.
4. Sistema nao exibe arquivadas por padrao.

### Arquivar Anotacao

1. Usuario clica em `Arquivar`.
2. Sistema valida permissao e workspace.
3. Sistema preenche `archivedAt` e `archivedByUserId`.
4. Sistema registra auditoria quando disponivel.
5. Anotacao deixa de aparecer na lista padrao.

### Editar Anotacao

1. Usuario abre uma anotacao ativa permitida.
2. Usuario ajusta conteudo, categoria ou destaque.
3. Sistema valida permissao, conteudo, categoria e vinculo com paciente.
4. Sistema salva a alteracao e preenche `updatedByUserId`.
5. Sistema registra auditoria sem gravar o conteudo no metadata.
6. Tela exibe a anotacao atualizada no historico do paciente.

## Criterios De Aceite

### Criacao

- Dado um paciente existente, quando `ADMIN` criar uma anotacao valida, entao ela deve aparecer no historico do paciente.
- Dado um paciente existente, quando `RECEPTIONIST` criar uma anotacao valida, entao ela deve aparecer no historico do paciente.
- Dado um usuario `PROFESSIONAL`, quando criar uma anotacao administrativa ou operacional valida, entao ela deve aparecer no historico do paciente.
- Dado um usuario `PROFESSIONAL`, quando tentar acessar ou criar anotacao para paciente sem consulta vinculada ao proprio profissional, entao o sistema deve negar acesso.
- Dado conteudo vazio, quando tentar salvar, entao o sistema deve exibir mensagem clara de validacao.
- Dado paciente de outro workspace, quando tentar criar anotacao, entao o sistema deve negar acesso.

### Listagem

- A tela de detalhe do paciente deve exibir anotacoes ativas em ordem da mais recente para a mais antiga.
- Cada anotacao deve mostrar conteudo, categoria, autor e data de criacao.
- Anotacoes arquivadas nao devem aparecer por padrao.
- Usuario sem acesso ao workspace do paciente nao deve visualizar anotacoes.
- Profissional sem consulta vinculada ao paciente nao deve visualizar o detalhe nem as anotacoes do paciente.

### Arquivamento

- `ADMIN` deve conseguir arquivar qualquer anotacao do workspace.
- `RECEPTIONIST` deve conseguir arquivar anotacoes administrativas no MVP.
- `PROFESSIONAL` nao deve conseguir arquivar anotacoes no MVP.
- Anotacao arquivada nao deve ser excluida do banco.
- Anotacao arquivada nao deve aparecer na lista padrao.
- Arquivamento deve registrar usuario e data.

### Edicao

- `ADMIN` deve conseguir editar qualquer anotacao ativa do workspace.
- `RECEPTIONIST` deve conseguir editar apenas anotacoes ativas criadas pelo proprio usuario.
- `PROFESSIONAL` deve conseguir editar apenas anotacoes ativas criadas pelo proprio usuario e de paciente vinculado as suas consultas.
- Anotacao arquivada nao deve exibir acao de edicao.
- Edicao deve registrar `updatedByUserId`, `updatedAt` e evento de auditoria.

### LGPD E Separacao Clinica

- A interface deve deixar claro que a anotacao nao e registro clinico.
- `ClinicalRecord` deve continuar sendo o local para informacoes clinicas da consulta.
- Recepcionista nao deve ganhar acesso a registros clinicos por causa desta funcionalidade.
- Todas as acoes devem ser validadas no servidor.

## Riscos E Duvidas

### Riscos

- Usuarios registrarem dados clinicos no campo administrativo.
- Exposicao indevida de informacoes sensiveis para recepcao.
- Confusao entre `Patient.notes`, `PatientNote` e `ClinicalRecord`.
- Crescimento da lista sem paginacao.
- Auditoria insuficiente para dados sensiveis.

### Duvidas

- O campo atual `Patient.notes` sera mantido como observacao legada ou migrado para `PatientNote`?
- `RECEPTIONIST` deve arquivar qualquer anotacao ou apenas anotacoes criadas pela recepcao?
- Deve existir filtro para anotacoes arquivadas ainda no MVP?
- A mensagem de alerta contra dados clinicos deve ser exibida sempre no formulario?

## Impacto Tecnico Previsto

- Atualizar `prisma/schema.prisma` com `PatientNote` e `PatientNoteCategory`.
- Criar migracao quando o banco estiver configurado.
- Atualizar detalhe do paciente em `src/app/app/pacientes/[id]/page.tsx`.
- Adicionar server actions para criar e arquivar anotacoes.
- Revalidar a rota do paciente apos mutacoes.
- Usar `workspaceId` em todas as queries.
- Rodar `npx prisma validate`, `npm run prisma:generate`, `npm run lint` e `npm run build` apos a implementacao.
