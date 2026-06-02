import { apiClient } from './client';

export type EmailProvider = 'GMAIL' | 'RESEND';

export interface EmailSettings {
  provider: EmailProvider | null;
  fromAddress: string | null;
  fromName: string | null;
  gmailConfigured: boolean;
  resendConfigured: boolean;
  verifiedAt: string | null;
  canSend: boolean;
}

export const emailSettingsApi = {
  get() {
    return apiClient.get<{ success: boolean; settings: EmailSettings }>('/email-settings');
  },

  update(input: {
    provider: EmailProvider;
    fromAddress: string;
    fromName?: string;
    gmailAppPassword?: string;
    resendApiKey?: string;
  }) {
    return apiClient.put<{ success: boolean }>('/email-settings', input);
  },

  test(to?: string) {
    return apiClient.post<{ success: boolean; messageId?: string; sentTo: string }>(
      '/email-settings/test',
      to ? { to } : {}
    );
  },

  clear() {
    return apiClient.delete<{ success: boolean }>('/email-settings');
  },
};
