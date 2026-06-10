# Cache curto de sessao para navegacao

Data: 2026-06-04

## Objetivo

Reduzir navegacoes de 2 a 4 segundos onde o `application-code` estava alto mesmo em paginas simples como `/app`.

## Problema identificado

- As rotas do app autenticado dependem da leitura de sessao.
- A pagina `/app` chegou a ficar lenta mesmo quase sem consultas proprias, indicando gargalo na leitura de usuario/workspace da sessao.
- Como cada navegacao server-side consulta a sessao, uma leitura lenta do banco afeta todas as paginas.

## Melhorias implementadas

- Criado cache curto de 60 segundos para a leitura de usuario por id da sessao.
- O cache inclui dados essenciais do workspace usados no layout e labels.
- Invalida o cache quando:
  - um usuario e ativado/desativado;
  - o admin altera configuracoes da empresa atual.

## Arquivos alterados

- `src/lib/session.ts`
- `src/app/app/configuracoes/actions.ts`
- `src/app/app/configuracoes/usuarios/actions.ts`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Acao necessaria

- Reiniciar `npm run dev` para carregar a nova versao do codigo e testar novamente.

## Observacao

- Este cache reduz a ida ao banco nas navegacoes subsequentes do mesmo usuario.
- Alteracoes criticas de usuario invalidam o cache explicitamente.
