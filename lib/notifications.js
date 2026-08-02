import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

export const ADMIN_NAV_COUNTS_REFRESH_EVENT = 'admin-nav-counts-refresh';
export const NAV_COUNTS_POLL_MS = 15_000;

export async function fetchNavCounts() {
  return apiRequest('/admin/notifications/counts', { token: getAdminToken() });
}

export function notifyAdminNavCountsRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_NAV_COUNTS_REFRESH_EVENT));
  }
}
