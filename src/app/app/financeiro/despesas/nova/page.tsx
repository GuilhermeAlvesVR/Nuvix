import Link from "next/link";
import { requireCompanyUser } from "@/lib/session";
import { createExpense } from "../../actions";

type SearchParams = Promise<{ error?: string }>;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewExpensePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentUser = await requireCompanyUser();

  if (currentUser.role !== "ADMIN") {
    return (
      <main className="content-shell narrow-content">
        <section className="empty-state full-page-state">
          <span className="eyebrow">Financeiro</span>
          <h1>Acesso restrito</h1>
          <p>Apenas administradores podem registrar despesas.</p>
          <Link className="button primary" href="/app/financeiro">
            Voltar ao financeiro
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="content-shell narrow-content">
      <section className="page-header">
        <div>
          <span className="eyebrow">Financeiro</span>
          <h1>Nova despesa</h1>
          <p>Registre gastos do consultório para acompanhar o saldo confirmado.</p>
        </div>
      </section>

      {params.error ? <div className="error-message">{params.error}</div> : null}

      <form className="form-card large-form finance-form" action={createExpense} aria-label="Registrar despesa">
        <div className="field-grid two-columns">
          <div className="field-group wide-field">
            <label htmlFor="description">Descrição *</label>
            <input id="description" name="description" type="text" placeholder="Ex.: Aluguel, material, software" required />
          </div>

          <div className="field-group">
            <label htmlFor="category">Categoria *</label>
            <input id="category" name="category" type="text" placeholder="Ex.: Estrutura, insumos, marketing" required />
          </div>

          <div className="field-group">
            <label htmlFor="expenseAmount">Valor *</label>
            <input id="expenseAmount" name="amount" type="number" min="0.01" step="0.01" placeholder="300,00" required />
          </div>

          <div className="field-group">
            <label htmlFor="expenseStatus">Status *</label>
            <select id="expenseStatus" name="status" defaultValue="CONFIRMED" required>
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="expenseDate">Data *</label>
            <input id="expenseDate" name="expenseDate" type="date" defaultValue={todayInputValue()} required />
          </div>

          <div className="field-group wide-field">
            <label htmlFor="expenseNotes">Observações</label>
            <textarea id="expenseNotes" name="expenseNotes" rows={3} placeholder="Comprovante, fornecedor ou observação administrativa." />
          </div>
        </div>

        <div className="form-actions">
          <Link className="button secondary" href="/app/financeiro">
            Cancelar
          </Link>
          <button className="button primary" type="submit">
            Registrar despesa
          </button>
        </div>
      </form>
    </main>
  );
}
