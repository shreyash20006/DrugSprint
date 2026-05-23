// ─── CC Recipients (update with real emails when ready) ───────────────────────
export const CC_EMAILS = [
  { email: "president@tgpcop.com", name: "President" },
  { email: "vicepresident@tgpcop.com", name: "Vice President" },
  { email: "generalsecretary@tgpcop.com", name: "General Secretary" },
];

const SENDER = { name: "TGPCOP Student Council", email: "sb108750@gmail.com" };
const ADMIN_URL = "https://tgpcop-concil.vercel.app/admin";

// ─── Helper: call Brevo API ────────────────────────────────────────────────────
async function sendBrevoEmail(payload: object): Promise<void> {
  const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;

  if (!brevoApiKey || brevoApiKey.includes("your_brevo_key")) {
    console.warn("⚠️ Brevo API Key not set — logging mock email:");
    console.log("✉️ [Mock Email]:", payload);
    return;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error: ${response.status} — ${errorText}`);
  }
}

// ─── EMAIL 1: Confirmation to Student ─────────────────────────────────────────
export async function sendConfirmationToStudent({
  studentName,
  studentEmail,
  directedTo,
  questionText,
}: {
  studentName: string;
  studentEmail: string;
  directedTo: string;
  questionText: string;
}): Promise<void> {
  try {
    await sendBrevoEmail({
      sender: SENDER,
      to: [{ email: studentEmail, name: studentName }],
      cc: CC_EMAILS,
      subject: "✅ Your Question Has Been Received — TGPCOP Council",
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0D1B3E;color:white;padding:30px;border-radius:12px;">
          <h2 style="color:#C84B0E;margin-top:0;">✅ Question Received!</h2>
          <p>Dear ${studentName},</p>
          <p>Your question has been successfully submitted to the TGPCOP Student Council.</p>
          <div style="background:#ffffff15;padding:15px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 8px;"><b>Directed To:</b> ${directedTo}</p>
            <p style="margin:0 0 8px;"><b>Your Question:</b></p>
            <p style="margin:0;line-height:1.6;">${questionText}</p>
          </div>
          <p>We will get back to you within <b>3-5 working days.</b></p>
          <p style="color:#C84B0E;margin-bottom:4px;">— TGPCOP Student Council Team</p>
          <p style="font-size:12px;color:#ffffff80;margin:0;">Tulsiramji Gaikwad Patil College of Pharmacy</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ sendConfirmationToStudent failed:", error);
  }
}

// ─── EMAIL 2: Notify Council Member ───────────────────────────────────────────
export async function sendQuestionToCouncil({
  studentName,
  studentEmail,
  studentYear,
  directedTo,
  questionText,
  memberEmail,
}: {
  studentName: string;
  studentEmail: string;
  studentYear: string;
  directedTo: string;
  questionText: string;
  memberEmail: string;
}): Promise<void> {
  try {
    await sendBrevoEmail({
      sender: SENDER,
      to: [{ email: memberEmail, name: directedTo }],
      cc: CC_EMAILS,
      subject: `📬 New Question from ${studentName}`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0D1B3E;color:white;padding:30px;border-radius:12px;">
          <h2 style="color:#C84B0E;margin-top:0;">📬 New Student Question</h2>
          <p style="margin:4px 0;"><b>From:</b> ${studentName}</p>
          <p style="margin:4px 0;"><b>Email:</b> ${studentEmail}</p>
          <p style="margin:4px 0;"><b>Year:</b> ${studentYear}</p>
          <p style="margin:4px 0;"><b>Directed To:</b> ${directedTo}</p>
          <hr style="border:0;border-top:1px solid #C84B0E33;margin:20px 0;"/>
          <p style="margin:0 0 8px;"><b>Question:</b></p>
          <div style="background:#ffffff15;padding:15px;border-radius:8px;line-height:1.6;">${questionText}</div>
          <a href="${ADMIN_URL}"
            style="background:#C84B0E;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:20px;font-weight:bold;">
            Login &amp; Reply →
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ sendQuestionToCouncil failed:", error);
  }
}

// ─── EMAIL 3: Admin Reply to Student ──────────────────────────────────────────
export async function sendReplyToStudent({
  studentName,
  studentEmail,
  directedTo,
  questionText,
  adminReply,
}: {
  studentName: string;
  studentEmail: string;
  directedTo: string;
  questionText: string;
  adminReply: string;
}): Promise<void> {
  try {
    await sendBrevoEmail({
      sender: SENDER,
      to: [{ email: studentEmail, name: studentName }],
      cc: CC_EMAILS,
      subject: "💬 Reply to Your Question — TGPCOP Council",
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0D1B3E;color:white;padding:30px;border-radius:12px;">
          <h2 style="color:#C84B0E;margin-top:0;">💬 Reply from Student Council</h2>
          <p>Dear ${studentName},</p>
          <p>The council has replied to your question:</p>
          <div style="background:#ffffff10;padding:15px;border-radius:8px;margin:15px 0;">
            <p style="color:#ffffff80;font-size:12px;margin:0 0 8px;">YOUR QUESTION:</p>
            <p style="margin:0;line-height:1.6;">${questionText}</p>
          </div>
          <div style="background:#C84B0E22;border-left:4px solid #C84B0E;padding:15px;border-radius:8px;">
            <p style="color:#ffffff80;font-size:12px;margin:0 0 8px;">REPLY FROM ${directedTo}:</p>
            <p style="margin:0;line-height:1.6;">${adminReply}</p>
          </div>
          <p style="margin-top:20px;">For more queries, visit our website.</p>
          <p style="color:#C84B0E;margin-bottom:4px;">— ${directedTo}<br/>TGPCOP Student Council</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ sendReplyToStudent failed:", error);
  }
}

// ─── Legacy export (kept for backward compat) ─────────────────────────────────
export async function sendQuestionEmail({
  studentName,
  studentYear,
  directedTo,
  questionText,
  memberEmail,
  studentEmail = "",
}: {
  studentName: string;
  studentYear: string;
  directedTo: string;
  questionText: string;
  memberEmail: string;
  studentEmail?: string;
}): Promise<void> {
  await sendQuestionToCouncil({
    studentName,
    studentEmail,
    studentYear,
    directedTo,
    questionText,
    memberEmail,
  });
}

export async function sendAdminNotification({
  subject,
  title,
  bodyHtml,
}: {
  subject: string;
  title: string;
  bodyHtml: string;
}): Promise<void> {
  try {
    await sendBrevoEmail({
      sender: { name: "TGPCOP Alert System", email: "sb108750@gmail.com" },
      to: [{ email: "sb108750@gmail.com", name: "TGPCOP Super Admin" }],
      subject,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;
        background:#0D1B3E;color:white;padding:30px;border-radius:12px;border-top:4px solid #C84B0E;">
          <h2 style="color:#C84B0E;margin-top:0;">🔔 ${title}</h2>
          <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;"/>
          <div style="line-height:1.6;font-size:14px;color:rgba(255,255,255,0.95);">${bodyHtml}</div>
          <a href="${ADMIN_URL}"
            style="background:#C84B0E;color:white;padding:12px 24px;
            border-radius:8px;text-decoration:none;display:inline-block;
            margin-top:30px;font-weight:bold;font-size:14px;">
            Access Portal Console →
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ sendAdminNotification failed:", error);
  }
}

export default sendQuestionEmail;
