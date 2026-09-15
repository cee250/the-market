const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface PaymentPackage { id: string; name: string; description: string | null; price: number; currency: string; productLimit: number; durationDays: number }
export interface VendorPayment { id: string; vendorName?: string; vendorEmail?: string; businessName?: string; vendorStatus?: string; packageName?: string; packageId: string; amount: number; currency: string; paymentMethod: string; reference?: string; notes?: string; status: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'; submittedAt: string; reviewedAt?: string; reviewerName?: string; reviewNote?: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string | string[] } | null; const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message; throw new Error(message || 'The request could not be completed'); }
  return response.json() as Promise<T>;
}

export const paymentsApi = {
  packages: () => request<PaymentPackage[]>('/payments/packages'),
  submit: (input: { packageId: string; paymentMethod: string; reference?: string; notes?: string }) => request<VendorPayment>('/payments/vendor', { method: 'POST', body: JSON.stringify(input) }),
  mine: () => request<VendorPayment[]>('/payments/vendor'),
  adminList: () => request<VendorPayment[]>('/payments/admin'),
  review: (id: string, decision: 'VERIFIED' | 'REJECTED', reviewNote?: string) => request<VendorPayment>(`/payments/admin/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, reviewNote }) }),
};
