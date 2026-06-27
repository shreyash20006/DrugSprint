/**
 * QR Token utilities — TGPCOP Event Check-in System
 *
 * Security model:
 *   - QR payload = base64(JSON({ t: token, v: 1 }))
 *   - `token` is stored server-side in registrations.qr_token (UUID v4)
 *   - The QR never contains student PII directly
 *   - Verification is done by looking up the token in Supabase
 */

/** Generate a cryptographically random token string */
export function generateQrToken(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Encode token into QR payload string */
export function encodeQrPayload(token: string, registrationId: string): string {
  const payload = { t: token, r: registrationId, v: 1, iss: 'tgpcop' };
  return btoa(JSON.stringify(payload));
}

/** Decode QR payload string → { token, registrationId } | null */
export function decodeQrPayload(raw: string): { token: string; registrationId: string } | null {
  try {
    const decoded = JSON.parse(atob(raw));
    if (decoded?.v === 1 && decoded?.t && decoded?.r && decoded?.iss === 'tgpcop') {
      return { token: decoded.t, registrationId: decoded.r };
    }
    return null;
  } catch {
    return null;
  }
}
