# Passo 6: auditoria e invalidacao de anotacoes

Data: 2026-06-05

## Revisao

- Confirmado que criacao de anotacao registra `AuditLog` com `entityName: PatientNote` e acao `CREATE_PATIENT_NOTE`.
- Confirmado que arquivamento registra `AuditLog` com `entityName: PatientNote` e acao `ARCHIVE_PATIENT_NOTE`.
- Confirmado que o conteudo da anotacao nao e gravado no `metadataJson`, reduzindo exposicao de dados administrativos sensiveis em auditoria.
- Confirmado que as actions filtram por `workspaceId` e validam permissao no servidor.
- Confirmado que a pagina do paciente e a lista de pacientes sao revalidadas apos criacao/arquivamento.

## Alteracoes

- Ajustados redirects de anotacao criada para `noteCreated=1`.
- Ajustados redirects de anotacao arquivada para `noteArchived=1`.
- Adicionadas mensagens especificas na tela do paciente:
  - `Anotacao salva com sucesso.`
  - `Anotacao arquivada com sucesso.`
- Mantida a mensagem `Cadastro atualizado com sucesso.` apenas para atualizacoes do cadastro.

## Validacoes

- `npm run lint`
- `npm run build`

## Proximo passo

- Passo 7: validacao final completa do fluxo de anotacoes por paciente.
