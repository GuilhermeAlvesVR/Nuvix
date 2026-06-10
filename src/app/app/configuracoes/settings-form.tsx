"use client";

import { useState } from "react";
import { ColorPreview } from "../../cadastro/color-preview";
import { getDefaultWorkspaceLabels, workspaceTypeOptions } from "@/lib/workspace";
import { WorkspaceType } from "@prisma/client";

type WorkspaceLabels = {
  clientSingular: string;
  clientPlural: string;
  professional: string;
  appointment: string;
  record: string;
};

type WorkspaceSettingsFormProps = {
  workspace: {
    name: string;
    type: WorkspaceType;
    logoUrl: string | null;
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    clientLabelSingular: string | null;
    clientLabelPlural: string | null;
    professionalLabel: string | null;
    appointmentLabel: string | null;
    recordLabel: string | null;
  };
  currentLabels: WorkspaceLabels;
  updateAction: (formData: FormData) => void;
};

export function WorkspaceSettingsForm({ workspace, updateAction }: WorkspaceSettingsFormProps) {
  const [type, setType] = useState<WorkspaceType>(workspace.type);

  const currentDefaults = getDefaultWorkspaceLabels(type);

  const [clientLabelSingular, setClientLabelSingular] = useState(workspace.clientLabelSingular ?? "");
  const [clientLabelPlural, setClientLabelPlural] = useState(workspace.clientLabelPlural ?? "");
  const [professionalLabel, setProfessionalLabel] = useState(workspace.professionalLabel ?? "");
  const [appointmentLabel, setAppointmentLabel] = useState(workspace.appointmentLabel ?? "");
  const [recordLabel, setRecordLabel] = useState(workspace.recordLabel ?? "");
  const [primaryColor, setPrimaryColor] = useState(workspace.primaryColor);
  const [accentColor, setAccentColor] = useState(workspace.accentColor);
  const [backgroundColor, setBackgroundColor] = useState(workspace.backgroundColor);

  function applyDefaultLabels(newType: WorkspaceType) {
    const defaults = getDefaultWorkspaceLabels(newType);
    setClientLabelSingular(defaults.clientSingular);
    setClientLabelPlural(defaults.clientPlural);
    setProfessionalLabel(defaults.professional);
    setAppointmentLabel(defaults.appointment);
    setRecordLabel(defaults.record);
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newType = e.target.value as WorkspaceType;
    setType(newType);
    applyDefaultLabels(newType);
  }

  return (
    <form className="form-card large-form" action={updateAction} aria-label="Configurações da empresa">
      <div className="field-grid two-columns">
        <div className="field-group wide-field">
          <label htmlFor="name">Nome da empresa *</label>
          <input id="name" name="name" type="text" defaultValue={workspace.name} required />
        </div>

        <div className="field-group">
          <label htmlFor="type">Tipo de negócio *</label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={handleTypeChange}
            required
          >
            {workspaceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="logoUrl">Logo URL</label>
          <input id="logoUrl" name="logoUrl" type="url" defaultValue={workspace.logoUrl ?? ""} placeholder="https://..." />
          <span>Use uma URL pública ou envie um arquivo abaixo.</span>
        </div>

        <div className="field-group">
          <label htmlFor="logoFile">Enviar logo</label>
          <input id="logoFile" name="logoFile" type="file" accept="image/png,image/jpeg,image/webp" />
          <span>PNG, JPG ou WebP até 2MB. Ao enviar arquivo, ele substitui a URL acima.</span>
        </div>

        <div className="field-group">
          <label htmlFor="primaryColor">Cor principal</label>
          <input id="primaryColor" name="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
        </div>

        <div className="field-group">
          <label htmlFor="accentColor">Cor de destaque</label>
          <input id="accentColor" name="accentColor" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
        </div>

        <div className="field-group">
          <label htmlFor="backgroundColor">Cor de fundo do painel</label>
          <input id="backgroundColor" name="backgroundColor" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
        </div>

        <div className="wide-field">
          <ColorPreview primary={primaryColor} accent={accentColor} background={backgroundColor} />
        </div>
      </div>

      <div className="section-divider">
        <h2>Termos da interface</h2>
        <p>Ao mudar o tipo de negócio, você pode aplicar os termos padrão do novo segmento.</p>
      </div>

      <div className="settings-preview" aria-label="Padrões por segmento">
        <div>
          <h2>Padrões do segmento atual: {workspaceTypeOptions.find((o) => o.value === type)?.label}</h2>
          <p>Termos padrão: {currentDefaults.clientPlural} · {currentDefaults.professional} · {currentDefaults.appointment} · {currentDefaults.record}</p>
        </div>
      </div>

      <div className="field-grid two-columns">
        <div className="field-group">
          <label htmlFor="clientLabelSingular">Pessoa atendida, singular</label>
          <input
            id="clientLabelSingular"
            name="clientLabelSingular"
            type="text"
            value={clientLabelSingular}
            onChange={(e) => setClientLabelSingular(e.target.value)}
            placeholder={currentDefaults.clientSingular}
          />
        </div>

        <div className="field-group">
          <label htmlFor="clientLabelPlural">Pessoa atendida, plural</label>
          <input
            id="clientLabelPlural"
            name="clientLabelPlural"
            type="text"
            value={clientLabelPlural}
            onChange={(e) => setClientLabelPlural(e.target.value)}
            placeholder={currentDefaults.clientPlural}
          />
        </div>

        <div className="field-group">
          <label htmlFor="professionalLabel">Profissional</label>
          <input
            id="professionalLabel"
            name="professionalLabel"
            type="text"
            value={professionalLabel}
            onChange={(e) => setProfessionalLabel(e.target.value)}
            placeholder={currentDefaults.professional}
          />
        </div>

        <div className="field-group">
          <label htmlFor="appointmentLabel">Agenda/atendimento</label>
          <input
            id="appointmentLabel"
            name="appointmentLabel"
            type="text"
            value={appointmentLabel}
            onChange={(e) => setAppointmentLabel(e.target.value)}
            placeholder={currentDefaults.appointment}
          />
        </div>

        <div className="field-group wide-field">
          <label htmlFor="recordLabel">Registro</label>
          <input
            id="recordLabel"
            name="recordLabel"
            type="text"
            value={recordLabel}
            onChange={(e) => setRecordLabel(e.target.value)}
            placeholder={currentDefaults.record}
          />
        </div>
      </div>

      <div className="form-actions">
        <button className="button primary" type="submit">
          Salvar configurações
        </button>
      </div>
    </form>
  );
}
