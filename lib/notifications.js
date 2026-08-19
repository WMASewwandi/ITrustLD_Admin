import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

export const ADMIN_NAV_COUNTS_REFRESH_EVENT = 'admin-nav-counts-refresh';
export const NAV_COUNTS_POLL_MS = 15_000;

export async function fetchNavCounts() {
  return apiRequest('/admin/notifications/counts', { token: getAdminToken() });
}

export function mergeNavCounts(current, patch) {
  if (!patch) return current;
  if (!current) return patch;

  return {
    ...current,
    users: { ...current.users, ...patch.users },
    deposits: { ...current.deposits, ...patch.deposits },
    withdrawals: { ...current.withdrawals, ...patch.withdrawals },
    loyalty: { ...current.loyalty, ...patch.loyalty },
    help_tickets: { ...current.help_tickets, ...patch.help_tickets },
  };
}

export function notifyAdminNavCountsRefresh(patch = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADMIN_NAV_COUNTS_REFRESH_EVENT, { detail: patch }));
  }
}
