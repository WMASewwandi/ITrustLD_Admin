import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchScammers({ platformId = '', customerName = '', page = 1 } = {}) {
  const params = new URLSearchParams();
  if (platformId.trim()) params.set('platform_id', platformId.trim());
  if (customerName.trim()) params.set('customer_name', customerName.trim());
  params.set('page', String(page));
  params.set('per_page', '50');
  const query = params.toString();
  return apiRequest(`/admin/scammers${query ? `?${query}` : ''}`, withToken());
}

export async function searchScammerUser(platformId) {
  return apiRequest('/admin/scammers/search-user', {
    ...withToken(),
    method: 'POST',
    body: { platform_id: platformId },
  });
}

export async function addScammer(payload) {
  return apiRequest('/admin/scammers', {
    ...withToken(),
    method: 'POST',
    body: payload,
  });
}

export async function deleteScammer(id) {
  return apiRequest(`/admin/scammers/${id}`, {
    ...withToken(),
    method: 'DELETE',
  });
}
