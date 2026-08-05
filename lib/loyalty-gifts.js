import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchGifts(audience = 'all') {
  const params = new URLSearchParams({ audience });
  return apiRequest(`/admin/loyalty/gifts?${params.toString()}`, withToken());
}

export async function createGift({ title, description, audienceType, allowedLevels }) {
  return apiRequest(
    '/admin/loyalty/gifts',
    withToken({
      method: 'POST',
      body: {
        title,
        description,
        audience_type: audienceType,
        allowed_levels: allowedLevels,
      },
    }),
  );
}

export async function updateGift({ id, title, description, audienceType, allowedLevels }) {
  return apiRequest(
    '/admin/loyalty/gifts/update',
    withToken({
      method: 'POST',
      body: {
        gift_id: id,
        title,
        description,
        audience_type: audienceType,
        allowed_levels: allowedLevels,
      },
    }),
  );
}

export async function updateGiftState({ id, isActive }) {
  return apiRequest(
    '/admin/loyalty/gifts/state',
    withToken({
      method: 'POST',
      body: {
        gift_id: id,
        is_active: isActive,
      },
    }),
  );
}

export async function deleteGift({ id }) {
  return apiRequest(
    '/admin/loyalty/gifts/delete',
    withToken({
      method: 'POST',
      body: { gift_id: id },
    }),
  );
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

export async function fetchGiftClaims({
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

  return apiRequest(`/admin/loyalty/gift-claims?${params.toString()}`, withToken());
}

export async function approveGiftClaim({ claimId }) {
  return apiRequest(
    '/admin/loyalty/gift-claims/approve',
    withToken({
      method: 'POST',
      body: { claim_id: claimId },
    }),
  );
}

export async function rejectGiftClaim({ claimId, rejectionReason }) {
  return apiRequest(
    '/admin/loyalty/gift-claims/reject',
    withToken({
      method: 'POST',
      body: {
        claim_id: claimId,
        rejection_reason: rejectionReason,
      },
    }),
  );
}

export async function deliverGiftClaim({ claimId }) {
  return apiRequest(
    '/admin/loyalty/gift-claims/deliver',
    withToken({
      method: 'POST',
      body: { claim_id: claimId },
    }),
  );
}
