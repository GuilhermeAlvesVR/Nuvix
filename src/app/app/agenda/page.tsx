import { getWeekAgendaData } from "@/lib/app-cache";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";
import { AgendaGoogleView } from "@/components/agenda-google-view";

type SearchParams = Promise<{ created?: string; date?: string; view?: string; professionalId?: string; saved?: string; error?: string }>;

function parseDateParam(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(`${value}T00:00:00`);
  return isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : value;
}

function getWeekRange(dateStr: string): { start: string; end: string } {
  const date = new Date(`${dateStr}T12:00:00`);
  const day = date.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10)
  };
}

function getMonthRange(dateStr: string): { start: string; end: string } {
  const date = new Date(`${dateStr}T12:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(lastDay);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

export default async function AgendaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentUser = await requireCompanyUser();
  const labels = getWorkspaceLabels(currentUser.workspace);
  const canSchedule = currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST";
  const view = params.view || "week";
  const selectedDate = parseDateParam(params.date);
  const range = view === "month" ? getMonthRange(selectedDate) : getWeekRange(selectedDate);
  const professionalUserId = currentUser.role === "PROFESSIONAL" ? currentUser.id : undefined;

  const { appointments, professionals } = await getWeekAgendaData(currentUser.workspaceId, range.start, range.end, professionalUserId);

  return (
    <main className="agenda-page-shell">
      {params.created ? <div className="gc-toast success">{labels.appointment} agendado com sucesso.</div> : null}
      {params.saved ? <div className="gc-toast success">Status atualizado.</div> : null}
      {params.error ? <div className="gc-toast error">{params.error}</div> : null}

      <AgendaGoogleView
        initialDate={selectedDate}
        initialView={view}
        appointments={appointments.map((a) => ({
          id: a.id,
          startsAt: a.startsAt,
          endsAt: a.endsAt,
          patient: a.patient,
          professional: { id: a.professional.id, name: a.professional.name, userId: a.professional.userId },
          status: a.status,
        }))}
        professionals={professionals}
        canSchedule={canSchedule}
        labels={labels}
      />
    </main>
  );
}
