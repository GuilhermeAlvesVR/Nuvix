import Image from "next/image";
import Link from "next/link";
import { login } from "./actions";

type SearchParams = Promise<{ error?: string }>;

const errorMessages: Record<string, string> = {
  invalid: "Email ou senha inválidos.",
  pending_approval: "Sua empresa ainda aguarda aprovação para acessar o sistema.",
  suspended: "O acesso da empresa está suspenso. Entre em contato com o suporte.",
  rejected: "O cadastro da empresa foi rejeitado. Entre em contato com o suporte."
};

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] ?? errorMessages.invalid : null;

  return (
    <main className="auth-shell nuvix-surface">
      <section className="auth-panel" aria-labelledby="login-title">
        <div>
          <Link className="nuvix-brand-link" href="/" aria-label="Voltar para a página inicial">
            <Image className="nuvix-logo" src="/brand/nuvix-logo.png" alt="Nuvix" width={140} height={45} priority />
          </Link>
          <span className="eyebrow">Acesso restrito</span>
          <h1 id="login-title">Entrar no sistema</h1>
          <p className="lead compact-lead">
            Use suas credenciais para acessar pacientes, agenda, atendimentos e financeiro da clínica.
          </p>
        </div>

        <form className="form-card" action={login} aria-label="Formulário de login">
          {errorMessage ? <div className="error-message">{errorMessage}</div> : null}

          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="voce@clinica.com" autoComplete="email" required />
          </div>

          <div className="field-group">
            <label htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" placeholder="Digite sua senha" autoComplete="current-password" required />
          </div>

          <button className="button primary full-width" type="submit">
            Entrar
          </button>

          <Link className="button secondary full-width" href="/cadastro">
            Cadastrar empresa
          </Link>

          <p className="form-note">Acesso permitido apenas para usuários ativos cadastrados no sistema.</p>
        </form>
      </section>
    </main>
  );
}
