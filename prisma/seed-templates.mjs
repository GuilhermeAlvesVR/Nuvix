import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TEMPLATES = [
  {
    name: "Anamnese Psicológica",
    segment: "PSYCHOLOGY",
    fields: [
      { label: "Histórico do paciente", key: "history", fieldType: "TEXTAREA", order: 1, placeholder: "Histórico familiar, social, escolar..." },
      { label: "Queixa principal", key: "main_complaint", fieldType: "TEXTAREA", order: 2 },
      { label: "Sinais e sintomas", key: "symptoms", fieldType: "TEXTAREA", order: 3 },
      { label: "Hipótese diagnóstica", key: "diagnosis", fieldType: "TEXT", order: 4 },
      { label: "Intervenção realizada", key: "intervention", fieldType: "TEXTAREA", order: 5 },
      { label: "Encaminhamento", key: "referral", fieldType: "TEXT", order: 6, placeholder: "Se houver, para qual profissional/área" },
    ],
  },
  {
    name: "Evolução Psicológica",
    segment: "PSYCHOLOGY",
    fields: [
      { label: "Tema da sessão", key: "session_theme", fieldType: "TEXT", order: 1 },
      { label: "Relato do paciente", key: "patient_report", fieldType: "TEXTAREA", order: 2 },
      { label: "Observações do profissional", key: "professional_notes", fieldType: "TEXTAREA", order: 3 },
      { label: "Estratégias utilizadas", key: "strategies", fieldType: "TEXTAREA", order: 4 },
      { label: "Tarefa para casa", key: "homework", fieldType: "TEXTAREA", order: 5, placeholder: "O que o paciente deve praticar até a próxima sessão" },
    ],
  },
  {
    name: "Avaliação Nutricional",
    segment: "NUTRITION",
    fields: [
      { label: "Dados antropométricos", key: "anthropometric", fieldType: "TEXTAREA", order: 1, placeholder: "Peso, altura, IMC, circunferências..." },
      { label: "História alimentar", key: "diet_history", fieldType: "TEXTAREA", order: 2 },
      { label: "Recordatório 24h", key: "recall_24h", fieldType: "TEXTAREA", order: 3 },
      { label: "Diagnóstico nutricional", key: "nutritional_diagnosis", fieldType: "TEXT", order: 4 },
      { label: "Conduta nutricional", key: "nutritional_conduct", fieldType: "TEXTAREA", order: 5 },
      { label: "Plano alimentar", key: "meal_plan", fieldType: "TEXTAREA", order: 6, placeholder: "Orientações gerais e distribuição de macros" },
    ],
  },
  {
    name: "Evolução Nutricional",
    segment: "NUTRITION",
    fields: [
      { label: "Aderência ao plano", key: "adherence", fieldType: "SELECT", order: 1, options: JSON.stringify(["Ruim", "Regular", "Boa", "Excelente"]) },
      { label: "Dificuldades relatadas", key: "difficulties", fieldType: "TEXTAREA", order: 2 },
      { label: "Evolução ponderal", key: "weight_progress", fieldType: "TEXT", order: 3, placeholder: "Peso atual e variação" },
      { label: "Ajustes na conduta", key: "adjustments", fieldType: "TEXTAREA", order: 4 },
      { label: "Próximos passos", key: "next_steps", fieldType: "TEXTAREA", order: 5 },
    ],
  },
  {
    name: "Anamnese Odontológica",
    segment: "DENTAL",
    fields: [
      { label: "História médica", key: "medical_history", fieldType: "TEXTAREA", order: 1 },
      { label: "Medicações em uso", key: "medications", fieldType: "TEXT", order: 2 },
      { label: "Alergias", key: "allergies", fieldType: "TEXT", order: 3 },
      { label: "Higiene bucal", key: "oral_hygiene", fieldType: "TEXTAREA", order: 4 },
      { label: "Exame clínico", key: "clinical_exam", fieldType: "TEXTAREA", order: 5, placeholder: "Tecidos moles, periodonto, dentes..." },
      { label: "Diagnóstico", key: "diagnosis", fieldType: "TEXT", order: 6 },
      { label: "Plano de tratamento", key: "treatment_plan", fieldType: "TEXTAREA", order: 7 },
    ],
  },
  {
    name: "Evolução Odontológica",
    segment: "DENTAL",
    fields: [
      { label: "Procedimento realizado", key: "procedure", fieldType: "TEXT", order: 1 },
      { label: "Intercorrências", key: "events", fieldType: "TEXTAREA", order: 2 },
      { label: "Prescrição", key: "prescription", fieldType: "TEXTAREA", order: 3 },
      { label: "Próximo passo", key: "next_step", fieldType: "TEXT", order: 4, placeholder: "Retorno, exame complementar, etc." },
    ],
  },
];

async function main() {
  const workspaces = await prisma.workspace.findMany({ select: { id: true } });

  for (const workspace of workspaces) {
    const existing = await prisma.clinicalTemplate.count({ where: { workspaceId: workspace.id } });
    if (existing > 0) {
      console.log(`Workspace ${workspace.id} já possui ${existing} templates. Pulando.`);
      continue;
    }

    for (const tmpl of DEFAULT_TEMPLATES) {
      await prisma.clinicalTemplate.create({
        data: {
          workspaceId: workspace.id,
          name: tmpl.name,
          segment: tmpl.segment,
          active: true,
          fields: {
            create: tmpl.fields,
          },
        },
      });
      console.log(`  Template criado: ${tmpl.name} (${tmpl.segment})`);
    }

    console.log(`Workspace ${workspace.id}: ${DEFAULT_TEMPLATES.length} templates criados.`);
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
