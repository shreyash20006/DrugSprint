/**
 * ════════════════════════════════════════════════════════════════════
 *   TGPCOP STUDENT COUNCIL — PREMIUM PDF RECEIPT GENERATOR
 *   v2.0 — Institutional grade, modular, official-feel
 * ════════════════════════════════════════════════════════════════════
 *
 * Design rationale:
 *   • Asymmetric header: logo-left, identity-right (institutional banking look)
 *   • Vertical orange accent stripe (a luxury statement / brochure feel)
 *   • Modular 2-column grid for details (cleaner than alternating rows)
 *   • Faux-shadows via layered rects with offset + lighter shade
 *   • Watermark for authenticity feel
 *   • Reference-number style: TGPCOP/SC/YYYY-YY/000123
 *   • QR code for receipt verification (links to signed URL)
 *   • Triple horizontal rule under header (used in formal docs)
 *
 * Why these choices?
 *   jspdf has NO real shadows or gradients, so we simulate depth via:
 *     1. Layered rectangles (one darker behind, slightly offset = shadow)
 *     2. Thin tinted bands (creates "depth-strata" effect)
 *     3. Strategic use of 3 navy shades + 2 orange shades
 *
 *   Typography hierarchy uses size-delta rather than font-family
 *   (jspdf only has helvetica/times/courier reliably).
 *   We use Courier for codes (banking/ledger feel) and Helvetica for labels.
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { supabase } from './supabase';

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

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
  /** Optional: verification URL embedded in QR code. Falls back to portal URL. */
  verificationUrl?: string;
  /** Optional: receipt sequence number (auto-generated if absent) */
  receiptNumber?: string;
}

// ════════════════════════════════════════════════════════════════
//  COLOR PALETTE (5 navy shades, 3 orange shades, 2 semantic)
// ════════════════════════════════════════════════════════════════

const C = {
  // Navy ramp (dark → light)
  navyBlack:   [3,  7,  16]   as const,  // #030710  — deepest background
  navyBase:    [5,  11, 24]   as const,  // #050B18  — primary bg
  navyMid:     [13, 27, 62]   as const,  // #0D1B3E  — card surfaces
  navyLight:   [20, 43, 92]   as const,  // #142B5C  — hover/depth
  navyAccent:  [28, 56, 120]  as const,  // #1C3878  — borders
  // Orange ramp
  orangeDark:  [168, 64, 12]  as const,  // #A8400C  — pressed
  orangeBase:  [200, 75, 14]  as const,  // #C84B0E  — primary
  orangeLight: [232, 110, 50] as const,  // #E86E32  — highlights
  goldAccent:  [255, 179, 56] as const,  // #FFB338  — premium accent
  // Text ramp
  white:       [255, 255, 255] as const,
  textPrimary: [240, 245, 255] as const,
  textSecondary:[170, 180, 210] as const,
  textMuted:   [110, 120, 150]  as const,
  textDim:     [70,  80,  110]  as const,
  // Semantic
  success:     [34, 197, 94]   as const,
  danger:      [239, 68, 68]   as const,
};

// ════════════════════════════════════════════════════════════════
//  LOGO LOADER — converts Cloudinary URL → base64 (cached)
// ════════════════════════════════════════════════════════════════

const LOGO_URL =
  'https://res.cloudinary.com/dsqxboxoc/image/upload/q_auto/f_auto/v1779522116/WhatsApp_Image_2026-05-23_at_1.10.29_PM_susb5a.jpg';

let cachedLogoBase64: string | null = null;

/**
 * Fetches the logo image and converts it to a base64 data URL.
 * Caches result in memory so we only do this once per session.
 *
 * HOW TO USE WITH JSPDF:
 *   const logo = await loadLogoBase64();
 *   doc.addImage(logo, 'JPEG', x, y, width, height);
 *
 * Note: jspdf supports 'JPEG', 'PNG', 'WEBP'. Always specify format.
 * For best print quality, use a 2x resolution source image.
 */
async function loadLogoBase64(url = LOGO_URL): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    cachedLogoBase64 = dataUrl;
    return dataUrl;
  } catch (err) {
    console.warn('Logo fetch failed, falling back to text only:', err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════

/** Generate institutional reference number: TGPCOP/SC/2025-26/A1B2C3 */
function generateReferenceNumber(paymentId: string): string {
  const now = new Date();
  const yr = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const acad = `${yr}-${String(yr + 1).slice(2)}`;
  const short = paymentId.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase().padStart(6, '0');
  return `TGPCOP/SC/${acad}/${short}`;
}

/** Set fill color from palette tuple */
function fill(doc: jsPDF, c: readonly number[]) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function stroke(doc: jsPDF, c: readonly number[]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}
function text(doc: jsPDF, c: readonly number[]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

/**
 * Draw a faux-shadow rectangle.
 * Layers a slightly larger/offset darker rect behind the main one,
 * creating a "depth" illusion without actual gradients.
 */
function shadowRect(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  radius: number,
  fillColor: readonly number[],
  shadowColor: readonly number[] = C.navyBlack,
) {
  fill(doc, shadowColor);
  doc.roundedRect(x + 0.4, y + 0.6, w, h, radius, radius, 'F');
  fill(doc, fillColor);
  doc.roundedRect(x, y, w, h, radius, radius, 'F');
}

/**
 * Generate QR code as base64 PNG data URL.
 * Uses 'qrcode' npm package — install with: yarn add qrcode @types/qrcode
 */
async function generateQRCode(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 256,
    margin: 0,
    color: {
      dark: '#050B18',
      light: '#FFFFFF00', // transparent so the dark bg of receipt shows through
    },
    errorCorrectionLevel: 'M',
  });
}

// ════════════════════════════════════════════════════════════════
//  MAIN GENERATOR
// ════════════════════════════════════════════════════════════════

export async function generateReceiptPdf(data: ReceiptData): Promise<Blob> {
  // A5 portrait = 148 × 210 mm — receipt-appropriate, prints cleanly on A4
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ───────────────────────────────────────────────────────────────
  //  LAYER 1 — BACKGROUND CANVAS
  // ───────────────────────────────────────────────────────────────
  fill(doc, C.navyBase);
  doc.rect(0, 0, W, H, 'F');

  // Subtle "depth-strata" — 3 thin bands at top for an institutional letterhead feel
  fill(doc, C.navyMid);
  doc.rect(0, 0, W, 0.6, 'F');
  fill(doc, C.orangeBase);
  doc.rect(0, 0.6, W, 0.3, 'F');
  fill(doc, C.goldAccent);
  doc.rect(0, 0.9, W, 0.15, 'F');

  // ───────────────────────────────────────────────────────────────
  //  LAYER 2 — DOCUMENT FRAME (subtle hairline border)
  // ───────────────────────────────────────────────────────────────
  stroke(doc, C.navyAccent);
  doc.setLineWidth(0.25);
  doc.roundedRect(4, 4, W - 8, H - 8, 2, 2, 'S');

  // Vertical orange accent stripe (left edge — luxury brochure detail)
  fill(doc, C.orangeBase);
  doc.rect(4, 4, 1.5, H - 8, 'F');

  // ───────────────────────────────────────────────────────────────
  //  LAYER 3 — WATERMARK ("CONFIDENTIAL" rotated, very low opacity)
  // ───────────────────────────────────────────────────────────────
  // @ts-expect-error — setGState exists at runtime
  doc.setGState(new doc.GState({ opacity: 0.04 }));
  text(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.text('TGPCOP', W / 2, H / 2 + 30, { align: 'center', angle: -30 });
  // @ts-expect-error
  doc.setGState(new doc.GState({ opacity: 1 }));

  // ───────────────────────────────────────────────────────────────
  //  LAYER 4 — HEADER (asymmetric: logo-left, identity-right)
  // ───────────────────────────────────────────────────────────────
  const headerY = 10;
  const headerH = 26;

  // Header surface with shadow
  shadowRect(doc, 9, headerY, W - 18, headerH, 2, C.navyMid);

  /*
   * ── LOGO PLACEHOLDER ──────────────────────────────────────────
   * Call await loadLogoBase64() BEFORE this function and pass the
   * result. The helper is invoked at the top of generateReceiptPdf
   * via the async wrapper below.
   *
   * doc.addImage(logoBase64, 'JPEG', x, y, width, height);
   * For best print quality: source image >= 240x240 px.
   * ─────────────────────────────────────────────────────────────
   */
  const logoBase64 = await loadLogoBase64();
  if (logoBase64) {
    // Subtle "frame" behind logo
    fill(doc, C.navyBase);
    doc.roundedRect(12, headerY + 3, 20, 20, 1.5, 1.5, 'F');
    try {
      doc.addImage(logoBase64, 'JPEG', 13, headerY + 4, 18, 18);
    } catch {
      // Fallback monogram if image fails
      fill(doc, C.orangeBase);
      doc.roundedRect(13, headerY + 4, 18, 18, 1.5, 1.5, 'F');
      text(doc, C.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('SC', 22, headerY + 16, { align: 'center' });
    }
  }

  // Identity block (right of logo)
  text(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TGPCOP STUDENT COUNCIL', 36, headerY + 9);

  text(doc, C.textSecondary);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Tulsiramji Gaikwad-Patil College of Pharmacy', 36, headerY + 13.5);
  doc.text('Mohgaon, Wardha Road, Nagpur — 441108', 36, headerY + 17);

  // Top-right meta block (date + reference number)
  text(doc, C.goldAccent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setCharSpace(0.4);
  doc.text('OFFICIAL  PAYMENT  RECEIPT', W - 12, headerY + 9, { align: 'right' });
  doc.setCharSpace(0);

  text(doc, C.textSecondary);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  const refNum = data.receiptNumber || generateReferenceNumber(data.paymentId);
  doc.text(refNum, W - 12, headerY + 13.5, { align: 'right' });

  text(doc, C.textMuted);
  doc.setFontSize(5.5);
  doc.text(new Date().toISOString().slice(0, 10), W - 12, headerY + 17, { align: 'right' });

  // Triple-rule under header (institutional flourish)
  const ruleY = headerY + headerH + 2;
  stroke(doc, C.orangeBase);
  doc.setLineWidth(0.5);
  doc.line(8, ruleY, W - 8, ruleY);
  stroke(doc, C.navyLight);
  doc.setLineWidth(0.2);
  doc.line(8, ruleY + 0.9, W - 8, ruleY + 0.9);
  doc.line(8, ruleY + 1.5, W - 8, ruleY + 1.5);

  // ───────────────────────────────────────────────────────────────
  //  LAYER 5 — STATUS BADGE (centered, prominent)
  // ───────────────────────────────────────────────────────────────
  const isPaid = data.status === 'completed';
  const badgeColor = isPaid ? C.success : C.danger;
  const badgeText = isPaid ? 'PAYMENT  SUCCESSFUL' : 'PAYMENT  FAILED';
  const badgeY = ruleY + 6;

  // Outer glow ring (faux shadow)
  fill(doc, badgeColor);
  // @ts-expect-error
  doc.setGState(new doc.GState({ opacity: 0.15 }));
  doc.roundedRect(W / 2 - 28, badgeY - 1, 56, 10, 5, 5, 'F');
  // @ts-expect-error
  doc.setGState(new doc.GState({ opacity: 1 }));

  fill(doc, badgeColor);
  doc.roundedRect(W / 2 - 25, badgeY, 50, 8, 4, 4, 'F');
  text(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setCharSpace(0.6);
  doc.text(badgeText, W / 2, badgeY + 5.2, { align: 'center' });
  doc.setCharSpace(0);

  // ───────────────────────────────────────────────────────────────
  //  LAYER 6 — DETAILS GRID (2-column modular layout)
  // ───────────────────────────────────────────────────────────────
  /*
   * Why a 2-column grid instead of alternating rows?
   *   • Better information density (more data, less scrolling)
   *   • Looks like a bank statement / official document
   *   • Visual rhythm: short keys + values can pair, long ones span
   */
  const gridY = badgeY + 16;
  const gridH = 64;
  const gridX = 9;
  const gridW = W - 18;

  // Grid container with depth
  shadowRect(doc, gridX, gridY, gridW, gridH, 2, C.navyMid);

  // Section label
  text(doc, C.goldAccent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setCharSpace(0.4);
  doc.text('TRANSACTION  DETAILS', gridX + 4, gridY + 5.5);
  doc.setCharSpace(0);

  // Underline accent
  fill(doc, C.goldAccent);
  doc.rect(gridX + 4, gridY + 6.5, 12, 0.3, 'F');

  type GridItem = { label: string; value: string; full?: boolean; mono?: boolean };
  const items: GridItem[] = [
    { label: 'STUDENT NAME', value: data.studentName },
    { label: 'YEAR / BRANCH', value: data.studentYear },
    { label: 'EMAIL ADDRESS', value: data.studentEmail, full: true },
    { label: 'PURPOSE', value: data.purpose, full: true },
    { label: 'DATE & TIME', value: data.date },
    { label: 'PAYMENT MODE', value: 'Cashfree · UPI/Card' },
    { label: 'PAYMENT ID', value: data.paymentId, mono: true, full: true },
    { label: 'ORDER ID', value: data.orderId || '—', mono: true, full: true },
  ];

  let rowY = gridY + 11;
  const colW = (gridW - 8) / 2;
  let col = 0; // 0 = left, 1 = right

  items.forEach((item) => {
    const cellW = item.full ? gridW - 8 : colW;
    const cellX = gridX + 4 + (col === 1 && !item.full ? colW : 0);

    // Subtle separator dot before label
    fill(doc, C.orangeBase);
    doc.circle(cellX, rowY, 0.4, 'F');

    // Label
    text(doc, C.textMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setCharSpace(0.3);
    doc.text(item.label, cellX + 1.5, rowY + 0.5);
    doc.setCharSpace(0);

    // Value
    text(doc, C.textPrimary);
    doc.setFont(item.mono ? 'courier' : 'helvetica', 'bold');
    doc.setFontSize(item.mono ? 6.5 : 7.5);
    const wrappedLines = doc.splitTextToSize(item.value, cellW - 2);
    doc.text(wrappedLines, cellX + 1.5, rowY + 4.2);

    // Advance row / column
    if (item.full) {
      rowY += 6.5 + (wrappedLines.length - 1) * 2.5;
      col = 0;
    } else if (col === 0) {
      col = 1;
    } else {
      rowY += 7;
      col = 0;
    }
  });

  // ───────────────────────────────────────────────────────────────
  //  LAYER 7 — AMOUNT BLOCK (Hero number)
  // ───────────────────────────────────────────────────────────────
  const amtY = gridY + gridH + 6;
  const amtH = 18;

  // Premium gradient simulation: 2 layered rects
  fill(doc, C.orangeDark);
  doc.roundedRect(9, amtY, W - 18, amtH, 2, 2, 'F');
  fill(doc, C.orangeBase);
  doc.roundedRect(9, amtY, W - 18, amtH - 1.5, 2, 2, 'F');

  // Inner darker stripe for "highlight" effect (faux gradient)
  fill(doc, C.orangeLight);
  doc.roundedRect(9, amtY, W - 18, 2.5, 2, 2, 'F');

  // Label
  text(doc, C.white);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setCharSpace(0.5);
  doc.text('AMOUNT  PAID  (INR)', 13, amtY + 7);
  doc.setCharSpace(0);

  // Big amount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`\u20B9 ${data.amount.toLocaleString('en-IN')}`, W - 13, amtY + 13, { align: 'right' });

  // Sub-text (amount in words)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text(`Inclusive of all charges · Non-refundable`, 13, amtY + 12);

  // ───────────────────────────────────────────────────────────────
  //  LAYER 8 — VERIFICATION BLOCK (QR code + signature area)
  // ───────────────────────────────────────────────────────────────
  /*
   * QR CODE ENCODES: verificationUrl (signed receipt URL) or fallback portal link.
   * Scanning verifies receipt authenticity against your backend.
   */
  const verifyY = amtY + amtH + 6;
  const verifyH = 28;

  shadowRect(doc, 9, verifyY, W - 18, verifyH, 2, C.navyMid);

  // QR Code (left side)
  const qrPayload = data.verificationUrl || `https://tgpcopcouncil.online/verify/${data.paymentId}`;
  try {
    const qrDataUrl = await generateQRCode(qrPayload);
    // White card backing for QR (improves scannability)
    fill(doc, C.white);
    doc.roundedRect(12, verifyY + 3, 22, 22, 1, 1, 'F');
    doc.addImage(qrDataUrl, 'PNG', 13, verifyY + 4, 20, 20);
  } catch {
    // Fallback: dotted box placeholder
    stroke(doc, C.textMuted);
    doc.setLineDashPattern([1, 1], 0);
    doc.roundedRect(12, verifyY + 3, 22, 22, 1, 1, 'S');
    doc.setLineDashPattern([], 0);
    text(doc, C.textMuted);
    doc.setFontSize(5);
    doc.text('QR', 23, verifyY + 15, { align: 'center' });
  }

  // QR label
  text(doc, C.textMuted);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setCharSpace(0.3);
  doc.text('SCAN TO VERIFY', 23, verifyY + 27, { align: 'center' });
  doc.setCharSpace(0);

  // Verification text (center)
  text(doc, C.textSecondary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setCharSpace(0.4);
  doc.text('AUTHENTICITY  GUARANTEED', 40, verifyY + 7);
  doc.setCharSpace(0);

  text(doc, C.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  const note = doc.splitTextToSize(
    'This is a system-generated digital receipt issued by the TGPCOP Student Council Treasury. The QR code links to a tamper-evident verification record stored securely on our portal.',
    W - 65,
  );
  doc.text(note, 40, verifyY + 11);

  // Signature stamp area (right)
  stroke(doc, C.navyAccent);
  doc.setLineWidth(0.2);
  doc.roundedRect(W - 30, verifyY + 4, 19, 20, 1, 1, 'S');

  text(doc, C.goldAccent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setCharSpace(0.4);
  doc.text('OFFICIAL', W - 20.5, verifyY + 11, { align: 'center' });
  doc.text('SEAL', W - 20.5, verifyY + 14, { align: 'center' });
  doc.setCharSpace(0);
  text(doc, C.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4);
  doc.text('Digital · No physical', W - 20.5, verifyY + 19, { align: 'center' });
  doc.text('signature required', W - 20.5, verifyY + 21.5, { align: 'center' });

  // ───────────────────────────────────────────────────────────────
  //  LAYER 9 — FOOTER (perforation-style dotted line + meta)
  // ───────────────────────────────────────────────────────────────
  const footerY = H - 14;

  // Decorative perforation line
  stroke(doc, C.navyAccent);
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(10, footerY - 3, W - 10, footerY - 3);
  doc.setLineDashPattern([], 0);

  text(doc, C.textMuted);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setCharSpace(0.3);
  doc.text('TGPCOPCOUNCIL.ONLINE', W / 2, footerY, { align: 'center' });
  doc.setCharSpace(0);

  text(doc, C.textDim);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.text(
    'Issued under the authority of the Student Council Treasury  ·  Powered by Cashfree Payments',
    W / 2, footerY + 3, { align: 'center' },
  );
  doc.text(
    `© ${new Date().getFullYear()} TGPCOP Student Council  ·  All rights reserved`,
    W / 2, footerY + 5.5, { align: 'center' },
  );

  return doc.output('blob');
}

// ════════════════════════════════════════════════════════════════
//  UPLOAD + DOWNLOAD HELPERS (unchanged from v1)
// ════════════════════════════════════════════════════════════════

export async function uploadAndGetReceiptUrl(
  paymentId: string,
  blob: Blob,
): Promise<string | null> {
  try {
    const fileName = `receipt_${paymentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const filePath = `payments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, blob, { contentType: 'application/pdf', upsert: true });

    if (uploadError) {
      console.error('Receipt upload error:', uploadError);
      return null;
    }

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

export async function generateUploadAndDownloadReceipt(
  data: ReceiptData,
  triggerDownload = false,
): Promise<string | null> {
  const blob = await generateReceiptPdf(data);

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
