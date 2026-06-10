import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

const actionLabels: Record<string, string> = {
  CREATE_PATIENT: "Criou paciente",
  UPDATE_PATIENT: "Atualizou paciente",
  ACTIVATE_PATIENT: "Ativou paciente",
  DEACTIVATE_PATIENT: "Desativou paciente",
  CREATE_APPOINTMENT: "Criou agendamento",
  UPDATE_APPOINTMENT_STATUS: "Atualizou status do agendamento",
  CREATE_CLINICAL_RECORD: "Criou registro clínico",
  UPDATE_CLINICAL_RECORD: "Atualizou registro clínico",
  CREATE_PAYMENT: "Criou pagamento",
  UPDATE_PAYMENT_STATUS: "Atualizou status do pagamento",
  CREATE_EXPENSE: "Criou despesa",
  UPDATE_EXPENSE_STATUS: "Atualizou status da despesa",
  CREATE_PATIENT_NOTE: "Criou anotação",
  ARCHIVE_PATIENT_NOTE: "Arquivou anotação",
  UPDATE_PATIENT_NOTE: "Atualizou anotação"
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

export default async function AuditLogPage() {
  const user = await requireCompanyUser();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      entityName: true,
      createdAt: true,
      user: { select: { name: true } }
    },
    take: 100,
    where: { workspaceId: user.workspaceId }
  });

  return (
    <main className="content-shell narrow-content">
      <section className="page-header">
        <div>
          <span className="eyebrow">Configurações</span>
          <h1>Registro de atividades</h1>
          <p>Histórico das ações realizadas no workspace.</p>
        </div>
        <Link className="button secondary" href="/app/configuracoes">Voltar</Link>
      </section>

      {logs.length === 0 ? (
        <section className="empty-state">
          <h2>Nenhum evento registrado</h2>
          <p>O histórico de atividades está vazio.</p>
        </section>
      ) : (
        <section className="finance-list" aria-label="Lista de eventos">
          <div className="finance-table compact-list-table">
            {logs.map((log) => (
              <div className="finance-row compact-list-row" key={log.id}>
                <div className="finance-main-cell">
                  <strong>{actionLabels[log.action] ?? log.action}</strong>
                  <span>{log.user?.name ?? "Sistema"} · {formatDate(log.createdAt)}</span>
                </div>
                <span className="badge scheduled">{log.entityName}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
