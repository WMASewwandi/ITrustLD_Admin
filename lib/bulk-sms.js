import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchBulkSmsCampaigns() {
  return apiRequest('/admin/bulk-sms', withToken());
}

export async function createBulkSmsCampaign(payload) {
  return apiRequest('/admin/bulk-sms', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function cancelBulkSmsCampaign(id) {
  return apiRequest(`/admin/bulk-sms/${id}/cancel`, withToken({ method: 'POST' }));
}
