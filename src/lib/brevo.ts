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

export async function sendPaymentReceiptEmail({
  studentName,
  studentEmail,
  studentYear,
  purpose,
  amount,
  paymentId,
  formattedDate,
}: {
  studentName: string;
  studentEmail: string;
  studentYear: string;
  purpose: string;
  amount: number;
  paymentId: string;
  formattedDate: string;
}) {
  const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;

  if (!brevoApiKey || brevoApiKey.includes("your_brevo_key")) {
    console.warn("⚠️ Brevo API Key is not set or has placeholders! Logging email values instead.");
    console.log("✉️ [Mock Brevo Receipt Email Sent]:", {
      studentName,
      studentEmail,
      studentYear,
      purpose,
      amount,
      paymentId,
      formattedDate,
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
        subject: `✅ Payment Receipt — TGPCOP Council`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;
          background:#0D1B3E;color:white;padding:30px;border-radius:12px;">

            <div style="text-align:center;margin-bottom:24px;">
              <img src="https://res.cloudinary.com/dsqxboxoc/image/upload/v1779522116/WhatsApp_Image_2026-05-23_at_1.10.29_PM_susb5a.jpg" width="60" style="border-radius:8px;"/>
              <h2 style="color:#C84B0E;margin:8px 0;font-size:22px;">
                TGPCOP Student Council
              </h2>
              <p style="color:#ffffff80;font-size:12px;margin:0;">
                Official Payment Receipt
              </p>
            </div>

            <div style="background:#ffffff10;border-radius:12px;padding:20px;border-left:4px solid #C84B0E;">
              <h3 style="color:#F5A623;margin:0 0 16px;font-size:18px;">
                ✅ Payment Confirmed
              </h3>
              <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:2;">
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;width:40%;">Student Name</td>
                  <td style="padding:6px 0;color:white;font-weight:bold;">
                    ${studentName}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Year</td>
                  <td style="padding:6px 0;color:white;">
                    ${studentYear}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Purpose</td>
                  <td style="padding:6px 0;color:white;">
                    ${purpose}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Amount Paid</td>
                  <td style="padding:6px 0;color:#F5A623;font-size:20px;font-weight:bold;">
                    ₹${amount}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Payment ID</td>
                  <td style="padding:6px 0;color:white;font-size:12px;font-family:monospace;">
                    ${paymentId}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Date & Time</td>
                  <td style="padding:6px 0;color:white;">
                    ${formattedDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#ffffff80;">Status</td>
                  <td style="padding:8px 0;">
                    <span style="background:#22C55E;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold;">
                      ✅ PAID
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="color:#ffffff60;font-size:12px;text-align:center;margin-top:24px;">
              Keep this receipt for your records.<br/>
              For queries contact: <a href="mailto:president@tgpcop.com" style="color:#C84B0E;text-decoration:none;">president@tgpcop.com</a>
            </p>
            
            <p style="color:#C84B0E;text-align:center;margin-top:16px;font-size:11px;font-weight:bold;letter-spacing:0.5px;">
              Tulsiramji Gaikwad Patil College of Pharmacy, Nagpur
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
    console.error("❌ Failed to send receipt email via Brevo:", error);
  }
}

export async function sendAdminPaymentNotification({
  studentName,
  purpose,
  amount,
}: {
  studentName: string;
  purpose: string;
  amount: number;
}) {
  const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;
  const adminEmail = "president@tgpcop.com";

  if (!brevoApiKey || brevoApiKey.includes("your_brevo_key")) {
    console.warn("⚠️ Brevo API Key is not set or has placeholders! Logging email values instead.");
    console.log("✉️ [Mock Brevo Admin Payment Notification Sent]:", {
      studentName,
      purpose,
      amount,
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
        to: [{ email: adminEmail, name: "TGPCOP Student Council President" }],
        subject: `💰 New Payment — ${studentName} — ₹${amount}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;
          background:#0D1B3E;color:white;padding:30px;border-radius:12px;border-top:4px solid #C84B0E;">
            <h2 style="color:#C84B0E;margin-top:0;font-size:20px;text-align:center;">🔔 New Payment Collected</h2>
            <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;"/>
            <div style="line-height:1.6;font-size:14px;color:rgba(255,255,255,0.95);background:#ffffff05;padding:15px;border-radius:8px;border-left:4px solid #C84B0E;">
              <p style="margin:4px 0;"><b>Student:</b> ${studentName}</p>
              <p style="margin:4px 0;"><b>Purpose:</b> ${purpose}</p>
              <p style="margin:4px 0;font-size:16px;color:#F5A623;"><b>Amount:</b> ₹${amount}</p>
            </div>
            <a href="https://tgpcop-council.vercel.app/admin/payments"
              style="background:#C84B0E;color:white;padding:12px 24px;
              border-radius:8px;text-decoration:none;display:block;text-align:center;
              margin-top:30px;font-weight:bold;font-size:14px;">
              View Admin Payments Ledger →
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
    console.error("❌ Failed to send admin payment email via Brevo:", error);
  }
}

export default sendQuestionEmail;

