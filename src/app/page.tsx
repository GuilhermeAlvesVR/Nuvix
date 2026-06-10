import Image from "next/image";

const modules = [
  {
    title: "Pacientes",
    description: "Cadastro, busca rápida, dados de contato e histórico de consultas."
  },
  {
    title: "Agenda",
    description: "Consultas por profissional, status de atendimento e bloqueio de conflitos."
  },
  {
    title: "Atendimento",
    description: "Resumo clínico, observações, conduta e retorno recomendado."
  },
  {
    title: "Financeiro",
    description: "Pagamentos, despesas, pendências e relatórios por período."
  }
];

const appointments = [
  {
    time: "08:30",
    patient: "Maria Oliveira",
    professional: "Dra. Camila Rocha",
    status: "Confirmada",
    statusType: "confirmed"
  },
  {
    time: "10:00",
    patient: "João Santos",
    professional: "Dr. Renato Lima",
    status: "Pagamento pendente",
    statusType: "pending"
  },
  {
    time: "14:15",
    patient: "Ana Costa",
    professional: "Dra. Camila Rocha",
    status: "Retorno agendado",
    statusType: "scheduled"
  }
];

const nextFlows = [
  "Login com perfis de acesso",
  "Busca e cadastro de pacientes",
  "Agendamento com conflito bloqueado"
];

export default function Home() {
  return (
    <main className="page-shell nuvix-surface">
      <section className="hero">
        <div className="hero-card">
          <Image className="nuvix-logo" src="/brand/nuvix-logo.png" alt="Nuvix" width={140} height={45} priority />
          <div className="eyebrow">SDD MVP em construção</div>
          <h1>Gestão simples para consultórios que precisam sair das planilhas.</h1>
          <p className="lead">
            Sistema para registrar pacientes, organizar consultas, manter histórico de atendimento e acompanhar receitas, despesas e pendências financeiras.
          </p>
          <div className="actions">
            <a className="button primary" href="/login">
              Acessar sistema
            </a>
            <a className="button secondary" href="/cadastro">
              Cadastrar empresa
            </a>
          </div>
          <div className="metrics" aria-label="Indicadores do sistema">
            <div className="metric">
              <strong>7</strong>
              <span>módulos previstos no MVP</span>
            </div>
            <div className="metric">
              <strong>11</strong>
              <span>histórias iniciais documentadas</span>
            </div>
            <div className="metric">
              <strong>3</strong>
              <span>perfis de acesso principais</span>
            </div>
          </div>
        </div>

        <aside className="panel" aria-label="Agenda do dia">
          <div className="panel-header">
            <h2>Agenda de hoje</h2>
            <span className="status-pill">Exemplo</span>
          </div>
          {appointments.map((appointment) => (
            <div className="appointment" key={`${appointment.time}-${appointment.patient}`}>
              <div>
                <strong>
                  {appointment.time} - {appointment.patient}
                </strong>
                <span>{appointment.professional}</span>
              </div>
              <span className={`badge ${appointment.statusType}`}>{appointment.status}</span>
            </div>
          ))}
        </aside>
      </section>

      <section className="module-grid" aria-label="Módulos do sistema">
        {modules.map((module) => (
          <article className="module" key={module.title}>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
          </article>
        ))}
      </section>

      <section className="next-steps" aria-labelledby="next-steps-title">
        <div>
          <span className="eyebrow compact">Prioridade de UX</span>
          <h2 id="next-steps-title">Primeiros fluxos reais do MVP</h2>
        </div>
        <ol>
          {nextFlows.map((flow) => (
            <li key={flow}>{flow}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
