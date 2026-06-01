export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, payload } = req.body;
    const brevoApiKey = process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;

    if (action === 'checkConfig') {
      const isBrevoConfigured = !!brevoApiKey && !brevoApiKey.includes('your_brevo_key');
      return res.status(200).json({ configured: isBrevoConfigured });
    }

    // Trigger Pabbly Connect Webhook immediately for new complaints (Pre-flight to bypass key checks)
    if (action === 'sendAdminNotification' && payload && payload.subject && payload.subject.includes('Complaint')) {
      try {
        await fetch("https://connect.pabbly.com/webhook-listener/webhook/IjU3NjMwNTZkMDYzNzA0MzU1MjZjNTUzNiI_3D_pc/IjU3NjcwNTZlMDYzZjA0MzQ1MjZmNTUzNjUxMzIi_pc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "new_complaint",
            subject: payload.subject,
            title: payload.title,
            bodyHtml: payload.bodyHtml,
            timestamp: new Date().toISOString()
          })
        });
        console.log("✅ Successfully dispatched complaint alert to Pabbly webhook (Pre-flight).");
      } catch (webhookErr) {
        console.error("⚠️ Pabbly Connect webhook dispatch failed:", webhookErr);
      }
    }

    if (!brevoApiKey) {
      console.warn("⚠️ Server-side Brevo API key is not configured. Simulating dispatch.");
      return res.status(200).json({ success: true, message: 'Mock email dispatch succeeded' });
    }

    let emailBody = {};

    if (action === 'sendQuestionEmail') {
      const { studentName, studentYear, directedTo, questionText, memberEmail } = payload;
      emailBody = {
        sender: { name: "TGPCOP Student Council", email: "contact@tgpcopcouncil.online" },
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
            <a href="https://tgpcopcouncil.online/admin"
              style="background:#C84B0E;color:white;padding:12px 24px;
              border-radius:8px;text-decoration:none;display:inline-block;
              margin-top:20px;font-weight:bold;">
              Login to Admin Panel →
            </a>
          </div>
        `
      };
    } else if (action === 'sendAdminNotification') {
      const { subject, title, bodyHtml } = payload;

      const adminEmail = "contact@tgpcopcouncil.online";
      emailBody = {
        sender: { name: "TGPCOP Alert System", email: "contact@tgpcopcouncil.online" },
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
            <a href="https://tgpcopcouncil.online/admin"
              style="background:#C84B0E;color:white;padding:12px 24px;
              border-radius:8px;text-decoration:none;display:inline-block;
              margin-top:30px;font-weight:bold;font-size:14px;">
              Access Portal Console →
            </a>
          </div>
        `
      };
    } else if (action === 'sendQuestionReplyEmail') {
      const { studentName, studentEmail, questionText, replyText, directedTo } = payload;
      emailBody = {
        sender: { name: "TGPCOP Student Council", email: "contact@tgpcopcouncil.online" },
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
        `
      };
    } else if (action === 'sendPaymentReceiptEmail') {
      const { studentName, studentEmail, studentYear, purpose, amount, paymentId, formattedDate } = payload;
      emailBody = {
        sender: { name: "TGPCOP Student Council", email: "contact@tgpcopcouncil.online" },
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
                  <td style="padding:6px 0;color:white;font-weight:bold;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Year</td>
                  <td style="padding:6px 0;color:white;">${studentYear}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Purpose</td>
                  <td style="padding:6px 0;color:white;">${purpose}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Amount Paid</td>
                  <td style="padding:6px 0;color:#F5A623;font-size:20px;font-weight:bold;">₹${amount}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Payment ID</td>
                  <td style="padding:6px 0;color:white;font-size:12px;font-family:monospace;">${paymentId}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#ffffff80;">Date & Time</td>
                  <td style="padding:6px 0;color:white;">${formattedDate}</td>
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
              For queries contact: <a href="mailto:contact@tgpcopcouncil.online" style="color:#C84B0E;text-decoration:none;">contact@tgpcopcouncil.online</a>
            </p>
            <p style="color:#C84B0E;text-align:center;margin-top:16px;font-size:11px;font-weight:bold;letter-spacing:0.5px;">
              Tulsiramji Gaikwad Patil College of Pharmacy, Nagpur
            </p>
          </div>
        `
      };
    } else if (action === 'sendAdminPaymentNotification') {
      const { studentName, purpose, amount } = payload;
      const adminEmail = "contact@tgpcopcouncil.online";
      emailBody = {
        sender: { name: "TGPCOP Alert System", email: "contact@tgpcopcouncil.online" },
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
            <a href="https://tgpcopcouncil.online/admin/payments"
              style="background:#C84B0E;color:white;padding:12px 24px;
              border-radius:8px;text-decoration:none;display:block;text-align:center;
              margin-top:30px;font-weight:bold;font-size:14px;">
              View Admin Payments Ledger →
            </a>
          </div>
        `
      };
    } else {
      return res.status(400).json({ error: 'Unknown email dispatch action.' });
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo API Server Failure:', errorText);
      return res.status(response.status).json({ error: 'Failed to send email via Brevo.', details: errorText });
    }

    return res.status(200).json({ success: true, message: 'Email dispatched successfully.' });
  } catch (err) {
    console.error('Serverless Exception:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
