export async function sendQuestionEmail({
  studentName,
  studentYear,
  directedTo,
  questionText,
  memberEmail,
}: {
  studentName: string;
  studentYear: string;
  directedTo: string;
  questionText: string;
  memberEmail: string;
}) {
  const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;

  if (!brevoApiKey || brevoApiKey.includes("your_brevo_key")) {
    console.warn("⚠️ Brevo API Key is not set or has placeholders! Logging email values instead.");
    console.log("✉️ [Mock Brevo Email Sent]:", {
      studentName,
      studentYear,
      directedTo,
      questionText,
      memberEmail,
    });
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "TGPCOP Student Council", email: "sb108750@gmail.com" },
        to: [{ email: memberEmail, name: directedTo }],
        subject: `New Student Question — ${directedTo}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;
          background:#0D1B3E;color:white;padding:30px;border-radius:12px;">
            <h2 style="color:#C84B0E;margin-top:0;">📬 New Question Received</h2>
            <p><b>From:</b> ${studentName}</p>
            <p><b>Year:</b> ${studentYear}</p>
            <p><b>Directed To:</b> ${directedTo}</p>
            <hr style="border:0;border-top:1px solid #C84B0E;margin:20px 0;"/>
            <p><b>Question:</b></p>
            <p style="background:rgba(255,255,255,0.1);padding:15px;border-radius:8px;line-height:1.6;">
              ${questionText}
            </p>
            <a href="https://tgpcop-council.vercel.app/admin"
              style="background:#C84B0E;color:white;padding:12px 24px;
              border-radius:8px;text-decoration:none;display:inline-block;
              margin-top:20px;font-weight:bold;">
              Login to Admin Panel →
            </a>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Failed to send email via Brevo:", error);
  }
}

export async function sendAdminNotification({
  subject,
  title,
  bodyHtml,
}: {
  subject: string;
  title: string;
  bodyHtml: string;
}) {
  const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;
  const adminEmail = "sb108750@gmail.com"; // Primary alert inbox

  if (!brevoApiKey || brevoApiKey.includes("your_brevo_key")) {
    console.warn("⚠️ Brevo API Key is not set or has placeholders! Logging email values instead.");
    console.log("✉️ [Mock Brevo Admin Notification Sent]:", {
      subject,
      title,
      bodyHtml,
    });
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "TGPCOP Alert System", email: "sb108750@gmail.com" },
        to: [{ email: adminEmail, name: "TGPCOP Super Admin" }],
        subject: subject,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;
          background:#0D1B3E;color:white;padding:30px;border-radius:12px;border-top:4px solid #C84B0E;">
            <h2 style="color:#C84B0E;margin-top:0;">🔔 ${title}</h2>
            <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;"/>
            <div style="line-height:1.6;font-size:14px;color:rgba(255,255,255,0.95);">
              ${bodyHtml}
            </div>
            <a href="https://tgpcop-council.vercel.app/admin"
              style="background:#C84B0E;color:white;padding:12px 24px;
              border-radius:8px;text-decoration:none;display:inline-block;
              margin-top:30px;font-weight:bold;font-size:14px;">
              Access Portal Console →
            </a>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Failed to send email via Brevo:", error);
  }
}

export async function sendQuestionReplyEmail({
  studentName,
  studentEmail,
  questionText,
  replyText,
  directedTo,
}: {
  studentName: string;
  studentEmail: string;
  questionText: string;
  replyText: string;
  directedTo: string;
}) {
  const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;

  if (!brevoApiKey || brevoApiKey.includes("your_brevo_key")) {
    console.warn("⚠️ Brevo API Key is not set or has placeholders! Logging email values instead.");
    console.log("✉️ [Mock Brevo Reply Email Sent]:", {
      studentName,
      studentEmail,
      questionText,
      replyText,
      directedTo,
    });
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "TGPCOP Student Council", email: "sb108750@gmail.com" },
        to: [{ email: studentEmail, name: studentName }],
        subject: `📬 Student Council Response: Re: ${directedTo}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;
          background:#0D1B3E;color:white;padding:30px;border-radius:12px;border-top:4px solid #C84B0E;">
            <h2 style="color:#C84B0E;margin-top:0;">📬 Student Council Response</h2>
            <p>Dear <b>${studentName}</b>,</p>
            <p>The TGPCOP Student Council has responded to your question directed to <b>${directedTo}</b>:</p>
            <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;"/>
            <p><b>Your Question:</b></p>
            <p style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;font-style:italic;">
              "${questionText}"
            </p>
            <p><b>Council Response:</b></p>
            <p style="background:rgba(200,75,14,0.1);padding:15px;border-radius:8px;
            border-left:4px solid #C84B0E;line-height:1.6;font-weight:500;color:white;">
              ${replyText}
            </p>
            <p style="margin-top:25px;font-size:12px;color:rgba(255,255,255,0.5);">
              Best regards,<br/>
              <b>TGPCOP Student Council Executive Committee</b>
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Failed to send email via Brevo:", error);
  }
}

export default sendQuestionEmail;
