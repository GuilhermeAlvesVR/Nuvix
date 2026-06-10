"use client";

import { useState } from "react";

export function UserRoleFields() {
  const [role, setRole] = useState("RECEPTIONIST");
  const [adminProvidesCare, setAdminProvidesCare] = useState(false);
  const shouldShowProfessionalFields = role === "PROFESSIONAL" || (role === "ADMIN" && adminProvidesCare);

  return (
    <>
      <div className="field-group">
        <label htmlFor="role">Perfil *</label>
        <select id="role" name="role" value={role} onChange={(event) => setRole(event.target.value)} required>
          <option value="ADMIN">Administrador</option>
          <option value="RECEPTIONIST">Recepcionista</option>
          <option value="PROFESSIONAL">Profissional</option>
        </select>
      </div>

      {role === "ADMIN" ? (
        <label className="checkbox-field wide-field" htmlFor="createProfessionalProfile">
          <input id="createProfessionalProfile" name="createProfessionalProfile" type="checkbox" checked={adminProvidesCare} onChange={(event) => setAdminProvidesCare(event.target.checked)} />
          Este administrador também realiza atendimentos
        </label>
      ) : null}

      {role === "PROFESSIONAL" ? <input name="createProfessionalProfile" type="hidden" value="on" /> : null}

      {shouldShowProfessionalFields ? (
        <div className="wide-field professional-fields-block">
          <div className="section-divider">
            <h2>Dados profissionais</h2>
            <p>O cadastro profissional será criado e vinculado automaticamente.</p>
          </div>

          <div className="field-grid two-columns">
            <div className="field-group wide-field">
              <label htmlFor="professionalName">Nome profissional</label>
              <input id="professionalName" name="professionalName" type="text" placeholder="Nome exibido na agenda, se diferente do usuário" />
            </div>

            <div className="field-group">
              <label htmlFor="specialty">Especialidade</label>
              <input id="specialty" name="specialty" type="text" placeholder="Ex.: Psicologia, Cardiologia" />
            </div>

            <div className="field-group">
              <label htmlFor="professionalDocument">Registro profissional</label>
              <input id="professionalDocument" name="professionalDocument" type="text" placeholder="CRM, CRO, CRP ou similar" />
            </div>

            <div className="field-group">
              <label htmlFor="professionalPhone">Telefone profissional</label>
              <input id="professionalPhone" name="professionalPhone" type="tel" placeholder="(00) 00000-0000" />
            </div>

            <div className="field-group">
              <label htmlFor="professionalEmail">Email profissional</label>
              <input id="professionalEmail" name="professionalEmail" type="email" placeholder="profissional@empresa.com" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
