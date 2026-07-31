import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchSystemUsers() {
  return apiRequest('/admin/system-users', withToken());
}

export async function createSystemUser(body) {
  return apiRequest('/admin/system-users', withToken({
    method: 'POST',
    body,
  }));
}

export async function updateSystemUser(userId, body) {
  return apiRequest(`/admin/system-users/${userId}`, withToken({
    method: 'PUT',
    body,
  }));
}
