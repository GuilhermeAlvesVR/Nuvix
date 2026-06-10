# Detalhe por item: paciente

Data: 2026-06-04

## Objetivo

Criar a primeira pagina de detalhe por item para complementar as listas compactas, com foco no cadastro de pacientes.

## Funcionalidades implementadas

- Nova rota `/app/pacientes/[id]`.
- Lista de pacientes agora possui link `Detalhes` e nome clicavel.
- Detalhe mostra:
  - dados cadastrais completos;
  - observacoes administrativas;
  - total de consultas;
  - total pago confirmado;
  - pendencia estimada;
  - ultimas consultas;
  - ultimos pagamentos;
  - registros clinicos visiveis ao perfil.

## Privacidade e RBAC

- A busca do paciente sempre filtra por `workspaceId`.
- Recepcionistas veem dados administrativos, agenda e pagamentos.
- Registros clinicos aparecem apenas para `ADMIN` e `PROFESSIONAL`.
- Profissionais veem apenas registros clinicos vinculados ao proprio usuario profissional.

## Arquivos alterados

- `src/app/app/pacientes/[id]/page.tsx`
- `src/app/app/pacientes/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Proximo passo sugerido

- Criar detalhe de consulta/agendamento para centralizar status, financeiro e atendimento em uma unica tela.
