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
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendQuestionEmail',
        payload: {
          studentName,
          studentYear,
          directedTo,
          questionText,
          memberEmail,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serverless dispatch failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Failed to send email via serverless endpoint:", error);
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
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendAdminNotification',
        payload: {
          subject,
          title,
          bodyHtml,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serverless dispatch failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Failed to send admin alert via serverless endpoint:", error);
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
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendQuestionReplyEmail',
        payload: {
          studentName,
          studentEmail,
          questionText,
          replyText,
          directedTo,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serverless dispatch failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Failed to send reply email via serverless endpoint:", error);
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
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendPaymentReceiptEmail',
        payload: {
          studentName,
          studentEmail,
          studentYear,
          purpose,
          amount,
          paymentId,
          formattedDate,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serverless dispatch failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Failed to send receipt email via serverless endpoint:", error);
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
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendAdminPaymentNotification',
        payload: {
          studentName,
          purpose,
          amount,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serverless dispatch failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Failed to send admin payment notification via serverless endpoint:", error);
  }
}

export default sendQuestionEmail;
