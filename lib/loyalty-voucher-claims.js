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

export async function fetchVoucherClaims({
  status = 'Pending',
  page = 1,
  perPage = 20,
  keyword = '',
  duration = '',
  from = '',
  to = '',
} = {}) {
  const params = new URLSearchParams({
    status,
    page: String(page),
    per_page: String(perPage),
  });

  const filter = mapDurationToFilter(duration);
  if (filter) params.set('filter', filter);
  if (keyword.trim()) params.set('keyword', keyword.trim());
  if (from) params.set('from_date', from);
  if (to) params.set('to_date', to);

  return apiRequest(`/admin/loyalty/voucher-claims?${params.toString()}`, withToken());
}

export async function fetchVoucherClaimAssignees() {
  return apiRequest('/admin/loyalty/voucher-claims/executives', withToken());
}

export async function assignVoucherClaims({ ids, executiveId }) {
  return apiRequest(
    '/admin/loyalty/voucher-claims/assign',
    withToken({
      method: 'POST',
      body: {
        voucher_ids: ids,
        executive_id: executiveId,
      },
    }),
  );
}

export async function completeVoucherClaim({ voucherId }) {
  return apiRequest(
    '/admin/loyalty/voucher-claims/complete',
    withToken({
      method: 'POST',
      body: { voucher_id: voucherId },
    }),
  );
}

export async function rejectVoucherClaim({ voucherId, rejectionReason }) {
  return apiRequest(
    '/admin/loyalty/voucher-claims/reject',
    withToken({
      method: 'POST',
      body: {
        voucher_id: voucherId,
        rejection_reason: rejectionReason,
      },
    }),
  );
}

export async function fetchVoucherDuplicateCheck(voucherId) {
  return apiRequest(`/admin/loyalty/voucher-claims/${voucherId}/duplicates`, withToken());
}
