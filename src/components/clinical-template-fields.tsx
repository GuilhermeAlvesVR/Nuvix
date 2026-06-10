"use client";

import { useMemo } from "react";

type Field = {
  id: string;
  label: string;
  key: string;
  fieldType: string;
  required: boolean;
  order: number;
  options: string | null;
  placeholder: string | null;
};

type Props = {
  templates: { id: string; name: string; segment: string; fields: Field[] }[];
  initialTemplateId?: string | null;
  initialData?: Record<string, string> | null;
};

export function ClinicalTemplateFields({ templates, initialTemplateId, initialData }: Props) {
  const initialFields = useMemo(() => {
    const tmpl = templates.find((t) => t.id === initialTemplateId);
    return tmpl?.fields ?? [];
  }, [templates, initialTemplateId]);

  const segmentTemplates = useMemo(() => {
    const seg = initialTemplateId ? (templates.find((t) => t.id === initialTemplateId)?.segment ?? "") : "";
    return seg ? templates.filter((t) => t.segment === seg) : templates;
  }, [templates, initialTemplateId]);

  return (
    <>
      {templates.length > 0 ? (
        <div className="field-group">
          <label htmlFor="templateId">Modelo de registro</label>
          <select id="templateId" name="templateId" defaultValue={initialTemplateId ?? ""}>
            <option value="">Sem modelo (campos livres)</option>
            {segmentTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      ) : null}
      {initialFields.length > 0 ? (
        <div className="clinical-template-data">
          {initialFields
            .sort((a, b) => a.order - b.order)
            .map((field) => {
              const fieldName = `field_${field.key}`;
              const currentValue = initialData?.[field.key] ?? "";

              if (field.fieldType === "TEXTAREA") {
                return (
                  <div key={field.id} className="field-group wide-field clinical-template-field">
                    <label htmlFor={fieldName}>{field.label}{field.required ? " *" : ""}</label>
                    <textarea id={fieldName} name={fieldName} rows={4} defaultValue={currentValue} placeholder={field.placeholder ?? ""} />
                  </div>
                );
              }

              if (field.fieldType === "SELECT" && field.options) {
                let options: string[] = [];
                try { options = JSON.parse(field.options); } catch { options = []; }
                return (
                  <div key={field.id} className="field-group clinical-template-field">
                    <label htmlFor={fieldName}>{field.label}{field.required ? " *" : ""}</label>
                    <select id={fieldName} name={fieldName} defaultValue={currentValue}>
                      <option value="">Selecione...</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.fieldType === "NUMBER") {
                return (
                  <div key={field.id} className="field-group clinical-template-field">
                    <label htmlFor={fieldName}>{field.label}{field.required ? " *" : ""}</label>
                    <input id={fieldName} name={fieldName} type="number" defaultValue={currentValue} placeholder={field.placeholder ?? ""} />
                  </div>
                );
              }

              if (field.fieldType === "DATE") {
                return (
                  <div key={field.id} className="field-group clinical-template-field">
                    <label htmlFor={fieldName}>{field.label}{field.required ? " *" : ""}</label>
                    <input id={fieldName} name={fieldName} type="date" defaultValue={currentValue} />
                  </div>
                );
              }

              return (
                <div key={field.id} className="field-group clinical-template-field">
                  <label htmlFor={fieldName}>{field.label}{field.required ? " *" : ""}</label>
                  <input id={fieldName} name={fieldName} type="text" defaultValue={currentValue} placeholder={field.placeholder ?? ""} />
                </div>
              );
            })}
        </div>
      ) : null}
    </>
  );
}
