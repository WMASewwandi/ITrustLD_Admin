import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

export async function fetchNavCounts() {
  return apiRequest('/admin/notifications/counts', { token: getAdminToken() });
}
