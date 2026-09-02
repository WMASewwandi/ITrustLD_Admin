import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export const DEFAULT_DASHBOARD_FILTER = 'currentyear';
export const YEAR_DASHBOARD_FILTER = 'currentyear';

export const DASHBOARD_FILTER_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7days', label: 'Last 7 days' },
  { id: 'lastmonth', label: 'Last 30 days' },
  { id: 'last6months', label: 'Last 6 months' },
  { id: 'currentyear', label: 'Current Year' },
  { id: 'lastyear', label: 'Last Year' },
];

export function resolveDashboardDurationLabel(filter, year, periodLabel) {
  if (periodLabel) return periodLabel;
  if (filter === 'customdate') return 'Custom range';
  if (filter === 'currentyear') return String(year ?? new Date().getFullYear());
  if (filter === 'lastyear') return String((year ?? new Date().getFullYear()) - 1);
  const preset = resolveDashboardFilterLabel(filter);
  if (filter) return preset;
  return String(year ?? new Date().getFullYear());
}

export function resolveDashboardFilterLabel(filterId) {
  const match = DASHBOARD_FILTER_OPTIONS.find((o) => o.id === filterId);
  return match?.label || 'Current Year';
}

export function formatDashboardUsd(amount) {
  return `$ ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDashboardLkr(amount) {
  return `LKR ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPlatformDepositAmount(platform, amount) {
  if (platform?.isUsdt) {
    return `USDT${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return formatDashboardUsd(amount);
}

export async function fetchAdminDashboard({ filter, from, to, signal } = {}) {
  const params = new URLSearchParams();
  const resolvedFilter = filter || DEFAULT_DASHBOARD_FILTER;
  if (resolvedFilter) params.set('filter', resolvedFilter);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  // Bust any intermediate HTTP caches; server has its own short TTL cache.
  params.set('_', String(Date.now()));
  const query = params.toString();
  return apiRequest(`/admin/dashboard${query ? `?${query}` : ''}`, {
    ...withToken(),
    signal,
  });
}

function unwrapTotal(payload) {
  if (typeof payload === 'number') return payload;
  if (payload == null) return 0;
  if (typeof payload === 'object') {
    if (typeof payload.total === 'number') return payload.total;
    if (typeof payload.data === 'number') return payload.data;
  }
  const n = Number(payload);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchFilteredDepositsTotal({ filter, from, to } = {}) {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const payload = await apiRequest(
    `/admin/dashboard/filter-deposits${query ? `?${query}` : ''}`,
    withToken(),
  );
  return unwrapTotal(payload);
}

export async function fetchFilteredWithdrawalsTotal({ filter, from, to } = {}) {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const payload = await apiRequest(
    `/admin/dashboard/filter-withdrawals${query ? `?${query}` : ''}`,
    withToken(),
  );
  return unwrapTotal(payload);
}

/** Platform breakdown — loaded in parallel so the main dashboard can paint first. */
export async function fetchDashboardPlatforms({ filter, from, to } = {}) {
  const params = new URLSearchParams();
  // All-time list on Current Year view; otherwise match the selected period.
  if (filter && filter !== YEAR_DASHBOARD_FILTER) {
    params.set('filter', filter);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
  }
  const query = params.toString();
  const payload = await apiRequest(
    `/admin/dashboard/filter-transactions${query ? `?${query}` : ''}`,
    withToken(),
  );
  return Array.isArray(payload?.platforms) ? payload.platforms : [];
}
