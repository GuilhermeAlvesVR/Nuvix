import Image from "next/image";
import Link from "next/link";
import { registerWorkspace } from "./actions";
import { RegisterWorkspaceForm } from "./register-form";

type SearchParams = Promise<{ error?: string; success?: string }>;

export default async function RegisterWorkspacePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <main className="auth-shell register-shell nuvix-surface">
      <section className="auth-panel register-panel" aria-labelledby="register-title">
        <div>
          <Link className="nuvix-brand-link" href="/" aria-label="Voltar para a página inicial">
            <Image className="nuvix-logo" src="/brand/nuvix-logo.png" alt="Nuvix" width={150} height={48} priority />
          </Link>
          <span className="eyebrow">Cadastro de empresa</span>
          <h1 id="register-title">Solicite acesso ao Nuvix</h1>
          <p className="lead compact-lead">
            Cadastre a empresa e o primeiro administrador. O acesso ao sistema será liberado depois da aprovação da plataforma.
          </p>
        </div>

        <RegisterWorkspaceForm
          action={registerWorkspace}
          error={params.error}
          success={params.success}
        />
      </section>
    </main>
  );
}
