# Upload de logo e producao

Data: 2026-06-05

## Alteracoes

- Endurecida a validacao server-side do upload de logo do consultorio.
- Mantidos tipos aceitos: PNG, JPG e WebP.
- Mantido limite maximo de 2MB.
- Adicionada validacao de assinatura real do arquivo para PNG, JPG e WebP.
- Nome do arquivo agora usa `randomUUID`, timestamp e `workspaceId`, sem usar o nome original enviado pelo navegador.
- `public/uploads` foi adicionado ao `.gitignore` para evitar versionar arquivos enviados por clientes.
- Criado documento `docs/08-storage-uploads.md` explicando que `public/uploads` e apenas local/homologacao simples e que producao deve usar storage persistente externo.

## Validações

- `npm run lint`
- `npm run build`

## Arquivos alterados

- `.gitignore`
- `docs/08-storage-uploads.md`
- `src/app/app/configuracoes/actions.ts`
