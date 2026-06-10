# Storage de uploads

## Contexto

O upload de logo do consultorio salva arquivos em `public/uploads/workspaces` no ambiente local.

Essa abordagem e suficiente para desenvolvimento e homologacao simples, mas nao deve ser considerada persistente em producao quando a aplicacao roda em ambiente serverless, container efemero ou multiplas instancias.

## Regra para producao

- Usar storage persistente externo para logos e outros arquivos enviados pelo cliente.
- Exemplos: S3, Cloudflare R2, Google Cloud Storage, Azure Blob Storage ou volume persistente gerenciado.
- Salvar no banco apenas a URL publica ou assinada do arquivo.
- Manter validacao server-side de tipo, tamanho e assinatura do arquivo antes de enviar ao storage.
- Nao versionar arquivos enviados por clientes no repositorio.

## Estado atual

- Tipos aceitos: PNG, JPG e WebP.
- Tamanho maximo: 2MB.
- Nome gerado pelo servidor, sem usar o nome original enviado pelo navegador.
- Assinatura do arquivo validada no servidor.
- Diretorio `public/uploads` ignorado pelo versionamento.
