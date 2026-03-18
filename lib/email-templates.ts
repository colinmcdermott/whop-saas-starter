// ---------------------------------------------------------------------------
// Email templates -simple HTML strings, no dependencies
// ---------------------------------------------------------------------------
// Replace these with your own templates or integrate React Email.
// Each function returns { subject, html } ready for sendEmail().
// ---------------------------------------------------------------------------

import { APP_NAME } from "./constants";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function greeting(name: string | null): string {
  return name ? `Hi ${escapeHtml(name)},` : "Hi there,";
}

function wrapper(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:32px">
        <tr><td>${body}</td></tr>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#a1a1aa">${APP_NAME}</p>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Welcome email -sent on first sign-up via OAuth
// ---------------------------------------------------------------------------

export function welcomeEmail(name: string | null) {
  return {
    subject: `Welcome to ${APP_NAME}!`,
    html: wrapper(`
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#18181b">${greeting(name)}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46">
        Thanks for signing up for ${APP_NAME}. Your account is ready to go.
      </p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#3f3f46">
        Head to your dashboard to get started.
      </p>
      <p style="margin:0;font-size:13px;color:#71717a">
        If you didn&rsquo;t create this account, you can safely ignore this email.
      </p>
    `),
  };
}

// ---------------------------------------------------------------------------
// Payment failed -sent when a Whop payment_failed webhook fires
// ---------------------------------------------------------------------------

export function paymentFailedEmail(name: string | null) {
  return {
    subject: `Action needed: Payment failed -${APP_NAME}`,
    html: wrapper(`
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#18181b">${greeting(name)}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46">
        We were unable to process your latest payment for ${APP_NAME}.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46">
        Please update your billing information to keep your subscription active.
        If the payment continues to fail, your plan may be downgraded.
      </p>
      <p style="margin:0;font-size:13px;color:#71717a">
        If you believe this is an error, please contact support.
      </p>
    `),
  };
}
