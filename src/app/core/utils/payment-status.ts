/** Values booking-service / payment-service may expose after successful capture. */
const SUCCESSFUL = new Set(['SUCCESS', 'PAID', 'COMPLETED', 'VERIFIED']);

export function isSuccessfulPaymentStatus(status: string | null | undefined): boolean {
  if (status == null || String(status).trim() === '') {
    return false;
  }
  return SUCCESSFUL.has(String(status).trim().toUpperCase());
}
