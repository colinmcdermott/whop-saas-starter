import { getConfig } from "./config";

export type EmailProvider = "resend" | "sendgrid" | "";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send an email via the configured provider (Resend or SendGrid).
 *
 * Uses direct fetch to the provider API — no SDK dependency.
 * Returns { success: false } if no email provider is configured.
 *
 * @example
 * const result = await sendEmail({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   html: "<h1>Welcome to our app</h1>",
 * });
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const [provider, apiKey] = await Promise.all([
    getConfig("email_provider"),
    getConfig("email_api_key"),
  ]);

  if (!provider || !apiKey) {
    console.warn("[Email] No email provider configured — skipping send");
    return { success: false, error: "Email provider not configured" };
  }

  const from = options.from || "noreply@example.com";

  try {
    switch (provider as EmailProvider) {
      case "resend":
        return await sendViaResend(apiKey, { ...options, from });
      case "sendgrid":
        return await sendViaSendGrid(apiKey, { ...options, from });
      default:
        return { success: false, error: `Unknown email provider: ${provider}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Email] Send failed:`, message);
    return { success: false, error: message };
  }
}

async function sendViaResend(
  apiKey: string,
  options: SendEmailOptions & { from: string },
): Promise<SendEmailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (res.ok) return { success: true };

  const data = await res.json().catch(() => ({}));
  return { success: false, error: data.message || `Resend error (${res.status})` };
}

async function sendViaSendGrid(
  apiKey: string,
  options: SendEmailOptions & { from: string },
): Promise<SendEmailResult> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: options.from },
      subject: options.subject,
      content: [{ type: "text/html", value: options.html }],
    }),
  });

  // SendGrid returns 202 on success
  if (res.ok || res.status === 202) return { success: true };

  const data = await res.json().catch(() => ({}));
  return {
    success: false,
    error: data.errors?.[0]?.message || `SendGrid error (${res.status})`,
  };
}
