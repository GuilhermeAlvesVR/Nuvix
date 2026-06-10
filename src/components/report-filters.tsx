"use client";

import { useCallback, useRef } from "react";
import { ExportCSVButton } from "./export-csv-button";

type Props = {
  from: string;
  to: string;
  selectedProfessionalId: string;
  selectedStatus: string;
  professionals: { id: string; name: string }[];
  statusOptions: readonly string[];
  statusLabels: Record<string, string>;
  exportAppointments: (data: FormData) => Promise<string>;
  exportPayments: (data: FormData) => Promise<string>;
  exportExpenses: (data: FormData) => Promise<string>;
  exportSummary: (data: FormData) => Promise<string>;
};

export function ReportFilters({
  from, to, selectedProfessionalId, selectedStatus,
  professionals, statusOptions, statusLabels,
  exportAppointments, exportPayments, exportExpenses, exportSummary,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const getFormData = useCallback(() => {
    return new FormData(formRef.current ?? undefined);
  }, []);

  return (
    <>
      <form ref={formRef} className="filter-card" action="/app/relatorios" aria-label="Filtrar relatórios por período">
        <div className="field-grid compact-filter-grid">
          <div className="field-group">
            <label htmlFor="from">De</label>
            <input id="from" name="from" type="date" defaultValue={from} />
          </div>
          <div className="field-group">
            <label htmlFor="to">Até</label>
            <input id="to" name="to" type="date" defaultValue={to} />
          </div>
          <div className="field-group">
            <label htmlFor="professionalId">Profissional</label>
            <select id="professionalId" name="professionalId" defaultValue={selectedProfessionalId}>
              <option value="">Todos</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={selectedStatus}>
              <option value="">Todos</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>
          <div className="filter-actions" style={{ flexWrap: "wrap", gap: "6px" }}>
            <button className="button primary" type="submit">Filtrar</button>
            <a className="button secondary" href="/app/relatorios">Mês atual</a>
            <ExportCSVButton label="Exportar atendimentos" exportAction={exportAppointments} filename="atendimentos" getFormData={getFormData} />
            <ExportCSVButton label="Exportar pagamentos" exportAction={exportPayments} filename="pagamentos" getFormData={getFormData} />
            <ExportCSVButton label="Exportar despesas" exportAction={exportExpenses} filename="despesas" getFormData={getFormData} />
            <ExportCSVButton label="Exportar resumo financeiro" exportAction={exportSummary} filename="resumo-financeiro" getFormData={getFormData} />
          </div>
        </div>
      </form>
    </>
  );
}
