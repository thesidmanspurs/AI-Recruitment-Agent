import { apiClient } from './client';
import type { UserRole } from '../hooks/useAuth';

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedReason: string | null;
  dailyLimitOverride: number | null;
  createdAt: string;
  lastLoginAt: string | null;
  campaignCount: number;
  candidateCount: number;
}

export interface AdminStats {
  userCount: number;
  campaignCount: number;
  candidateCount: number;
  outreachSent: number;
  activeUsers: number;
}

export interface AdminCampaignSummary {
  id: string;
  name: string;
  jobTitle: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  createdAt: string;
  candidateCount: number;
  activityCount: number;
}

export interface AdminActivityEntry {
  id: string;
  campaignId: string;
  type: 'INFO' | 'ENRICH' | 'OUTREACH' | 'REPLY' | 'ALERT' | 'SYSTEM';
  message: string;
  candidateName: string | null;
  timestamp: string;
}

export interface AdminUserBehavior {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    lastLoginAt: string | null;
  };
  campaigns: AdminCampaignSummary[];
  recentActivity: AdminActivityEntry[];
}

export interface AdminHotCampaign {
  id: string;
  name: string;
  jobTitle: string;
  status: AdminCampaignSummary['status'];
  createdAt: string;
  candidateCount: number;
  activityCount: number;
  owner: { id: string; name: string; email: string };
}

export interface AdminSystemEvent {
  id: string;
  type: AdminActivityEntry['type'];
  message: string;
  candidateName: string | null;
  timestamp: string;
  campaign: { id: string; name: string };
  owner: { id: string; name: string; email: string };
}

export interface FunnelStage {
  stage: 'SOURCED' | 'ENRICHED' | 'OUTREACH_SENT' | 'OPENED' | 'REPLIED' | 'NO_RESPONSE';
  count: number;
}

export interface PlatformBreakdownEntry {
  platform: 'LinkedIn' | 'Upwork' | 'Reddit';
  count: number;
}

export interface ScoreBucket {
  range: string;
  lo: number;
  hi: number;
  count: number;
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RecentSignup {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string | null;
}

function qs(page: number, pageSize: number): string {
  return `?page=${page}&pageSize=${pageSize}`;
}

export const adminApi = {
  listUsers(page = 1, pageSize = 10): Promise<Paginated<AdminUserRow>> {
    return apiClient.get(`/admin/users${qs(page, pageSize)}`);
  },
  getStats(): Promise<{ success: boolean; stats: AdminStats }> {
    return apiClient.get('/admin/stats');
  },
  getHotCampaigns(page = 1, pageSize = 10): Promise<Paginated<AdminHotCampaign>> {
    return apiClient.get(`/admin/hot-campaigns${qs(page, pageSize)}`);
  },
  getSystemActivity(page = 1, pageSize = 15): Promise<Paginated<AdminSystemEvent>> {
    return apiClient.get(`/admin/activity${qs(page, pageSize)}`);
  },
  getPipelineFunnel(): Promise<{ success: boolean; funnel: FunnelStage[] }> {
    return apiClient.get('/admin/funnel');
  },
  getPlatformBreakdown(): Promise<{ success: boolean; platforms: PlatformBreakdownEntry[] }> {
    return apiClient.get('/admin/platforms');
  },
  getScoreDistribution(): Promise<{ success: boolean; buckets: ScoreBucket[] }> {
    return apiClient.get('/admin/score-distribution');
  },
  getRecentSignups(): Promise<{ success: boolean; users: RecentSignup[] }> {
    return apiClient.get('/admin/recent-signups');
  },
  getUserBehavior(userId: string): Promise<AdminUserBehavior> {
    return apiClient.get(`/admin/users/${userId}`);
  },
  setRole(userId: string, role: UserRole) {
    return apiClient.put<{ success: boolean; user: { id: string; role: UserRole } }>(
      `/admin/users/${userId}/role`,
      { role }
    );
  },
  createUser(input: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    dailyLimitOverride?: number | null;
  }) {
    return apiClient.post<{ success: boolean; user: AdminUserRow }>('/admin/users', input);
  },
  updateUser(
    userId: string,
    input: { name?: string; email?: string; dailyLimitOverride?: number | null }
  ) {
    return apiClient.put<{ success: boolean; user: AdminUserRow }>(
      `/admin/users/${userId}`,
      input
    );
  },
  resetPassword(userId: string, password: string) {
    return apiClient.put<{ success: boolean }>(`/admin/users/${userId}/password`, { password });
  },
  setBlocked(userId: string, blocked: boolean, reason?: string) {
    return apiClient.put<{ success: boolean; user: AdminUserRow }>(
      `/admin/users/${userId}/blocked`,
      { blocked, reason }
    );
  },
  deleteUser(userId: string) {
    return apiClient.delete<{ success: boolean }>(`/admin/users/${userId}`);
  },
  listSettings() {
    return apiClient.get<{ success: boolean; settings: SettingRow[] }>('/admin/settings');
  },
  updateSetting(key: string, value: string | number) {
    return apiClient.put<{ success: boolean; settings: SettingRow[] }>(
      `/admin/settings/${key}`,
      { value }
    );
  },
};

export interface SettingRow {
  key: string;
  value: string;
  updatedAt: string | null;
  updatedBy: string | null;
  isDefault: boolean;
}
