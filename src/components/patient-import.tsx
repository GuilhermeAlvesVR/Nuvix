"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";

type PreviewRow = Record<string, string>;

const FIELDS = [
  { key: "name", label: "Nome completo", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Telefone", required: false },
  { key: "document", label: "CPF / Documento", required: false },
  { key: "birthDate", label: "Data de nascimento", required: false },
  { key: "address", label: "Endereço", required: false },
  { key: "notes", label: "Observações", required: false },
];

type Props = {
  importAction: (data: FormData) => Promise<string>;
};

export function PatientImport({ importAction }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = Papa.parse<PreviewRow>(text, { header: true, skipEmptyLines: true });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        setError("Não foi possível ler o arquivo. Verifique se é um CSV válido.");
        return;
      }

      setHeaders(parsed.meta.fields ?? []);
      setRows(parsed.data.slice(0, 20));
      // auto-map
      const auto: Record<string, string> = {};
      for (const field of FIELDS) {
        const match = parsed.meta.fields?.find(
          (h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === field.key
            || h.toLowerCase().includes(field.key)
            || field.key.includes(h.toLowerCase())
        );
        if (match) auto[match] = field.key;
      }
      setMapping(auto);
    };
    reader.readAsText(file);
  }, []);

  const toggleField = useCallback((header: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (next[header]) {
        delete next[header];
      } else {
        const used = Object.values(next).filter(Boolean);
        const available = FIELDS.find((f) => !used.includes(f.key));
        if (available) next[header] = available.key;
      }
      return next;
    });
  }, []);

  const setFieldMapping = useCallback((header: string, fieldKey: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (fieldKey) {
        // remove any previous mapping to this field
        for (const [k, v] of Object.entries(next)) {
          if (v === fieldKey) delete next[k];
        }
        next[header] = fieldKey;
      } else {
        delete next[header];
      }
      return next;
    });
  }, []);

  const handleImport = useCallback(async () => {
    setImporting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("Selecione um arquivo.");
      setImporting(false);
      return;
    }

    const text = await file.text();
    formData.append("csv", text);
    formData.append("mapping", JSON.stringify(mapping));
    formData.append("fileName", file.name);

    const response = await importAction(formData);
    setResult(response);
    setImporting(false);
  }, [mapping, importAction]);

  const reset = useCallback(() => {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setError(null);
    setFileName("");
    if (fileInput.current) fileInput.current.value = "";
  }, []);

  const totalRows = 0;
  const isReady = headers.length > 0 && Object.values(mapping).filter(Boolean).length >= 1;

  if (result) {
    return (
      <section>
        <div className={`${result.startsWith("Erro") ? "error-message" : "success-message"}`}>{result}</div>
        <div className="form-actions" style={{ marginTop: "12px" }}>
          <button className="button primary" onClick={reset}>
            Importar outro arquivo
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="upload-zone">
        <input
          ref={fileInput}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFile}
          style={{ display: "none" }}
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="upload-label">
          {fileName ? (
            <span>{fileName}</span>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Clique para selecionar um arquivo CSV</span>
              <span className="upload-hint">Colunas separadas por vírgula, primeira linha com cabeçalhos</span>
            </>
          )}
        </label>
      </div>

      {error ? <div className="error-message">{error}</div> : null}

      {headers.length > 0 ? (
        <>
          <section className="form-card" style={{ marginTop: "14px" }}>
            <h2 style={{ marginBottom: "8px" }}>Mapear colunas</h2>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "12px" }}>
              Associe cada coluna do arquivo ao campo correspondente no sistema. Apenas nome é obrigatório.
            </p>

            <div className="import-mapping-grid">
              {headers.map((header) => (
                <div key={header} className="import-mapping-row">
                  <span className="import-mapping-header">{header}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  <select
                    className="import-mapping-select"
                    value={mapping[header] || ""}
                    onChange={(e) => setFieldMapping(header, e.target.value)}
                  >
                    <option value="">— Ignorar coluna —</option>
                    {FIELDS.map((f) => {
                      const alreadyMapped = Object.entries(mapping).some(([k, v]) => v === f.key && k !== header);
                      return (
                        <option key={f.key} value={f.key} disabled={alreadyMapped}>
                          {f.label}{f.required ? " *" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="form-card" style={{ marginTop: "10px" }}>
            <div className="import-preview-header">
              <h2>Pré-visualização</h2>
              <span className="import-row-count">{rows.length} linhas</span>
            </div>
            <div className="import-preview-table-wrapper">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td className="import-row-num">{i + 1}</td>
                      {headers.map((h) => (
                        <td key={h}>{row[h] || ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="form-actions" style={{ marginTop: "12px" }}>
            <button className="button primary" onClick={handleImport} disabled={!isReady || importing}>
              {importing ? "Importando..." : "Importar pacientes"}
            </button>
            <button className="button secondary" onClick={reset}>
              Cancelar
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
