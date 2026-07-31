import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchUserCountDisplay() {
  return apiRequest('/admin/user-count-display', withToken());
}

export async function saveUserCountBase(baseCount) {
  return apiRequest('/admin/user-count-display/base-count', {
    ...withToken({ method: 'POST' }),
    body: { baseCount },
  });
}

export function formatCount(value) {
  return Number(value || 0).toLocaleString('en-US');
}
