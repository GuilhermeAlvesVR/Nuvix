const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@nuvix.com.br";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload) {
  if (!RESEND_API_KEY) {
    return { ok: true, mock: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    console.error("[email] Failed to send — status:", response.status);
    return { ok: false, error: "Erro ao enviar email." };
  }

  return { ok: true };
}

export function buildAppointmentReminderHtml({ patientName, professionalName, date, time, companyName }: {
  patientName: string;
  professionalName: string;
  date: string;
  time: string;
  companyName: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #116466;">Lembrete de consulta</h2>
      <p>Olá, <strong>${patientName}</strong>!</p>
      <p>Você tem uma consulta agendada:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: 600;">Profissional</td><td style="padding: 8px; border: 1px solid #ddd;">${professionalName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: 600;">Data</td><td style="padding: 8px; border: 1px solid #ddd;">${date}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: 600;">Horário</td><td style="padding: 8px; border: 1px solid #ddd;">${time}</td></tr>
      </table>
      <p style="color: #666; font-size: 13px;">Equipe ${companyName}</p>
    </div>
  `;
}
