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

export async function resendBulkSmsCampaign(id) {
  return apiRequest(`/admin/bulk-sms/${id}/resend`, withToken({ method: 'POST' }));
}

export async function deleteBulkSmsCampaign(id) {
  return apiRequest(`/admin/bulk-sms/${id}`, withToken({ method: 'DELETE' }));
}
