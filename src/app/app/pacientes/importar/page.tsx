import Link from "next/link";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";
import { PatientImport } from "@/components/patient-import";
import { importPatients } from "./actions";

export default async function PatientImportPage() {
  const user = await requireCompanyUser();
  const labels = getWorkspaceLabels(user.workspace);

  return (
    <main className="content-shell narrow-content">
      <section className="page-header">
        <div>
          <span className="eyebrow">{labels.clientPlural}</span>
          <h1>Importar {labels.clientSingular.toLowerCase()}s</h1>
          <p>Faça upload de um arquivo CSV com os dados dos {labels.clientSingular.toLowerCase()}s. A primeira linha deve conter os nomes das colunas.</p>
        </div>
        <Link className="button secondary" href="/app/pacientes">
          Voltar
        </Link>
      </section>

      <PatientImport importAction={importPatients} />
    </main>
  );
}
