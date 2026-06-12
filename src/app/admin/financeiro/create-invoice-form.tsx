"use client";

import { useCallback, useState } from "react";
import { createInvoice } from "./actions";

type Workspace = { id: string; name: string; plan: string | null; billingDay: number | null; customMonthlyAmount: unknown };

function nextBillingDate(day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const targetDay = Math.min(day, lastDay);
  const candidate = new Date(year, month, targetDay);
  if (candidate <= now) {
    const nextLastDay = new Date(year, month + 2, 0).getDate();
    return `${year}-${String(month + 2).padStart(2, "0")}-${String(Math.min(day, nextLastDay)).padStart(2, "0")}`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

function formatDescription(dueDate: string): string {
  if (!dueDate) return "";
  const [y, m] = dueDate.split("-");
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `Mensalidade - ${months[parseInt(m, 10) - 1]}/${y}`;
}

export function CreateInvoiceForm({ workspaces }: { workspaces: Workspace[] }) {
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null);

  const handleWorkspaceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const ws = workspaces.find((w) => w.id === id) ?? null;
    setSelectedWs(ws);
  }, [workspaces]);

  const defaultDueDate = selectedWs?.billingDay ? nextBillingDate(selectedWs.billingDay) : "";
  const defaultAmount = selectedWs?.customMonthlyAmount ? String(selectedWs.customMonthlyAmount) : selectedWs?.plan === "PRO" ? "49.90" : selectedWs?.plan === "BASIC" ? "29.90" : "";
  const defaultDescription = defaultDueDate ? formatDescription(defaultDueDate) : "";

  return (
    <form action={createInvoice} aria-label="Criar fatura">
      <div className="form-card">
        <div className="field-grid two-columns">
          <div className="field-group">
            <label htmlFor="workspaceId">Empresa *</label>
            <select id="workspaceId" name="workspaceId" required onChange={handleWorkspaceChange}>
              <option value="">Selecione...</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.billingDay ? ` (dia ${w.billingDay})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="amount">Valor *</label>
            <input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0,00" required defaultValue={defaultAmount} key={`amt-${selectedWs?.id ?? "empty"}`} />
          </div>
          <div className="field-group">
            <label htmlFor="dueDate">Vencimento *</label>
            <input id="dueDate" name="dueDate" type="date" required defaultValue={defaultDueDate} key={`dd-${selectedWs?.id ?? "empty"}`} />
          </div>
          <div className="field-group wide-field">
            <label htmlFor="description">Descrição</label>
            <input id="description" name="description" type="text" placeholder="Mensalidade - Junho/2026" defaultValue={defaultDescription} key={`desc-${selectedWs?.id ?? "empty"}`} />
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: "12px" }}>
          <button className="button primary" type="submit">Criar fatura</button>
        </div>
      </div>
    </form>
  );
}
