import { apiRequest } from '@/lib/api';
import { getAdminToken, getAdminUser } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export const PERFORMANCE_PERIODS = ['Daily', 'Weekly', 'Monthly', 'Custom'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function mapPerformancePeriod(period) {
  return String(period || 'Weekly').toLowerCase();
}

/** Current commission cycle: 25th through next month 24th (local date). */
export function defaultCommissionRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const start = day < 25 ? new Date(year, month - 1, 25) : new Date(year, month, 25);
  return {
    from: `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`,
    to: `${year}-${pad2(month + 1)}-${pad2(day)}`,
  };
}

export function buildPerformanceQuery(period, range = {}) {
  const query = new URLSearchParams({ period: mapPerformancePeriod(period) });
  if (mapPerformancePeriod(period) === 'custom') {
    if (range.from) query.set('from', range.from);
    if (range.to) query.set('to', range.to);
  }
  return query;
}

export function canViewTeamPerformance(roles = [], permissions = []) {
  return (
    permissions.includes('view_team_performance') ||
    roles.includes('super-admin') ||
    roles.includes('sub-admin')
  );
}

export function getCurrentAdminAccess() {
  const user = getAdminUser();
  return {
    roles: user?.roles ?? [],
    permissions: user?.permissions ?? [],
  };
}

export function formatPerformanceCommission(amount) {
  return `$${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export async function fetchMyPerformance(period = 'Weekly', range = {}) {
  const query = buildPerformanceQuery(period, range);
  return apiRequest(`/admin/performance/me?${query.toString()}`, withToken());
}

export async function fetchTeamPerformance(period = 'Weekly', range = {}) {
  const query = buildPerformanceQuery(period, range);
  return apiRequest(`/admin/performance/team?${query.toString()}`, withToken());
}

export function getCurrentAdminRoles() {
  return getAdminUser()?.roles ?? [];
}
