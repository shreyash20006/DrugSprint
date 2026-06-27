import { downloadCsv } from './exportCsv';
import type { AttendanceRow } from './attendancePdf';

/** Excel-compatible CSV export with UTF-8 BOM */
export function downloadAttendanceExcel(
  rows: AttendanceRow[],
  serviceName: string,
  stats: { total: number; checked_in: number; pending: number; revenue: number }
): void {
  const headers = [
    'Sr.',
    'Registration ID',
    'Student Name',
    'Email',
    'Phone',
    'Year',
    'PRN',
    'College',
    'Branch',
    'Payment Status',
    'Amount Paid',
    'Checked In',
    'Check-in Time',
    'Manual Check-in',
  ];

  const dataRows = rows.map(r => [
    String(r.sr),
    r.registration_id,
    r.full_name,
    r.email || '',
    r.phone || '',
    r.year || '',
    r.prn || '',
    r.college || '',
    r.branch || '',
    r.payment_status === 'completed' ? 'PAID' : (r.payment_status?.toUpperCase() || ''),
    r.amount_paid != null ? String(r.amount_paid) : '0',
    r.checked_in ? 'YES' : 'NO',
    r.checked_in_at ? new Date(r.checked_in_at).toLocaleString('en-IN') : '',
    r.manual_check_in ? 'YES' : 'NO',
  ]);

  const summary = [
    [],
    ['Summary'],
    ['Total Registered', String(stats.total)],
    ['Checked In', String(stats.checked_in)],
    ['Pending', String(stats.pending)],
    ['Revenue (INR)', String(stats.revenue)],
    ['Attendance %', stats.total > 0 ? `${Math.round((stats.checked_in / stats.total) * 100)}%` : '0%'],
    ['Generated', new Date().toLocaleString('en-IN')],
    ['Event / Service', serviceName],
  ];

  const safeName = serviceName.replace(/[^\w\-]+/g, '_').slice(0, 40);
  const filename = `TGPCOP_Attendance_${safeName}_${new Date().toISOString().split('T')[0]}.csv`;

  const csvBody = [headers, ...dataRows, ...summary]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Bulk attendance export for all services combined */
export function downloadBulkAttendanceExcel(
  rows: Array<AttendanceRow & { service_name?: string; email?: string; phone?: string; branch?: string; amount_paid?: number | null; manual_check_in?: boolean }>
): void {
  const headers = [
    'Sr.', 'Service', 'Registration ID', 'Student Name', 'Email', 'Year', 'PRN',
    'College', 'Payment', 'Amount', 'Checked In', 'Check-in Time',
  ];
  const dataRows = rows.map(r => [
    String(r.sr),
    r.service_name || '',
    r.registration_id,
    r.full_name,
    r.email || '',
    r.year || '',
    r.prn || '',
    r.college || '',
    r.payment_status === 'completed' ? 'PAID' : (r.payment_status?.toUpperCase() || ''),
    r.amount_paid != null ? String(r.amount_paid) : '0',
    r.checked_in ? 'YES' : 'NO',
    r.checked_in_at ? new Date(r.checked_in_at).toLocaleString('en-IN') : '',
  ]);
  downloadCsv(`TGPCOP_Bulk_Attendance_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...dataRows]);
}
