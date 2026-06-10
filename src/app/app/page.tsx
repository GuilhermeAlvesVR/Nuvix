import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

const shortcuts = [
  { href: "/app/pacientes", title: "Buscar", description: "Nome, telefone, email ou documento" },
  { href: "/app/pacientes/novo", title: "Novo cadastro", description: "Contato e dados básicos" },
  { href: "/app/agenda", title: "Abrir agenda", description: "Horários e status do dia" }
];

const appointmentStatusLabels = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta"
} as const;

function formatTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
}

async function getDashboardData(workspaceId: string) {
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return unstable_cache(
    async () => {
      const [appointmentsToday, pendingAppointments, recentPatients, totals, latestInvoice] = await Promise.all([
        prisma.appointment.findMany({
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            startsAt: true,
            status: true,
            patient: { select: { name: true, phone: true } },
            professional: { select: { name: true } }
          },
          where: {
            workspaceId,
            startsAt: { gte: dayStart, lte: dayEnd },
            status: { not: "CANCELLED" }
          },
          take: 6
        }),
        prisma.appointment.findMany({
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            startsAt: true,
            price: true,
            financialStatus: true,
            patient: { select: { name: true } }
          },
          where: {
            workspaceId,
            financialStatus: { in: ["PENDING", "PARTIAL"] },
            status: { not: "CANCELLED" }
          },
          take: 5
        }),
        prisma.patient.findMany({
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, phone: true, email: true, active: true },
          where: { workspaceId },
          take: 5
        }),
        Promise.all([
          prisma.appointment.count({ where: { workspaceId, startsAt: { gte: dayStart, lte: dayEnd }, status: { not: "CANCELLED" } } }),
          prisma.appointment.count({ where: { workspaceId, financialStatus: { in: ["PENDING", "PARTIAL"] }, status: { not: "CANCELLED" } } }),
          prisma.patient.count({ where: { workspaceId, active: true } })
        ]),
        prisma.platformInvoice.findFirst({
          orderBy: { dueDate: "desc" },
          select: { id: true, amount: true, status: true, dueDate: true, description: true },
          where: { workspaceId }
        })
      ]);
      return { appointmentsToday, pendingAppointments, recentPatients, totals, latestInvoice } as const;
    },
    ["dashboard", workspaceId, dayStart.toISOString().slice(0, 10)],
    { revalidate: 30, tags: [`dashboard-${workspaceId}`] }
  )();
}

function formatInputDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export default async function AppHomePage() {
  const user = await requireCompanyUser();
  const workspace = user.workspace;
  const labels = getWorkspaceLabels(workspace);
  const { appointmentsToday, pendingAppointments, recentPatients, totals, latestInvoice } = await getDashboardData(user.workspaceId);
  const [appointmentsTodayCount, pendingPaymentsCount, activePatientsCount] = totals;

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <h1>Resumo de hoje</h1>
          <p>Agenda, pendências financeiras e cadastros recentes em uma visão rápida.</p>
        </div>
        <Link className="button primary" href="/app/pacientes/novo">
          Novo {labels.clientSingular.toLowerCase()}
        </Link>
      </section>

      <section className="dashboard-metrics" aria-label="Indicadores principais">
        <article className="metric">
          <strong>{appointmentsTodayCount}</strong>
          <span>Atendimentos hoje</span>
        </article>
        <article className="metric">
          <strong>{pendingPaymentsCount}</strong>
          <span>Pagamentos pendentes</span>
        </article>
        <article className="metric">
          <strong>{activePatientsCount}</strong>
          <span>{labels.clientPlural} ativos</span>
        </article>
      </section>

      <section className="dashboard-invoice-widget" aria-label="Status da fatura">
        {latestInvoice && latestInvoice.status !== "PAID" ? (
          <div className="invoice-status-widget">
            <span className={`badge ${latestInvoice.status === "OVERDUE" ? "cancelled" : "pending"}`}>
              {latestInvoice.status === "OVERDUE" ? "Atrasado" : "Pendente"}
            </span>
            <div>
              <div className="amount">{formatMoney(Number(latestInvoice.amount))}</div>
              <div className="muted-text">{latestInvoice.description ?? "Mensalidade"} · Vence {formatDate(latestInvoice.dueDate)}</div>
            </div>
            <form action="/app/configuracoes/faturas/actions/checkout" method="POST">
              <input type="hidden" name="amount" value={Number(latestInvoice.amount)} />
              <input type="hidden" name="invoiceId" value={latestInvoice.id} />
              <button className="button primary" type="submit">Pagar via PIX</button>
            </form>
          </div>
        ) : (
          <div className="invoice-status-widget status-ok">
            <span className="badge confirmed">Em dia</span>
            <strong>Faturamento</strong>
            <span className="muted-text">Todas as faturas pagas</span>
            <Link className="button secondary" href="/app/configuracoes/faturas">Histórico</Link>
          </div>
        )}
      </section>

      <section className="dashboard-grid" aria-label="Resumo operacional">
        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Agenda de hoje</h2>
            <Link href="/app/agenda">Ver agenda</Link>
          </div>
          {appointmentsToday.length > 0 ? (
            <div className="dashboard-list">
              {appointmentsToday.map((appointment) => (
                <Link className="dashboard-list-item" href={`/app/agenda?date=${formatInputDate(appointment.startsAt)}`} key={appointment.id}>
                  <strong>{formatTime(appointment.startsAt)} - {appointment.patient.name}</strong>
                  <span>{appointmentStatusLabels[appointment.status]}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Nenhuma consulta agendada para hoje.</p>
          )}
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Pagamentos pendentes</h2>
            <Link href="/app/financeiro">Ver financeiro</Link>
          </div>
          {pendingAppointments.length > 0 ? (
            <div className="dashboard-list">
              {pendingAppointments.map((appointment) => (
                <Link className="dashboard-list-item" href="/app/financeiro" key={appointment.id}>
                  <strong>{appointment.patient.name}</strong>
                  <span>{formatMoney(appointment.price)} · {appointment.financialStatus === "PARTIAL" ? "Parcial" : "Pendente"}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Nenhuma pendência financeira em aberto.</p>
          )}
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>{labels.clientPlural} recentes</h2>
            <Link href="/app/pacientes">Buscar</Link>
          </div>
          {recentPatients.length > 0 ? (
            <div className="dashboard-list">
              {recentPatients.map((patient) => (
                <Link className="dashboard-list-item" href={`/app/pacientes?q=${encodeURIComponent(patient.name)}`} key={patient.id}>
                  <strong>{patient.name}</strong>
                  <span>{patient.active ? "Ativo" : "Inativo"}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Nenhum cadastro encontrado.</p>
          )}
        </article>
      </section>

      <section className="dashboard-shortcuts" aria-label="Atalhos principais">
        {shortcuts.map((shortcut) => (
          <Link className="button secondary dashboard-shortcut-btn" href={shortcut.href} key={shortcut.href}>
            {shortcut.href.includes("pacientes") ? `${shortcut.title} ${labels.clientSingular.toLowerCase()}` : shortcut.title}
          </Link>
        ))}
      </section>
    </main>
  );
}
