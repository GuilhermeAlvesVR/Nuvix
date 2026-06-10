# Plano De Proximos Passos

Objetivo: colocar o sistema funcionando de ponta a ponta e depois evoluir de consultorios/saude para uma plataforma multi-segmento configuravel.

## Ordem Recomendada

1. Configurar banco de dados e variaveis de ambiente

   Status: concluido em 2026-06-08. `.env` possui `DATABASE_URL` e `AUTH_SECRET` configurados.

   Definir `DATABASE_URL`, `AUTH_SECRET` e confirmar que o PostgreSQL esta acessivel.

2. Rodar Prisma e preparar estrutura do banco

   Status: concluido em 2026-06-08. Prisma schema validado, Prisma Client gerado e tabelas principais encontradas no banco.

   Executar geracao do Prisma Client e migrations para criar as tabelas necessarias.

3. Criar administrador inicial da plataforma

   Status: concluido em 2026-06-08. Existe 1 administrador ativo da plataforma no banco.

   Gerar o primeiro usuario administrador para acessar e operar o sistema.

4. Validar fluxo basico atual

   Status: concluido em 2026-06-08. Login, admin, empresas, pacientes, profissionais, agenda, atendimento, financeiro e relatorios foram revisados. Banco possui dados nos modulos principais. `npm run lint` e `npm run build` passaram.

   Observacao: foi corrigida a validacao de empresa ao vincular usuario a profissional, garantindo que o profissional alterado pertence ao workspace atual.

   Testar login, cadastro/aprovacao de empresa, pacientes, profissionais, agenda, atendimentos, pagamentos, despesas e relatorios.

5. Ajustar textos e identidade para plataforma multi-segmento

   Status: concluido em 2026-06-08. Telas principais foram ajustadas para reduzir termos fixos de saude/consultorio e usar labels configuraveis quando disponiveis. Foram atualizados agenda, detalhe de atendimento, registro, financeiro, pagamentos, relatorios, configuracoes, profissionais e cadastro/detalhe de clientes. `npm run lint` e `npm run build` passaram.

   Reduzir termos fixos de saude quando o sistema deve atender outros tipos de prestadores de servico.

6. Criar configuracao por segmento

   Status: concluido em 2026-06-08. Foram adicionados os segmentos Contabilidade, Arquitetura e Coaching/Terapia ao schema, banco e opcoes da aplicacao. A tela de configuracoes agora mostra o segmento atual, os termos em uso e uma lista de padroes por segmento. `npx prisma validate`, `npm run prisma:generate`, `npm run migrate:workspace-types`, `npm run lint` e `npm run build` passaram.

   Permitir que o dono do negocio escolha o segmento e configure o vocabulario principal: cliente, sessao, registro, profissional e financeiro.

7. Implementar templates por segmento

   Status: proximo passo.

   Criar pre-configuracoes para saude, advocacia, consultoria, contabilidade, arquitetura, coaching/terapia e outros segmentos.

8. Tornar o registro de atendimento configuravel

   Permitir campos livres ou estruturados conforme o segmento, como prontuario, processo, projeto, entrega, obrigacao ou evolucao.

9. Ampliar modelos de cobranca do financeiro

   Suportar cobranca por sessao, por hora, por projeto, mensalidade, pacote, exito ou outros formatos.

10. Preparar publicacao em producao

    Configurar hospedagem, dominio, SSL, variaveis seguras, backup do banco, monitoramento basico e rotina de deploy.

## Primeiro Passo

Comecar pelo passo 1: confirmar se o banco PostgreSQL ja existe e se o arquivo `.env` esta configurado corretamente.
