import jsPDF from 'jspdf';
import { supabase } from './supabase';

export interface ReceiptData {
  paymentId: string;
  orderId?: string;
  studentName: string;
  studentEmail: string;
  studentYear: string;
  purpose: string;
  amount: number;
  status: string;
  date: string;
}

/** Generate a styled PDF receipt and return it as a Blob */
export function generateReceiptPdf(data: ReceiptData): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();

  // ── Background ──────────────────────────────────────────────────────────
  doc.setFillColor(5, 11, 24);        // #050B18 dark navy
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');

  // ── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(200, 75, 14);      // orange-burnt
  doc.roundedRect(8, 8, W - 16, 28, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TGPCOP STUDENT COUNCIL', W / 2, 18, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Tulsiramji Gaikwad Patil College of Pharmacy', W / 2, 24, { align: 'center' });
  doc.text('Official Payment Receipt', W / 2, 30, { align: 'center' });

  // ── Status badge ─────────────────────────────────────────────────────────
  const isPaid = data.status === 'completed';
  doc.setFillColor(isPaid ? 34 : 239, isPaid ? 197 : 68, isPaid ? 94 : 68);
  doc.roundedRect(W / 2 - 18, 39, 36, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(isPaid ? '✓  PAYMENT SUCCESSFUL' : '✕  PAYMENT FAILED', W / 2, 44.5, { align: 'center' });

  // ── Details section ─────────────────────────────────────────────────────
  const rows: [string, string][] = [
    ['Student Name',  data.studentName],
    ['Email',         data.studentEmail],
    ['Year / Branch', data.studentYear],
    ['Purpose',       data.purpose],
    ['Date & Time',   data.date],
    ['Payment ID',    data.paymentId],
    ['Order ID',      data.orderId || 'N/A'],
  ];

  let y = 58;
  const labelX = 12;
  const valueX = 70;

  rows.forEach(([label, value], i) => {
    // Alternate row background
    if (i % 2 === 0) {
      doc.setFillColor(13, 27, 62, 0.5);
      doc.rect(8, y - 4.5, W - 16, 8, 'F');
    }
    doc.setTextColor(150, 160, 190);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(label, labelX, y);

    doc.setTextColor(240, 245, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    // Wrap long values
    const lines = doc.splitTextToSize(value, W - valueX - 10);
    doc.text(lines, valueX, y);
    y += 9;
  });

  // ── Amount row ────────────────────────────────────────────────────────────
  y += 3;
  doc.setFillColor(200, 75, 14, 0.15);
  doc.roundedRect(8, y - 5, W - 16, 14, 2, 2, 'F');
  doc.setDrawColor(200, 75, 14);
  doc.roundedRect(8, y - 5, W - 16, 14, 2, 2, 'S');

  doc.setTextColor(200, 75, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('AMOUNT PAID', labelX + 2, y + 2);

  doc.setFontSize(14);
  doc.text(`\u20B9${data.amount}`, W - 14, y + 3, { align: 'right' });

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setTextColor(80, 90, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('This is a system-generated receipt. No signature required.', W / 2, footerY, { align: 'center' });
  doc.text('tgpcopcouncil.online  •  Powered by Cashfree Payments', W / 2, footerY + 4, { align: 'center' });

  return doc.output('blob');
}

/** Upload receipt PDF to Supabase Storage and return the signed URL */
export async function uploadAndGetReceiptUrl(
  paymentId: string,
  blob: Blob
): Promise<string | null> {
  try {
    const fileName = `receipt_${paymentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const filePath = `payments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Receipt upload error:', uploadError);
      return null;
    }

    // Create a signed URL valid for 10 years (max)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('receipts')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

    if (signedError || !signedData?.signedUrl) {
      console.error('Signed URL error:', signedError);
      return null;
    }

    return signedData.signedUrl;
  } catch (err) {
    console.error('Receipt upload exception:', err);
    return null;
  }
}

/** Generate, upload, and return the receipt URL. Also triggers browser download. */
export async function generateUploadAndDownloadReceipt(
  data: ReceiptData,
  triggerDownload = false
): Promise<string | null> {
  const blob = generateReceiptPdf(data);

  if (triggerDownload) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TGPCOP_Receipt_${data.paymentId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const receiptUrl = await uploadAndGetReceiptUrl(data.paymentId, blob);
  return receiptUrl;
}
