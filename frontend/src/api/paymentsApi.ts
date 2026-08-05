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

  // campaignId is required only for the per-campaign 'campaign-pass' product.
  createCheckout(packageId: string, campaignId?: string) {
    return apiClient.post<{ success: boolean; checkoutUrl: string; sessionId: string }>(
      '/payments/create-checkout',
      { packageId, ...(campaignId ? { campaignId } : {}) }
    );
  },

  verifySession(sessionId: string) {
    return apiClient.get<{
      success: boolean;
      paid: boolean;
      paymentStatus: string;
      balance: number;
      packageId: string | null;
      campaignId: string | null;
      isCampaignPass: boolean;
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

  cancelSubscription(target: 'base' | 'rankingAddon' | 'sourcingAddon' = 'base') {
    return apiClient.post<{ success: boolean; message: string; cancelAtPeriodEnd: boolean }>(
      '/payments/cancel-subscription',
      { target }
    );
  },

  resumeSubscription(target: 'base' | 'rankingAddon' | 'sourcingAddon' = 'base') {
    return apiClient.post<{ success: boolean; message: string; cancelAtPeriodEnd: boolean }>(
      '/payments/resume-subscription',
      { target }
    );
  },
};

