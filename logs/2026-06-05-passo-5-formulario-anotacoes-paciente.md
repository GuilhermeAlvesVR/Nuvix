# Passo 5: formulario e arquivamento de anotacoes

Data: 2026-06-05

## Alteracoes

- Conectadas as actions `createPatientNote` e `archivePatientNote` na pagina `/app/pacientes/[id]`.
- Adicionado formulario de nova anotacao para `ADMIN` e `RECEPTIONIST`.
- Formulario permite escolher categoria `Administrativa` ou `Operacional`.
- Formulario permite marcar anotacao como importante.
- Adicionada mensagem para nao registrar dados clinicos no campo administrativo.
- Adicionado botao `Arquivar` nas anotacoes ativas para perfis autorizados.
- `PROFESSIONAL` permanece apenas com visualizacao no MVP.
- Adicionados estilos minimos para checkbox e espacamento do formulario.

## Validacoes

- `npm run lint`
- `npm run build`

## Proximo passo

- Passo 6: revisar auditoria/invalidação e consolidar comportamento de criacao/arquivamento.
