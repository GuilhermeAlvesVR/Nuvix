import type { CSSProperties } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { AppNavigation } from "./app-navigation";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const navigation = [
  { href: "/app", icon: "IN", label: "Início" },
  { href: "/app/pacientes", icon: "PA", label: "Pacientes" },
  { href: "/app/agenda", icon: "AG", label: "Agenda" },
  { href: "/app/financeiro", icon: "FI", label: "Financeiro" },
  { href: "/app/relatorios", icon: "RE", label: "Relatórios" },
  { href: "/app/configuracoes", icon: "CF", label: "Configurações" }
];

const roleLabels = {
  ADMIN: "Administrador",
  RECEPTIONIST: "Recepcionista",
  PROFESSIONAL: "Profissional"
} as const;

type TenantStyle = CSSProperties & {
  "--primary": string;
  "--primary-dark": string;
  "--accent": string;
  "--workspace-background": string;
  "--app-text": string;
  "--app-muted": string;
};

function isDarkColor(hexColor: string) {
  const hex = hexColor.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance < 0.55;
}

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCompanyUser();
  const workspace = user.workspace;
  const labels = getWorkspaceLabels(workspace);
  const navigationItems = navigation.map((item) => ({
    ...item,
    label: item.href === "/app/pacientes" ? labels.clientPlural : item.label
  })).filter((item) => user.role !== "PROFESSIONAL" || (item.href !== "/app/financeiro" && item.href !== "/app/relatorios"));
  const usesDarkBackground = isDarkColor(workspace.backgroundColor);
  const tenantStyle: TenantStyle = {
    "--primary": workspace.primaryColor,
    "--primary-dark": `color-mix(in srgb, ${workspace.primaryColor} 78%, black)`,
    "--accent": workspace.accentColor,
    "--workspace-background": workspace.backgroundColor,
    "--app-text": usesDarkBackground ? "#f5f5f5" : "#1a1a1a",
    "--app-muted": usesDarkBackground ? "rgba(245, 245, 245, 0.6)" : "#737373"
  };

  return (
    <div className="app-shell" style={tenantStyle}>
      <aside className="app-sidebar" aria-label="Navegação principal">
        <Link className="brand-mark logo-brand" href="/app">
          {workspace.logoUrl ? <span className="logo-image" style={{ backgroundImage: `url(${workspace.logoUrl})` }} /> : null}
          <span>{workspace.name}</span>
        </Link>
        <AppNavigation items={navigationItems} />

        <div className="sidebar-footer">
          <div>
            <strong>{user.name}</strong>
            <span>{roleLabels[user.role as keyof typeof roleLabels] ?? user.role}</span>
          </div>
          <form action={logout}>
            <button className="button secondary" type="submit">Sair</button>
          </form>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <p>{user.name} · {roleLabels[user.role as keyof typeof roleLabels] ?? user.role}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
