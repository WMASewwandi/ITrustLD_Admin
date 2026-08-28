import { apiRequest, getApiBaseUrl } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export function mapDurationToFilter(duration) {
  const map = {
    Today: 'today',
    Yesterday: 'yesterday',
    'This Week': 'last7days',
    'This Month': 'lastmonth',
    'Last 6 Months': 'last6months',
    'Current Year': 'currentyear',
    'Last Year': 'lastyear',
    Custom: 'customdate',
  };
  return map[duration] || '';
}

export function isPendingQueueStatus(status) {
  return status === 'Pending' || status === 'Pending Authorization';
}

export function getDefaultAdvancedSearchIn(pageStatus, urlSearchIn) {
  if (urlSearchIn === 'Rejected' || urlSearchIn === 'Completed') {
    return urlSearchIn;
  }
  if (pageStatus === 'Rejected') return 'Rejected';
  if (pageStatus === 'Completed') return 'Completed';
  return 'Completed';
}

export function validateDepositCustomDate(duration, from, to) {
  if (duration !== 'Custom') return null;
  if (!from.trim() || !to.trim()) {
    return 'Please enter both From and To dates to filter by custom date.';
  }
  return null;
}

export function hasAdvancedDepositFilters({
  duration = 'Today',
  from = '',
  to = '',
  transactionId = '',
  platformId = '',
  userAccount = '',
} = {}) {
  return Boolean(
    transactionId.trim() ||
      platformId.trim() ||
      userAccount.trim() ||
      (duration !== 'Today' && duration !== 'Custom') ||
      (duration === 'Custom' && from.trim() && to.trim()),
  );
}

/** Pending + advanced filters always resolve to the Search-in tab (Laravel redirect). */
export function resolveTransactionListStatus({
  status = 'Pending',
  advancedSearchIn = 'Completed',
  duration = 'Today',
  from = '',
  to = '',
  transactionId = '',
  platformId = '',
  userAccount = '',
} = {}) {
  const normalizedStatus = status === 'All' ? 'All' : status;
  const advancedActive = hasAdvancedDepositFilters({
    duration,
    from,
    to,
    transactionId,
    platformId,
    userAccount,
  });
  if (isPendingQueueStatus(normalizedStatus) && advancedActive) {
    return advancedSearchIn;
  }
  return normalizedStatus;
}

export function resolveStatusFromUrl(urlStatus, urlSearchIn, filterValues) {
  const advancedSearchIn = getDefaultAdvancedSearchIn(urlStatus, urlSearchIn);
  if (
    isPendingQueueStatus(urlStatus) &&
    (urlSearchIn === 'Completed' || urlSearchIn === 'Rejected')
  ) {
    return urlSearchIn;
  }
  return resolveTransactionListStatus({
    status: urlStatus,
    advancedSearchIn,
    ...filterValues,
  });
}

export function buildDepositQueryParams({
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

  // Completed/Rejected keyword-only search stays within the current status (no implicit date filter).
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

export async function fetchSimilarDeposits({ depositId, transactionId } = {}) {
  const query = new URLSearchParams();
  if (depositId) query.set('deposit_id', String(depositId));
  if (transactionId) query.set('transaction_id', String(transactionId));
  return apiRequest(`/admin/deposits/similar?${query.toString()}`, withToken());
}

export async function fetchDeposits(params = {}) {
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
  return apiRequest(`/admin/deposits${suffix}`, { ...withToken(), cache: 'no-store' });
}

export async function fetchDepositExecutives() {
  return apiRequest('/admin/deposits/executives', withToken());
}

export async function assignDeposits({ depositIds, executiveId }) {
  return apiRequest('/admin/deposits/assign', withToken({
    method: 'POST',
    body: {
      deposit_ids: depositIds,
      executive_id: executiveId,
    },
  }));
}

export async function updateDepositStatus({
  depositId,
  transactionId,
  status,
  rejectedReason,
  rejectedReasonMessage,
}) {
  return apiRequest('/admin/deposits/status', withToken({
    method: 'POST',
    body: {
      deposit_id: depositId,
      transaction_id: transactionId,
      deposit_status: status,
      rejected_reason: rejectedReason,
      rejected_reason_message: rejectedReasonMessage,
    },
  }));
}

export async function fetchDepositProofBlob(proofKey) {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Not signed in.');
  }
  if (!proofKey) {
    throw new Error('Proof file is missing.');
  }

  const url = `${getApiBaseUrl()}/admin/deposits/proof?path=${encodeURIComponent(proofKey)}`;
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

export async function downloadDepositsExport({ status, filter, fromDate, toDate } = {}) {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (filter) query.set('filter', filter);
  if (fromDate) query.set('from_date', fromDate);
  if (toDate) query.set('to_date', toDate);

  const token = getAdminToken();
  if (!token) throw new Error('Not signed in.');

  const url = `${getApiBaseUrl()}/admin/deposits/export?${query.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to export deposits.');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || 'deposits.csv';
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
