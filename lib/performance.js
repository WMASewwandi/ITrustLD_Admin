import { apiRequest } from '@/lib/api';
import { getAdminToken, getAdminUser } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export const PERFORMANCE_PERIODS = ['Daily', 'Weekly', 'Monthly'];

export function mapPerformancePeriod(period) {
  return String(period || 'Weekly').toLowerCase();
}

export function canViewTeamPerformance(roles = []) {
  return roles.includes('super-admin') || roles.includes('sub-admin');
}

export function formatPerformanceCommission(amount, period) {
  if (period === 'Monthly' && amount >= 10000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export async function fetchMyPerformance(period = 'Weekly') {
  const query = new URLSearchParams({ period: mapPerformancePeriod(period) });
  return apiRequest(`/admin/performance/me?${query.toString()}`, withToken());
}

export async function fetchTeamPerformance(period = 'Weekly') {
  const query = new URLSearchParams({ period: mapPerformancePeriod(period) });
  return apiRequest(`/admin/performance/team?${query.toString()}`, withToken());
}

export function getCurrentAdminRoles() {
  return getAdminUser()?.roles ?? [];
}
