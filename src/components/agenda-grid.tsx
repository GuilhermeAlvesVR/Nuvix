"use client";

import { useMemo } from "react";
import Link from "next/link";

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const statusColors: Record<string, string> = {
  SCHEDULED: "var(--primary)",
  CONFIRMED: "#2563eb",
  IN_PROGRESS: "#d97706",
  COMPLETED: "#16a34a",
  CANCELLED: "#9ca3af",
  NO_SHOW: "#dc2626",
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta",
};

type AppointmentItem = {
  id: string;
  startsAt: Date;
  durationMinutes: number;
  patient: { name: string };
  professional: { name: string; userId: string | null };
  status: string;
};

function parseTime(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function AgendaGrid({
  date,
  appointments,
  labels,
}: {
  date: string;
  appointments: AppointmentItem[];
  labels: { appointment: string; patient: string; professional: string };
}) {
  const blocks = useMemo(() => {
    return appointments.map((apt) => {
      const startMinutes = parseTime(new Date(apt.startsAt));
      const duration = apt.durationMinutes || 30;
      const top = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = (duration / 60) * HOUR_HEIGHT;
      return { ...apt, startMinutes, duration, top, height };
    });
  }, [appointments]);

  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  const nowMinutes = isToday ? parseTime(now) : -1;
  const nowTop = ((nowMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const showNowLine = isToday && nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;

  return (
    <div className="agenda-grid-shell">
      <header className="agenda-grid-header">
        <div className="agenda-nav">
          <Link className="button secondary" href={`/app/agenda?date=${yesterday(date)}`} aria-label="Dia anterior">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <Link className="button secondary" href={`/app/agenda?date=${tomorrow(date)}`} aria-label="Próximo dia">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
          <Link className="button primary" href={`/app/agenda?date=${todayStr()}`}>Hoje</Link>
        </div>
        <h2 className="agenda-date-title">{formatDateTitle(date)}</h2>
      </header>

      <div className="agenda-grid-scroll">
        <div className="agenda-grid" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
          <div className="agenda-time-column">
            {HOURS.map((h) => (
              <div key={h} className="agenda-hour-label" style={{ height: `${HOUR_HEIGHT}px` }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          <div className="agenda-grid-area">
            {HOURS.map((h) => (
              <div key={h} className="agenda-hour-row" style={{ height: `${HOUR_HEIGHT}px` }} />
            ))}
            {blocks.map((block) => {
              const minH = Math.max(block.height, 18);
              return (
                <Link
                  key={block.id}
                  href={`/app/agenda/${block.id}`}
                  className={`agenda-block status-${block.status.toLowerCase()}`}
                  style={{
                    top: `${block.top}px`,
                    height: `${minH}px`,
                    backgroundColor: statusColors[block.status] ?? "var(--primary)",
                  }}
                  title={`${block.patient.name} · ${block.professional.name} (${statusLabels[block.status] ?? block.status})`}
                >
                  <strong>{formatTime(block.startMinutes)}</strong>
                  <span>{block.patient.name}</span>
                  {minH > 40 ? <span className="agenda-block-muted">{block.professional.name}</span> : null}
                </Link>
              );
            })}
            {showNowLine ? (
              <div className="agenda-now-line" style={{ top: `${nowTop}px` }} aria-hidden>
                <div className="agenda-now-dot" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(d: string) {
  const date = new Date(`${d}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function tomorrow(d: string) {
  const date = new Date(`${d}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function formatDateTitle(d: string) {
  const date = new Date(`${d}T12:00:00`);
  if (isNaN(date.getTime())) return d;
  const today = new Date();
  const isToday = d === today.toISOString().slice(0, 10);
  const dayName = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
  const dayNum = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
  return `${dayName}, ${dayNum} de ${month}${isToday ? " (hoje)" : ""}`;
}
