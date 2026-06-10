# Passo 4: detalhe do paciente com anotacoes

Data: 2026-06-05

## Alteracoes

- Atualizada a pagina `/app/pacientes/[id]` para carregar `patientNotes` ativas.
- A query filtra anotacoes por paciente e workspace atraves da propria busca do paciente.
- Anotacoes arquivadas nao aparecem por padrao (`archivedAt: null`).
- Adicionada secao `Anotacoes` no detalhe do paciente.
- A lista mostra conteudo, autor, data, categoria e destaque quando marcado como importante.
- A interface reforca que anotacoes sao administrativas/operacionais e que dados clinicos permanecem nos registros de atendimento.
- Estado vazio adicionado quando nao ha anotacoes ativas.

## Validacoes

- `npm run lint`
- `npm run build`

## Proximo passo

- Passo 5: adicionar formulario para nova anotacao e acao de arquivar na UI.
