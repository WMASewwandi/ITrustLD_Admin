import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchLoyaltyMembershipTiers() {
  return apiRequest('/admin/loyalty/membership-tiers', withToken());
}

export async function saveLoyaltyMembershipTiers(tiers) {
  return apiRequest('/admin/loyalty/membership-tiers/save', withToken({
    method: 'POST',
    body: { tiers },
  }));
}
