import jsPDF from 'jspdf';

export interface AttendanceRow {
  sr: number;
  registration_id: string;
  full_name: string;
  year: string;
  prn: string;
  college: string;
  branch?: string;
  email?: string;
  phone?: string;
  amount_paid?: number | null;
  payment_status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  manual_check_in?: boolean;
  service_name?: string;
}

export function generateAttendancePdf(
  rows: AttendanceRow[],
  serviceName: string,
  stats: { total: number; checked_in: number; pending: number; revenue: number }
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(5, 11, 24);
  doc.rect(0, 0, W, H, 'F');

  // Header
  doc.setFillColor(13, 27, 62);
  doc.rect(0, 0, W, 30, 'F');
  doc.setFillColor(230, 81, 0);
  doc.rect(0, 28, W, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TGPCOP STUDENT COUNCIL', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 230);
  doc.text(`Attendance Report: ${serviceName}`, 14, 20);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 26);

  // Stats row
  const statsY = 40;
  const statBoxW = 55;
  const statBoxes = [
    { label: 'Total Registered', value: String(stats.total), color: [59, 130, 246] as [number, number, number] },
    { label: 'Checked In',       value: String(stats.checked_in), color: [34, 197, 94] as [number, number, number] },
    { label: 'Pending',          value: String(stats.pending), color: [234, 179, 8] as [number, number, number] },
    { label: 'Revenue',          value: `\u20B9${stats.revenue.toLocaleString('en-IN')}`, color: [230, 81, 0] as [number, number, number] },
  ];
  statBoxes.forEach((s, i) => {
    const x = 14 + i * (statBoxW + 5);
    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.roundedRect(x, statsY, statBoxW, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(s.value, x + statBoxW / 2, statsY + 11, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, x + statBoxW / 2, statsY + 16, { align: 'center' });
  });

  // Table header
  const tableY = statsY + 26;
  const cols = [
    { label: 'Sr.', w: 12, x: 14 },
    { label: 'Reg. ID', w: 38, x: 26 },
    { label: 'Student Name', w: 50, x: 64 },
    { label: 'Year', w: 30, x: 114 },
    { label: 'PRN', w: 30, x: 144 },
    { label: 'College', w: 50, x: 174 },
    { label: 'Payment', w: 22, x: 224 },
    { label: 'Check-in', w: 22, x: 246 },
    { label: 'Time', w: 35, x: 268 },
  ];

  doc.setFillColor(230, 81, 0);
  doc.rect(14, tableY, W - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  cols.forEach(c => doc.text(c.label, c.x + 2, tableY + 5.5));

  // Table rows
  let rowY = tableY + 8;
  rows.forEach((row, idx) => {
    if (rowY > H - 20) {
      doc.addPage();
      rowY = 20;
    }
    const bg = idx % 2 === 0 ? [10, 22, 40] : [13, 27, 62];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(14, rowY, W - 28, 7, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(200, 210, 230);

    const cells: [string, number][] = [
      [String(row.sr), cols[0].x],
      [row.registration_id, cols[1].x],
      [row.full_name, cols[2].x],
      [row.year || '—', cols[3].x],
      [row.prn || '—', cols[4].x],
      [row.college || '—', cols[5].x],
      [row.payment_status === 'completed' ? 'PAID' : row.payment_status?.toUpperCase() || '—', cols[6].x],
      [row.checked_in ? '✓ YES' : '✗ NO', cols[7].x],
      [row.checked_in_at ? new Date(row.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—', cols[8].x],
    ];

    cells.forEach(([text, x]) => {
      if (text === '✓ YES') doc.setTextColor(34, 197, 94);
      else if (text === '✗ NO') doc.setTextColor(239, 68, 68);
      else if (text === 'PAID') doc.setTextColor(34, 197, 94);
      else doc.setTextColor(200, 210, 230);
      doc.text(text, x + 2, rowY + 4.8);
    });

    rowY += 7;
  });

  // Footer
  const footerY = H - 8;
  doc.setTextColor(80, 90, 120);
  doc.setFontSize(6);
  doc.text('TGPCOP Student Council · tgpcopcouncil.online · System Generated Report', W / 2, footerY, { align: 'center' });

  doc.save(`TGPCOP_Attendance_${serviceName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
