import { Resend } from "resend";

/**
 * Server-only Resend wrapper. Falls back to a no-op when RESEND_API_KEY
 * is unset so dev/staging environments don't fail and so a missing
 * secret doesn't break the Stripe webhook handler.
 */

let _client: Resend | null = null;

function getResend(): Resend | null {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _client = new Resend(key);
  return _client;
}

/** "From" address — must match a verified domain in Resend. Default
 *  uses Resend's own sandbox domain so emails work out of the box for
 *  testing without DNS setup. Override via EMAIL_FROM in env. */
function fromAddress(): string {
  return process.env.EMAIL_FROM || "Canvas Buddy <onboarding@resend.dev>";
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY unset — would have sent: "${args.subject}" to ${args.to}`);
    return;
  }
  if (!args.to || !args.to.includes("@")) {
    console.warn(`[email] no valid recipient — skipping: "${args.subject}"`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (error) {
      console.warn(`[email] send failed: ${JSON.stringify(error)}`);
    }
  } catch (err) {
    // Email failures should never break the parent flow (webhook etc.).
    console.warn(`[email] unexpected error: ${err instanceof Error ? err.message : err}`);
  }
}

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://canvasbuddy.io";
const BRAND_GREEN = "#1ED760";
const TEXT_COLOR = "#1a1a1a";
const MUTED_COLOR = "#666";

/** Shared HTML wrapper — keeps templates terse. */
function shell(title: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${TEXT_COLOR};">
  <div style="max-width:540px;margin:32px auto;background:#fff;padding:32px;border-radius:12px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
      <div style="width:32px;height:32px;border-radius:50%;background:${BRAND_GREEN};display:inline-block;"></div>
      <span style="font-size:18px;font-weight:700;letter-spacing:-0.01em;">Canvas Buddy</span>
    </div>
    <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px;">${title}</h1>
    ${body}
    <hr style="margin:32px 0 16px;border:none;border-top:1px solid #eee;">
    <p style="color:${MUTED_COLOR};font-size:12px;line-height:1.5;margin:0;">
      Canvas Buddy — Spotify Canvas videos in seconds.<br>
      <a href="${APP_URL}" style="color:${MUTED_COLOR};">canvasbuddy.io</a>
    </p>
  </div>
</body></html>`;
}

export function welcomeToProEmail(): { subject: string; html: string } {
  return {
    subject: "Welcome to Canvas Buddy Pro",
    html: shell(
      "You're Pro now.",
      `<p style="font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
         Thanks for upgrading. Here's what's now unlocked on your account:
       </p>
       <ul style="font-size:15px;line-height:1.7;padding-left:20px;color:${TEXT_COLOR};">
         <li>Unlimited canvas videos per month</li>
         <li>Unlimited AI image generations</li>
         <li>No watermark on any render</li>
         <li>Priority rendering</li>
       </ul>
       <p style="margin-top:24px;">
         <a href="${APP_URL}/app" style="display:inline-block;background:${BRAND_GREEN};color:#000;font-weight:600;padding:12px 24px;border-radius:24px;text-decoration:none;">
           Open the app
         </a>
       </p>
       <p style="margin-top:24px;font-size:13px;color:${MUTED_COLOR};">
         Manage your subscription anytime from the "Manage subscription" link in the app.
       </p>`
    ),
  };
}

export function watermarkRemovedEmail(canvasName: string): { subject: string; html: string } {
  return {
    subject: "Your watermark-free canvas is ready",
    html: shell(
      `"${canvasName}" is unlocked.`,
      `<p style="font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
         Your $4.99 paid through. The clean copy of <strong>${canvasName}</strong> is now in your library.
       </p>
       <p style="margin-top:24px;">
         <a href="${APP_URL}/app" style="display:inline-block;background:${BRAND_GREEN};color:#000;font-weight:600;padding:12px 24px;border-radius:24px;text-decoration:none;">
           Download from the library
         </a>
       </p>
       <p style="margin-top:24px;font-size:13px;color:${MUTED_COLOR};">
         Render watermark-free more often? Pro is $9.99/mo and uncaps everything.
       </p>`
    ),
  };
}
