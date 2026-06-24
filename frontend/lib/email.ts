// Minimal Resend email sender. Server-side only (uses RESEND_API_KEY).
// `from` defaults to Resend's test sender (delivers only to the Resend account
// owner) so nothing breaks before a domain is verified; set RESEND_FROM to a
// verified address (e.g. "Pathfinder <noreply@yourdomain.com>") for real sends.

type SendArgs = { to: string; subject: string; html: string }
type SendResult = { ok: boolean; id?: string; error?: string }

export async function sendEmail({ to, subject, html }: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' }

  const from = process.env.RESEND_FROM || 'Pathfinder <onboarding@resend.dev>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return { ok: false, error: `Resend ${res.status}: ${detail.slice(0, 300)}` }
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: json.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' }
  }
}

// Branded, design-system (coral) password-reset email.
export function passwordResetEmailHtml(resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;background:#faf9f7;font-family:'Inter',-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1814;padding:24px;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:18px;padding:32px 28px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
        <div style="width:36px;height:36px;border-radius:11px;background:#e8643a;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;">P</div>
        <span style="font-weight:700;font-size:15px;letter-spacing:-0.02em;">Pathfinder</span>
      </div>
      <h1 style="font-size:20px;font-weight:800;letter-spacing:-0.03em;margin:0 0 10px;">Reset your password</h1>
      <p style="font-size:14px;line-height:1.6;color:#48433e;margin:0 0 24px;">
        We received a request to reset the password for your Pathfinder account. Click the button below to choose a new one. This link expires shortly and can only be used once.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#e8643a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;padding:12px 22px;border-radius:12px;box-shadow:0 4px 16px rgba(232,100,58,0.28);">
        Reset password
      </a>
      <p style="font-size:12.5px;line-height:1.6;color:#8a827a;margin:24px 0 0;">
        If the button doesn't work, paste this link into your browser:<br>
        <a href="${resetUrl}" style="color:#e8643a;word-break:break-all;">${resetUrl}</a>
      </p>
      <p style="font-size:12.5px;line-height:1.6;color:#8a827a;margin:20px 0 0;border-top:1px solid rgba(0,0,0,0.06);padding-top:16px;">
        Didn't request this? You can safely ignore this email — your password won't change.
      </p>
    </div>
  </div>
</body>
</html>`
}
