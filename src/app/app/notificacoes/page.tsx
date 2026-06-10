import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { markAllRead, markAsRead } from "./actions";

type SearchParams = Promise<{ read?: string; error?: string }>;

const typeLabels = {
  APPOINTMENT_REMINDER: "Lembrete",
  APPOINTMENT_CANCELLED: "Cancelamento",
  PAYMENT_RECEIVED: "Pagamento",
  SYSTEM: "Sistema",
} as const;

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(value);
}

export default async function NotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireCompanyUser();
  const params = await searchParams;

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    where: { userId: user.id, workspaceId: user.workspaceId },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Notificações</span>
          <h1>Central de notificações</h1>
          <p>{unreadCount > 0 ? `${unreadCount} não lida(s)` : "Todas lidas"}</p>
        </div>
        <div className="page-actions">
          {unreadCount > 0 ? (
            <form action={markAllRead}>
              <button className="button secondary" type="submit">Marcar todas como lidas</button>
            </form>
          ) : null}
        </div>
      </section>

      {params.error ? <div className="error-message">{params.error}</div> : null}

      <section className="finance-list">
        {notifications.length > 0 ? (
          <div className="finance-table">
            {notifications.map((n) => (
              <div key={n.id} className={`finance-row ${n.readAt ? "" : "unread-row"}`}>
                <div className="finance-main-cell">
                  <strong>{n.title}</strong>
                  <span>{n.message} · {formatDateTime(n.createdAt)}</span>
                </div>
                <span className="badge scheduled">{typeLabels[n.type]}</span>
                <div className="compact-row-actions">
                  {n.link ? <Link className="button secondary" href={n.link}>Ver</Link> : null}
                  {!n.readAt ? (
                    <form action={markAsRead}>
                      <input type="hidden" name="notificationId" value={n.id} />
                      <button className="button secondary" type="submit">Lida</button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Nenhuma notificação</h2>
            <p>Você será notificado sobre lembretes de consulta, cancelamentos e pagamentos.</p>
          </div>
        )}
      </section>
    </main>
  );
}
