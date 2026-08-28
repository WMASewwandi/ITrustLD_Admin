import { apiRequest, getApiBaseUrl } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';
import {
  getDefaultAdvancedSearchIn,
  hasAdvancedDepositFilters,
  isPendingQueueStatus,
  mapDurationToFilter,
  validateDepositCustomDate,
} from '@/lib/deposits';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export {
  mapDurationToFilter,
  getDefaultAdvancedSearchIn,
  isPendingQueueStatus,
  validateDepositCustomDate as validateWithdrawalCustomDate,
  hasAdvancedDepositFilters as hasAdvancedWithdrawalFilters,
  resolveTransactionListStatus,
  resolveStatusFromUrl,
} from '@/lib/deposits';

export function buildWithdrawalQueryParams({
  status,
  page,
  perPage,
  keyword,
  duration,
  from,
  to,
  transactionId,
  platformId,
  userAccount,
  advancedSearchIn = 'Completed',
}) {
  const normalizedStatus = status === 'All' ? 'All' : status;
  const trimmedKeyword = keyword?.trim() || '';
  const advancedActive = hasAdvancedDepositFilters({
    duration,
    from,
    to,
    transactionId,
    platformId,
    userAccount,
  });

  const base = {
    page,
    perPage,
  };

  if (isPendingQueueStatus(normalizedStatus) && !advancedActive) {
    return {
      ...base,
      status: normalizedStatus,
      keyword: trimmedKeyword || undefined,
    };
  }

  const effectiveStatus =
    advancedActive && isPendingQueueStatus(normalizedStatus) ? advancedSearchIn : normalizedStatus;

  if (
    (normalizedStatus === 'Completed' || normalizedStatus === 'Rejected') &&
    !advancedActive &&
    trimmedKeyword
  ) {
    return {
      ...base,
      status: normalizedStatus,
      keyword: trimmedKeyword,
    };
  }

  if (advancedActive) {
    return {
      ...base,
      status: effectiveStatus,
      keyword: trimmedKeyword || undefined,
      transactionId: transactionId?.trim() || undefined,
      platformId: platformId?.trim() || undefined,
      userAccount: userAccount?.trim() || undefined,
      filter: mapDurationToFilter(duration) || (duration === 'Today' ? 'today' : undefined),
      fromDate: duration === 'Custom' ? from || undefined : undefined,
      toDate: duration === 'Custom' ? to || undefined : undefined,
    };
  }

  if (effectiveStatus === 'Completed' || effectiveStatus === 'Rejected') {
    return {
      ...base,
      status: effectiveStatus,
      filter: mapDurationToFilter(duration) || (duration === 'Today' ? 'today' : undefined),
      fromDate: duration === 'Custom' ? from || undefined : undefined,
      toDate: duration === 'Custom' ? to || undefined : undefined,
    };
  }

  return {
    ...base,
    status: effectiveStatus,
    keyword: trimmedKeyword || undefined,
  };
}

export async function fetchWithdrawals(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.perPage) query.set('per_page', String(params.perPage));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.transactionId) query.set('t_id', params.transactionId);
  if (params.platformId) query.set('p_acc', params.platformId);
  if (params.userAccount) query.set('u_acc', params.userAccount);
  if (params.amount != null && params.amount !== '') query.set('amount', String(params.amount));
  if (params.filter) query.set('filter', params.filter);
  if (params.fromDate) query.set('from_date', params.fromDate);
  if (params.toDate) query.set('to_date', params.toDate);
  if (params.cacheBust) query.set('_', String(params.cacheBust));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/admin/withdrawals${suffix}`, { ...withToken(), cache: 'no-store' });
}

export async function fetchSimilarWithdrawals({ withdrawalId, transactionId } = {}) {
  const query = new URLSearchParams();
  if (withdrawalId) query.set('withdrawal_id', String(withdrawalId));
  if (transactionId) query.set('transaction_id', String(transactionId));
  return apiRequest(`/admin/withdrawals/similar?${query.toString()}`, withToken());
}

export async function fetchWithdrawalExecutives({ authorizers = false } = {}) {
  const query = authorizers ? '?queue=pending-authorization' : '';
  return apiRequest(`/admin/withdrawals/executives${query}`, withToken());
}

export async function assignWithdrawals({ withdrawalIds, executiveId }) {
  return apiRequest('/admin/withdrawals/assign', withToken({
    method: 'POST',
    body: {
      withdrawal_ids: withdrawalIds,
      executive_id: executiveId,
    },
  }));
}

export async function updateWithdrawalStatus({
  withdrawalId,
  transactionId,
  status,
  rejectedReason,
  rejectedReasonMessage,
}) {
  return apiRequest('/admin/withdrawals/status', withToken({
    method: 'POST',
    body: {
      withdrawal_id: withdrawalId,
      transaction_id: transactionId,
      withdrawal_status: status,
      rejected_reason: rejectedReason,
      rejected_reason_message: rejectedReasonMessage,
    },
  }));
}

export async function fetchWithdrawalProofBlob(proofKey) {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Not signed in.');
  }
  if (!proofKey) {
    throw new Error('Proof file is missing.');
  }

  const url = `${getApiBaseUrl()}/admin/withdrawals/proof?path=${encodeURIComponent(proofKey)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load payment proof.');
  }

  return response.blob();
}

export async function downloadWithdrawalsExport({ status, filter, fromDate, toDate } = {}) {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (filter) query.set('filter', filter);
  if (fromDate) query.set('from_date', fromDate);
  if (toDate) query.set('to_date', toDate);

  const token = getAdminToken();
  if (!token) throw new Error('Not signed in.');

  const url = `${getApiBaseUrl()}/admin/withdrawals/export?${query.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to export withdrawals.');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || 'withdrawals.csv';
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
