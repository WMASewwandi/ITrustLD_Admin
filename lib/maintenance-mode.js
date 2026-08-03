import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchMaintenanceMode() {
  return apiRequest('/admin/maintenance-mode', withToken());
}

export async function saveMaintenanceMode(payload) {
  return apiRequest('/admin/maintenance-mode', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}
