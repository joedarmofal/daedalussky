type EscalationEmailInput = {
  to: string;
  taggedMemberName: string;
  reporterName: string;
  moduleName: string;
  tripNumber: string;
  entryDate: string;
  concernSummary: string;
};

/**
 * Sends a debrief escalation email using Resend REST API when configured.
 * Returns "sent", "skipped", or "failed".
 */
export async function sendDebriefEscalationEmail(
  input: EscalationEmailInput,
): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DEBRIEF_NOTIFICATION_FROM;

  if (!apiKey || !from) {
    return "skipped";
  }

  const subject = `Debrief escalation: ${input.moduleName} · Trip ${input.tripNumber}`;
  const html = `
    <p>Hello ${escapeHtml(input.taggedMemberName)},</p>
    <p>A debrief concern was escalated and assigned to you.</p>
    <ul>
      <li><strong>Reporter:</strong> ${escapeHtml(input.reporterName)}</li>
      <li><strong>Module:</strong> ${escapeHtml(input.moduleName)}</li>
      <li><strong>Trip:</strong> ${escapeHtml(input.tripNumber)}</li>
      <li><strong>Date:</strong> ${escapeHtml(input.entryDate)}</li>
    </ul>
    <p><strong>Concern summary:</strong></p>
    <p>${escapeHtml(input.concernSummary)}</p>
    <p>Review this item in Debriefing as soon as practical.</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    return "failed";
  }
  return "sent";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
