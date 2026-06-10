# Ver anotacoes arquivadas

Data: 2026-06-05

## Alteracoes

- Adicionado filtro de anotacoes no detalhe do paciente.
- Por padrao, `/app/pacientes/[id]` mostra anotacoes ativas.
- `?notes=archived` mostra anotacoes arquivadas.
- Adicionados botoes `Ativas` e `Arquivadas` na secao de anotacoes.
- Ao visualizar arquivadas, o formulario de nova anotacao fica oculto.
- Ao visualizar arquivadas, o botao `Arquivar` fica oculto.
- Anotacoes arquivadas mostram usuario e data de arquivamento quando disponiveis.
- Estado vazio diferenciado para ativas e arquivadas.

## Arquivos alterados

- `src/app/app/pacientes/[id]/page.tsx`
- `src/app/globals.css`

## Validacoes

- `npm run lint`
- `npm run build`
