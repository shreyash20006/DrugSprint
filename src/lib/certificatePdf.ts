import jsPDF from 'jspdf';

export interface CertificateData {
  studentName: string;
  eventName: string;
  registrationId: string;
  date: string;
  year?: string;
  college?: string;
}

const C = {
  navy: [13, 27, 62] as [number, number, number],
  orange: [230, 81, 0] as [number, number, number],
  gold: [255, 179, 56] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  text: [220, 228, 245] as [number, number, number],
};

function drawCertificatePage(doc: jsPDF, cert: CertificateData): void {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, H, 'F');

  doc.setDrawColor(...C.orange);
  doc.setLineWidth(1.2);
  doc.rect(12, 12, W - 24, H - 24);
  doc.setLineWidth(0.4);
  doc.rect(16, 16, W - 32, H - 32);

  doc.setFillColor(...C.orange);
  doc.rect(12, 12, W - 24, 3, 'F');

  doc.setTextColor(...C.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TGPCOP STUDENT COUNCIL', W / 2, 38, { align: 'center' });

  doc.setTextColor(...C.white);
  doc.setFontSize(28);
  doc.text('Certificate of Participation', W / 2, 58, { align: 'center' });

  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.5);
  doc.line(W * 0.25, 66, W * 0.75, 66);

  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('This is to certify that', W / 2, 82, { align: 'center' });

  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(cert.studentName, W / 2, 98, { align: 'center' });

  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const yearLine = cert.year ? ` (${cert.year})` : '';
  doc.text(`has successfully participated in${yearLine}`, W / 2, 112, { align: 'center' });

  doc.setTextColor(...C.orange);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const eventLines = doc.splitTextToSize(cert.eventName, W - 60);
  doc.text(eventLines, W / 2, 128, { align: 'center' });

  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Registration ID: ${cert.registrationId}`, W / 2, 150, { align: 'center' });
  if (cert.college) {
    doc.text(cert.college, W / 2, 158, { align: 'center' });
  }
  doc.text(`Date: ${cert.date}`, W / 2, 168, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(120, 130, 160);
  doc.text('Issued only to verified attendees (checked in at event entry)', W / 2, H - 28, { align: 'center' });
  doc.text('tgpcopcouncil.online', W / 2, H - 22, { align: 'center' });
}

/** Generate a single participation certificate PDF */
export function generateCertificatePdf(cert: CertificateData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  drawCertificatePage(doc, cert);
  const safeName = cert.studentName.replace(/[^\w\-]+/g, '_').slice(0, 30);
  doc.save(`TGPCOP_Certificate_${safeName}.pdf`);
}

/** Generate bulk certificates (one page per checked-in student) */
export function generateBulkCertificatesPdf(certs: CertificateData[], eventName: string): void {
  if (certs.length === 0) return;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  certs.forEach((cert, i) => {
    if (i > 0) doc.addPage();
    drawCertificatePage(doc, cert);
  });
  const safeEvent = eventName.replace(/[^\w\-]+/g, '_').slice(0, 30);
  doc.save(`TGPCOP_Certificates_${safeEvent}_${new Date().toISOString().split('T')[0]}.pdf`);
}
