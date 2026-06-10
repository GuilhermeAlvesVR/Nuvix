"use client";

import { useState } from "react";
import Link from "next/link";
import { completeOnboarding } from "./onboarding-actions";

const steps = [
  { href: "/app/configuracoes", label: "Configure sua empresa", desc: "Defina nome, cores e termos da interface" },
  { href: "/app/profissionais", label: "Cadastre um profissional", desc: "Profissionais podem receber agendamentos" },
  { href: "/app/pacientes/novo", label: "Cadastre um paciente", desc: "Pelo menos nome e telefone ou email" },
  { href: "/app/agenda", label: "Agende uma consulta", desc: "Escolha paciente, profissional e horário" },
];

export function OnboardingTour() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Bem-vindo ao Nuvix! 🎉</h2>
          <p>Complete os passos abaixo para começar a usar o sistema.</p>
        </div>
        <div className="onboarding-steps">
          {steps.map((step, i) => (
            <Link key={step.href} href={step.href} className="onboarding-step">
              <span className="onboarding-step-num">{i + 1}</span>
              <div>
                <strong>{step.label}</strong>
                <span>{step.desc}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
        <div className="onboarding-footer">
          <form action={completeOnboarding}>
            <button className="button secondary" type="submit" onClick={() => setDismissed(true)}>
              Concluir tour
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
