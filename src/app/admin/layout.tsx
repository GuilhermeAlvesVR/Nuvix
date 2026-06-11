import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { requirePlatformAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin", label: "Empresas", icon: "⏹" },
  { href: "/admin/financeiro", label: "Financeiro", icon: "💰" }
];

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requirePlatformAdmin();

  return (
    <div className="app-shell admin-shell">
      <aside className="app-sidebar">
        <Link className="brand-mark logo-brand" href="/admin">
          <Image className="nuvix-logo" src="/brand/nuvix-logo.png" alt="Nuvix" width={120} height={38} priority />
        </Link>
        <nav className="app-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>
            <strong>{user.name}</strong>
            <span>Admin</span>
          </div>
          <form action={logout}>
            <button className="button secondary" type="submit">Sair</button>
          </form>
        </div>
      </aside>
      <div className="app-main">
        {children}
      </div>
    </div>
  );
}
