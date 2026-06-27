import { supabase } from './supabase';
import { decodeQrPayload } from './qrToken';

export type CheckInStatus = 'success' | 'already_checked_in' | 'invalid' | 'error';

export interface CheckInRegistration {
  id: string;
  registration_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  college: string | null;
  branch: string | null;
  year: string | null;
  prn: string | null;
  payment_status: string;
  amount_paid: number | null;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_by: string | null;
  checked_by_name: string | null;
  manual_check_in: boolean;
  service_id: string;
  service_name: string | null;
  service_category: string | null;
  avatar_url: string | null;
  certificate_issued_at: string | null;
}

export interface CheckInResult {
  status: CheckInStatus;
  message?: string;
  code?: string;
  registration?: CheckInRegistration;
}

function mapRpcResult(data: unknown): CheckInResult {
  const row = data as Record<string, unknown>;
  const status = (row.status as CheckInStatus) || 'error';
  return {
    status,
    message: row.message as string | undefined,
    code: row.code as string | undefined,
    registration: row.registration as CheckInRegistration | undefined,
  };
}

/** Parse raw QR string and call secure RPC to verify + check in */
export async function verifyAndCheckInQr(
  rawQr: string,
  serviceId?: string | null
): Promise<CheckInResult> {
  const parsed = decodeQrPayload(rawQr.trim());
  if (!parsed) {
    return { status: 'invalid', message: 'Invalid QR code format' };
  }

  const { data, error } = await supabase.rpc('verify_and_checkin_qr', {
    p_token: parsed.token,
    p_registration_id: parsed.registrationId,
    p_service_id: serviceId || null,
  });

  if (error) {
    return { status: 'error', message: error.message, code: error.code };
  }

  return mapRpcResult(data);
}

export async function resetCheckIn(registrationUuid: string): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc('reset_checkin', {
    p_registration_uuid: registrationUuid,
  });
  if (error) return { status: 'error', message: error.message };
  return mapRpcResult(data);
}

export async function manualCheckIn(registrationUuid: string): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc('manual_checkin', {
    p_registration_uuid: registrationUuid,
  });
  if (error) return { status: 'error', message: error.message };
  return mapRpcResult(data);
}

export async function bulkManualCheckIn(registrationUuids: string[]): Promise<{ updated: number; skipped: number; error?: string }> {
  const { data, error } = await supabase.rpc('bulk_manual_checkin', {
    p_registration_uuids: registrationUuids,
  });
  if (error) return { updated: 0, skipped: 0, error: error.message };
  const row = data as { updated?: number; skipped?: number };
  return { updated: row.updated ?? 0, skipped: row.skipped ?? 0 };
}

export async function markCertificateIssued(registrationUuid: string): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc('mark_certificate_issued', {
    p_registration_uuid: registrationUuid,
  });
  if (error) return { status: 'error', message: error.message };
  return mapRpcResult(data);
}

export interface AttendanceStats {
  total: number;
  checked_in: number;
  pending: number;
  revenue: number;
  attendance_pct: number;
}

export function computeAttendanceStats(regs: Array<{ checked_in?: boolean; payment_status?: string; amount_paid?: number | null }>): AttendanceStats {
  const paidRegs = regs.filter(r => r.payment_status === 'completed');
  const total = paidRegs.length;
  const checked_in = paidRegs.filter(r => r.checked_in).length;
  const pending = total - checked_in;
  const revenue = paidRegs.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0);
  const attendance_pct = total > 0 ? Math.round((checked_in / total) * 100) : 0;
  return { total, checked_in, pending, revenue, attendance_pct };
}

export interface LiveCheckIn {
  id: string;
  full_name: string;
  registration_id: string;
  checked_in_at: string;
  service_name?: string;
  manual_check_in?: boolean;
}
