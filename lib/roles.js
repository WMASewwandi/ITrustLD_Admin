import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchRoles() {
  return apiRequest('/admin/roles', withToken());
}

export async function fetchRoleActivities() {
  return apiRequest('/admin/roles/activities', withToken());
}

export async function fetchRole(roleName) {
  return apiRequest(`/admin/roles/${encodeURIComponent(roleName)}`, withToken());
}

export async function createRole(name) {
  return apiRequest('/admin/roles', withToken({
    method: 'POST',
    body: { name },
  }));
}

export async function updateRolePermissions(roleName, permissions) {
  return apiRequest(`/admin/roles/${encodeURIComponent(roleName)}/permissions`, withToken({
    method: 'PUT',
    body: { permissions },
  }));
}
