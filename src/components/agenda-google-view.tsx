"use client";

import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CalendarEvent = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  patient: { name: string };
  professional: { id: string; name: string; userId: string | null };
  status: string;
};

type Props = {
  initialDate: string;
  initialView: string;
  appointments: CalendarEvent[];
  professionals: { id: string; name: string; specialty: string | null }[];
  canSchedule: boolean;
  labels: Record<string, string>;
};

const HOUR_HEIGHT = 48;
const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SCROLL_START_HOUR = 6;

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_NAMES_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta",
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthDays(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < adjustedFirst; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function formatWeekTitle(monday: Date, sunday: Date): string {
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const sm = months[monday.getMonth()];
  const sMon = monday.getDate();
  const sSun = sunday.getDate();
  const sSunM = months[sunday.getMonth()];
  const year = sunday.getFullYear();
  if (monday.getMonth() === sunday.getMonth()) {
    return `${sMon} de ${sm} – ${sSun} de ${sm}, ${year}`;
  }
  return `${sMon} de ${sm} – ${sSun} de ${sSunM}, ${year}`;
}

function formatDayTitle(date: Date): string {
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return `${DAY_NAMES_FULL[dayIdx]}, ${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function formatMonthTitle(year: number, month: number): string {
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${months[month]} de ${year}`;
}

function getMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function MiniCalendar({
  currentDate,
  selectedDate,
  onSelectDate,
  selectedWeekDays,
}: {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  selectedWeekDays: Set<string>;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weeks = useMemo(() => getMonthDays(year, month), [year, month]);
  const todayStr = toDateStr(new Date());
  const selectedStr = toDateStr(selectedDate);

  return (
    <div className="gc-minical">
      <div className="gc-minical-header">
        <button
          className="gc-minical-nav"
          onClick={() => onSelectDate(new Date(year, month - 1, 1))}
          aria-label="Mês anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="gc-minical-title">{formatMonthTitle(year, month)}</span>
        <button
          className="gc-minical-nav"
          onClick={() => onSelectDate(new Date(year, month + 1, 1))}
          aria-label="Próximo mês"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
      <div className="gc-minical-weekdays">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <div key={i} className="gc-minical-wd">{d}</div>
        ))}
      </div>
      <div className="gc-minical-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="gc-minical-week">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="gc-minical-day empty" />;
              const dateObj = new Date(year, month, day);
              const dateStr = toDateStr(dateObj);
              const isToday = dateStr === todayStr;
              const inWeek = selectedWeekDays.has(dateStr);
              const isSel = dateStr === selectedStr;
              return (
                <button
                  key={di}
                  className={`gc-minical-day${isToday ? " today" : ""}${inWeek ? " in-week" : ""}${isSel ? " selected" : ""}`}
                  onClick={() => onSelectDate(dateObj)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgendaGoogleView({
  initialDate,
  initialView,
  appointments,
  professionals,
  canSchedule,
  labels,
}: Props) {
  const router = useRouter();
  const [selectedProfs, setSelectedProfs] = useState<Set<string> | null>(null);

  const viewMode = initialView;
  const parsedDate = useMemo(() => new Date(`${initialDate}T12:00:00`), [initialDate]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = SCROLL_START_HOUR * HOUR_HEIGHT;
    }
  }, [initialDate, initialView]);

  const navigate = useCallback(
    (dateStr: string, view?: string) => {
      const v = view || viewMode;
      const params = new URLSearchParams();
      params.set("date", dateStr);
      if (v !== "week") params.set("view", v);
      router.push(`/app/agenda?${params.toString()}`);
    },
    [router, viewMode]
  );

  const monday = useMemo(() => getMonday(parsedDate), [parsedDate]);
  const sunday = useMemo(() => addDays(monday, 6), [monday]);

  const displayDays = useMemo(() => {
    if (viewMode === "day") {
      const dayIdx = parsedDate.getDay() === 0 ? 6 : parsedDate.getDay() - 1;
      return [{ name: DAY_NAMES[dayIdx], date: parsedDate, dateStr: toDateStr(parsedDate) }];
    }
    return DAY_NAMES.map((name, i) => {
      const date = addDays(monday, i);
      return { name, date, dateStr: toDateStr(date) };
    });
  }, [viewMode, parsedDate, monday]);

  const selectedWeekDays = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < 7; i++) set.add(toDateStr(addDays(monday, i)));
    return set;
  }, [monday]);

  const miniMonth = useMemo(
    () => new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1),
    [parsedDate]
  );

  const today = new Date();
  const todayStr = toDateStr(today);

  const nowMinutes = getMinutesSinceMidnight(today);
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const apt of appointments) {
      if (selectedProfs !== null && !selectedProfs.has(apt.professional.id)) continue;
      const key = toDateStr(new Date(apt.startsAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(apt);
    }
    return map;
  }, [appointments, selectedProfs]);

  const toggleProfessional = useCallback((id: string) => {
    setSelectedProfs((prev) => {
      if (prev === null) {
        const all = new Set(appointments.map((a) => a.professional.id));
        all.delete(id);
        return all.size === professionals.length - 1 ? null : all;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next.size === professionals.length ? null : next;
    });
  }, [appointments, professionals]);

  const monthTitle = useMemo(
    () => formatMonthTitle(parsedDate.getFullYear(), parsedDate.getMonth()),
    [parsedDate]
  );

  const monthWeeks = useMemo(
    () => getMonthDays(parsedDate.getFullYear(), parsedDate.getMonth()),
    [parsedDate]
  );

  const handleToday = useCallback(() => {
    navigate(toDateStr(new Date()));
  }, [navigate]);

  const handlePrev = useCallback(() => {
    if (viewMode === "day") {
      const prev = addDays(parsedDate, -1);
      navigate(toDateStr(prev));
    } else if (viewMode === "month") {
      const prev = new Date(parsedDate.getFullYear(), parsedDate.getMonth() - 1, 1);
      navigate(toDateStr(prev), "month");
    } else {
      const prev = addDays(monday, -7);
      navigate(toDateStr(prev));
    }
  }, [viewMode, parsedDate, monday, navigate]);

  const handleNext = useCallback(() => {
    if (viewMode === "day") {
      const next = addDays(parsedDate, 1);
      navigate(toDateStr(next));
    } else if (viewMode === "month") {
      const next = new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 1);
      navigate(toDateStr(next), "month");
    } else {
      const next = addDays(monday, 7);
      navigate(toDateStr(next));
    }
  }, [viewMode, parsedDate, monday, navigate]);

  const handleSelectDate = useCallback(
    (date: Date) => {
      navigate(toDateStr(date), "day");
    },
    [navigate]
  );

  const handleViewChange = useCallback(
    (view: string) => {
      navigate(toDateStr(parsedDate), view);
    },
    [navigate, parsedDate]
  );

  const timeLabels = useMemo(
    () => Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i),
    []
  );

  const weekTitle = formatWeekTitle(monday, sunday);

  const nowLine = (
    <div className="gc-now-line" style={{ top: `${nowTop}px` }} aria-hidden>
      <div className="gc-now-dot" />
    </div>
  );

  return (
    <div className="gc-layout">
      <aside className="gc-sidebar">
        {canSchedule ? (
          <Link
            className="gc-create-btn"
            href={`/app/agenda/novo?date=${toDateStr(parsedDate)}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo agendamento
          </Link>
        ) : null}

        <MiniCalendar
          currentDate={miniMonth}
          selectedDate={parsedDate}
          onSelectDate={handleSelectDate}
          selectedWeekDays={selectedWeekDays}
        />

        {professionals.length > 0 ? (
          <div className="gc-proffilter">
            <div className="gc-proffilter-title">Profissionais</div>
            {professionals.map((prof) => {
              const active = selectedProfs === null || selectedProfs.has(prof.id);
              return (
                <button
                  key={prof.id}
                  className={`gc-proffilter-item${active ? " active" : ""}`}
                  onClick={() => toggleProfessional(prof.id)}
                >
                  <span className="gc-proffilter-dot" style={{ background: "var(--primary)" }} />
                  <span className="gc-proffilter-name">{prof.name}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </aside>

      <div className="gc-main">
        <div className="gc-toolbar">
          <div className="gc-toolbar-left">
            <button className="gc-btn gc-btn-primary" onClick={handleToday}>
              Hoje
            </button>
            <div className="gc-nav-group">
              <button className="gc-btn gc-btn-icon" onClick={handlePrev} aria-label="Anterior">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button className="gc-btn gc-btn-icon" onClick={handleNext} aria-label="Próximo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
            <h2 className="gc-title">{viewMode === "day" ? formatDayTitle(parsedDate) : viewMode === "month" ? monthTitle : weekTitle}</h2>
          </div>
          <div className="gc-view-switcher">
            <button
              className={`gc-view-btn${viewMode === "day" ? " active" : ""}`}
              onClick={() => handleViewChange("day")}
            >
              Dia
            </button>
            <button
              className={`gc-view-btn${viewMode === "week" ? " active" : ""}`}
              onClick={() => handleViewChange("week")}
            >
              Semana
            </button>
            <button
              className={`gc-view-btn${viewMode === "month" ? " active" : ""}`}
              onClick={() => handleViewChange("month")}
            >
              Mês
            </button>
          </div>
        </div>

        {viewMode === "month" ? (
          <div className="gc-monthgrid">
            <div className="gc-monthgrid-header">
              {DAY_NAMES.map((name) => (
                <div key={name} className="gc-monthgrid-header-day">{name}</div>
              ))}
            </div>
            <div className="gc-monthgrid-body">
              {monthWeeks.map((week, wi) => (
                <div key={wi} className="gc-monthgrid-week">
                  {week.map((day, di) => {
                    if (day === null) return <div key={di} className="gc-monthgrid-cell empty" />;
                    const dateObj = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), day);
                    const dateStr = toDateStr(dateObj);
                    const isToday = dateStr === todayStr;
                    const dayEvents = eventsByDay.get(dateStr) || [];
                    return (
                      <button
                        key={di}
                        className={`gc-monthgrid-cell${isToday ? " today" : ""}`}
                        onClick={() => navigate(dateStr, "day")}
                      >
                        <span className={`gc-monthgrid-daynum${isToday ? " today-badge" : ""}`}>{day}</span>
                        {dayEvents.length > 0 ? (
                          <div className="gc-monthgrid-events">
                            <div className="gc-monthgrid-more">{dayEvents.length} {labels.appointment?.toLowerCase() || "agenda"}</div>
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="gc-weekgrid">
          <div className="gc-weekgrid-header">
            <div className="gc-weekgrid-gutter" />
            {displayDays.map((day) => {
              const isToday = day.dateStr === todayStr;
              return (
                <div key={day.dateStr} className={`gc-weekgrid-header-day${isToday ? " today" : ""}`}>
                  <span className="gc-weekgrid-header-day-name">{day.name}</span>
                  <span className={`gc-weekgrid-header-day-num${isToday ? " today-badge" : ""}`}>
                    {day.date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="gc-weekgrid-body" ref={scrollRef}>
            <div className="gc-weekgrid-scroll" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
              <div className="gc-weekgrid-time-col">
                {timeLabels.map((h) => (
                  <div key={h} className="gc-hour-label" style={{ height: `${HOUR_HEIGHT}px` }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {displayDays.map((day) => {
                const isToday = day.dateStr === todayStr;
                const dayEvents = eventsByDay.get(day.dateStr) || [];

                return (
                  <div key={day.dateStr} className={`gc-day-column${isToday ? " today" : ""}`}>
                    {timeLabels.map((h) => (
                      <div key={h} className="gc-hour-row" style={{ height: `${HOUR_HEIGHT}px` }} />
                    ))}

                    {dayEvents.map((event) => {
                      const evStart = new Date(event.startsAt);
                      const evEnd = new Date(event.endsAt);
                      const startMin = getMinutesSinceMidnight(evStart);
                      const endMin = getMinutesSinceMidnight(evEnd);
                      const duration = Math.max(endMin - startMin, 15);
                      const top = (startMin / 60) * HOUR_HEIGHT;
                      const height = (duration / 60) * HOUR_HEIGHT;
                      const showDetails = height >= 28;

                      return (
                        <Link
                          key={event.id}
                          href={`/app/agenda/${event.id}`}
                          className="gc-event"
                          style={{ top: `${top}px`, height: `${Math.max(height, 18)}px` }}
                          title={`${event.patient.name} · ${event.professional.name} (${statusLabels[event.status] || event.status})`}
                        >
                          <div className="gc-event-row">
                            <span className="gc-event-time">
                              {evStart.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="gc-event-title">{event.patient.name}</span>
                          </div>
                          {showDetails ? (
                            <div className="gc-event-meta">{event.professional.name}</div>
                          ) : null}
                          {showDetails && height >= 40 ? (
                            <div className="gc-event-meta">{labels.appointment} {statusLabels[event.status]?.toLowerCase() || event.status.toLowerCase()}</div>
                          ) : null}
                        </Link>
                      );
                    })}

                    {isToday ? nowLine : null}
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
