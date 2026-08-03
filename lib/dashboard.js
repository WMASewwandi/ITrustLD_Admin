import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export const DASHBOARD_FILTER_OPTIONS = [
  { id: 'last7days', label: 'Last 7 days' },
  { id: 'lastmonth', label: 'Last month' },
  { id: 'last6months', label: 'Last 6 months' },
  { id: 'currentyear', label: 'Current Year' },
  { id: 'lastyear', label: 'Last Year' },
];

export function resolveDashboardDurationLabel(filter, year) {
  if (filter === 'lastyear') return String(year - 1);
  return String(year);
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

export async function fetchAdminDashboard() {
  return apiRequest('/admin/dashboard', withToken());
}

export async function fetchFilteredDepositsTotal({ filter, from, to } = {}) {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return apiRequest(`/admin/dashboard/filter-deposits${query ? `?${query}` : ''}`, withToken());
}

export async function fetchFilteredWithdrawalsTotal({ filter, from, to } = {}) {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return apiRequest(`/admin/dashboard/filter-withdrawals${query ? `?${query}` : ''}`, withToken());
}
