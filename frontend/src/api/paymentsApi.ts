import { apiClient } from './client';

export type PackageKind = 'subscription' | 'one_time';

export interface CreditPackageDto {
  id: string;
  name: string;
  label: string;
  kind: PackageKind;
  credits: number;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year' | null;
}

export interface SubscriptionState {
  status: string | null;
  plan: string | null;
  currentPeriodEnd: string | null;
  active: boolean;
}

export type CreditTransactionType =
  | 'SUBSCRIPTION_GRANT'
  | 'TOPUP_PURCHASE'
  | 'SPEND'
  | 'ADMIN_GRANT'
  | 'REFUND';

export interface CreditTransaction {
  id: string;
  type: CreditTransactionType;
  status: string;
  credits: number; // signed
  amountCents: number;
  currency: string;
  reason: string | null;
  balanceAfter: number | null;
  packageId: string | null;
  createdAt: string;
}

export const paymentsApi = {
  packages() {
    return apiClient.get<{
      success: boolean;
      stripeEnabled: boolean;
      publishableKey: string | null;
      packages: CreditPackageDto[];
    }>('/payments/packages');
  },

  balance() {
    return apiClient.get<{
      success: boolean;
      balance: number;
      subscription: SubscriptionState;
      hasCustomer: boolean;
    }>('/payments/balance');
  },

  createCheckout(packageId: string) {
    return apiClient.post<{ success: boolean; checkoutUrl: string; sessionId: string }>(
      '/payments/create-checkout',
      { packageId }
    );
  },

  verifySession(sessionId: string) {
    return apiClient.get<{
      success: boolean;
      paid: boolean;
      paymentStatus: string;
      balance: number;
    }>(`/payments/verify-session?session_id=${encodeURIComponent(sessionId)}`);
  },

  history() {
    return apiClient.get<{ success: boolean; transactions: CreditTransaction[] }>(
      '/payments/history'
    );
  },

  createPortalSession() {
    return apiClient.post<{ success: boolean; url: string }>(
      '/payments/create-portal-session',
      {}
    );
  },
};
