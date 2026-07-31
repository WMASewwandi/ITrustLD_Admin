import { apiRequest } from '@/lib/api';

const TOKEN_KEY = 'itrustld_admin_token';
const USER_KEY = 'itrustld_admin_user';

export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAdminSession({ token, user }) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.localStorage.setItem('itrustld_admin_auth', '1');
}

export function updateAdminUser(user) {
  const token = getAdminToken();
  if (!token) return;
  setAdminSession({ token, user });
}

export function clearAdminSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem('itrustld_admin_auth');
}

export function hasAdminSession() {
  return Boolean(getAdminToken());
}

/** Human-readable label for the signed-in admin's primary role. */
export function formatRoleLabel(roles = []) {
  if (roles.includes("super-admin")) return "Super Admin";
  if (roles.includes("sub-admin")) return "Sub Admin";
  if (roles.includes("deposit-executive")) return "Deposit Executive";
  if (roles.includes("withdrawal-executive")) return "Withdrawal Executive";

  const slug = roles[0];
  if (!slug) return "Admin";

  return slug
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function loginAdmin(email, password) {
  return apiRequest('/admin/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function fetchAdminMe() {
  const token = getAdminToken();
  if (!token) {
    const error = new Error('Not signed in.');
    error.status = 401;
    throw error;
  }
  return apiRequest('/admin/auth/me', { method: 'GET', token });
}

export async function logoutAdmin() {
  const token = getAdminToken();
  if (token) {
    try {
      await apiRequest('/admin/auth/logout', { method: 'POST', token });
    } catch {
      // Clear local session even if the API call fails.
    }
  }
  clearAdminSession();
}
