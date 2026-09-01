import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

function mapDurationToFilter(duration) {
  switch (duration) {
    case 'Today':
      return 'today';
    case 'Yesterday':
      return 'yesterday';
    case 'Last 7 Days':
      return 'last7days';
    case 'Last Month':
      return 'lastmonth';
    case 'Last 6 Months':
      return 'last6months';
    case 'Current Year':
      return 'currentyear';
    case 'Last Year':
      return 'lastyear';
    case 'Custom':
      return 'customdate';
    default:
      return undefined;
  }
}

export function mapBonusStatusForApi(status) {
  if (status === 'Claimed' || status === 'Completed') return 'Approved';
  if (status === 'All') return 'All';
  return status;
}

export async function fetchBonusClaims({
  status = 'Pending',
  page = 1,
  perPage = 20,
  keyword = '',
  duration = '',
  from = '',
  to = '',
} = {}) {
  const params = new URLSearchParams({
    status: mapBonusStatusForApi(status),
    page: String(page),
    per_page: String(perPage),
  });

  const filter = mapDurationToFilter(duration);
  if (filter) params.set('filter', filter);
  if (keyword.trim()) params.set('keyword', keyword.trim());
  if (from) params.set('from_date', from);
  if (to) params.set('to_date', to);

  return apiRequest(`/admin/loyalty/bonus-claims?${params.toString()}`, withToken());
}

export async function updateBonusClaimStatus({ transactionId, status, rejectionReason }) {
  return apiRequest(
    '/admin/loyalty/bonus-claims/status',
    withToken({
      method: 'POST',
      body: {
        transaction_id: transactionId,
        bonus_request_status: mapBonusStatusForApi(status),
        rejection_reason: rejectionReason || undefined,
      },
    }),
  );
}
