# Editar e inativar paciente

Data: 2026-06-05

## Objetivo

Executar o terceiro passo do plano restante: permitir editar dados cadastrais e inativar/reativar pacientes preservando historico.

## Funcionalidades implementadas

- Formulario de edicao no detalhe `/app/pacientes/[id]`.
- Atualizacao de:
  - nome;
  - data de nascimento;
  - documento;
  - telefone;
  - email;
  - endereco;
  - observacoes administrativas.
- Botao para inativar paciente ativo.
- Botao para reativar paciente inativo.
- Historico de consultas, pagamentos e registros clinicos nao e apagado.

## Validacoes server-side

- Apenas ADMIN e RECEPTIONIST podem editar/inativar/reativar pacientes.
- Nome continua obrigatorio.
- Pelo menos telefone ou email continua obrigatorio.
- Email precisa ter formato basico valido.
- Documento continua unico por empresa quando informado.
- Todas as alteracoes filtram por `workspaceId`.

## Arquivos alterados

- `src/app/app/pacientes/actions.ts`
- `src/app/app/pacientes/[id]/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Plano restante

- Relatorios reais.
- Melhorar configuracoes/usuarios escondendo campos profissionais quando o perfil nao for profissional.
- Ajustes de producao/upload.
