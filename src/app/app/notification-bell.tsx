import Link from "next/link";
import { getUnreadCount, getNotifications } from "@/lib/notification";

export default async function NotificationBell({ userId, workspaceId }: { userId: string; workspaceId: string }) {
  const [unread, recent] = await Promise.all([
    getUnreadCount(userId, workspaceId),
    getNotifications(userId, workspaceId, 5),
  ]);

  return (
    <div className="notification-bell-wrapper">
      <Link className="notification-bell" href="/app/notificacoes" aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ""}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 ? <span className="notification-badge">{unread > 99 ? "99+" : unread}</span> : null}
      </Link>
      {recent.length > 0 ? (
        <div className="notification-dropdown">
          {recent.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? "/app/notificacoes"}
              className={`notification-dropdown-item ${n.readAt ? "" : "unread"}`}
            >
              <strong>{n.title}</strong>
              <span>{n.message}</span>
            </Link>
          ))}
          <Link className="notification-dropdown-all" href="/app/notificacoes">Ver todas</Link>
        </div>
      ) : null}
    </div>
  );
}
