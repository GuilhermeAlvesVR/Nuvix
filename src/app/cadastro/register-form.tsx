"use client";

import { useState } from "react";
import Link from "next/link";
import { ColorPreview } from "./color-preview";
import { getDefaultWorkspaceLabels, workspaceTypeOptions } from "@/lib/workspace";
import { WorkspaceType } from "@prisma/client";

function WorkspaceTypePreview({ type }: { type: WorkspaceType }) {
  const labels = getDefaultWorkspaceLabels(type);
  return (
    <div className="workspace-type-preview">
      <h4>Exemplo de termos usados:</h4>
      <ul>
        <li><strong>Atendidos:</strong> {labels.clientPlural}</li>
        <li><strong>Profissional:</strong> {labels.professional}</li>
        <li><strong>Agenda:</strong> {labels.appointment}</li>
        <li><strong>Registro:</strong> {labels.record}</li>
      </ul>
    </div>
  );
}

export function RegisterWorkspaceForm({
  error,
  success,
  action
}: {
  error?: string;
  success?: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [type, setType] = useState<WorkspaceType>("HEALTH");
  const [primaryColor, setPrimaryColor] = useState("#116466");
  const [accentColor, setAccentColor] = useState("#d9b08c");
  const [backgroundColor, setBackgroundColor] = useState("#f6f3ee");

  return (
    <form className="form-card large-form" action={action} aria-label="Cadastro de empresa">
      {success ? <div className="success-message">Cadastro enviado. Aguarde a aprovação para acessar o sistema.</div> : null}
      {error ? <div className="error-message">{error}</div> : null}

      <div className="field-grid two-columns">
        <div className="field-group wide-field">
          <label htmlFor="companyName">Nome da empresa *</label>
          <input id="companyName" name="companyName" type="text" placeholder="Ex.: Clínica Vida Plena" required />
        </div>

        <div className="field-group">
          <label htmlFor="type">Tipo *</label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as WorkspaceType)}
            required
          >
            {workspaceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span>Os termos da interface (paciente, profissional etc.) mudam conforme o tipo escolhido.</span>
        </div>

        <div className="field-group wide-field">
          <WorkspaceTypePreview type={type} />
        </div>

        <div className="field-group">
          <label htmlFor="ownerName">Responsável *</label>
          <input id="ownerName" name="ownerName" type="text" placeholder="Nome completo" required />
        </div>

        <div className="field-group">
          <label htmlFor="ownerEmail">Email do administrador *</label>
          <input id="ownerEmail" name="ownerEmail" type="email" placeholder="responsavel@empresa.com" autoComplete="email" required />
        </div>

        <div className="field-group">
          <label htmlFor="ownerPhone">Telefone *</label>
          <input id="ownerPhone" name="ownerPhone" type="tel" placeholder="(00) 00000-0000" required />
        </div>

        <div className="field-group">
          <label htmlFor="password">Senha inicial *</label>
          <input id="password" name="password" type="password" minLength={8} placeholder="Mínimo 8 caracteres" autoComplete="new-password" required />
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

      <div className="rule-callout">
        <strong>Aprovação obrigatória</strong>
        <p>O primeiro administrador só conseguirá acessar o sistema depois que a empresa for aprovada no painel da plataforma.</p>
      </div>

      <div className="form-actions">
        <Link className="button secondary" href="/login">Já tenho acesso</Link>
        <button className="button primary" type="submit">
          Enviar cadastro
        </button>
      </div>
    </form>
  );
}
