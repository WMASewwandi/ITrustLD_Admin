const DEFAULT_API_BASE = 'http://localhost:4000/api/v1';

let kickInProgress = false;

function isAuthSkipPath(path) {
  const value = String(path || '');
  return value.includes('/auth/login') || value.includes('/auth/mark-offline');
}

function shiftKickReason(status, message, data) {
  const code = String(data?.code || '');
  const text = String(message || data?.message || '').toLowerCase();
  if (code === 'SHIFT_MISMATCH' || code === 'SHIFT_ENDED') return 'shift-ended';
  if (status === 401 && text.includes('shift has ended')) return 'shift-ended';
  return null;
}

function expiredTokenKick(status, message) {
  if (status !== 401) return false;
  const text = String(message || '').toLowerCase();
  return text.includes('expired token') || text.includes('unauthenticated');
}

export function shouldKickAdminSession(path, status, message, data) {
  if (isAuthSkipPath(path)) return null;
  const shiftReason = shiftKickReason(status, message, data);
  if (shiftReason) return shiftReason;
  if (expiredTokenKick(status, message)) return 'expired';
  return null;
}

function postMarkAdminOffline(token) {
  if (typeof window === 'undefined' || !token) return;
  try {
    fetch(`${getApiBaseUrl()}/admin/auth/mark-offline`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      keepalive: true,
      cache: 'no-store',
    });
  } catch {
    // best-effort
  }
}

export function kickOutAdminSession(reason = '') {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/login')) return;
  if (kickInProgress) return;
  kickInProgress = true;

  const token = window.localStorage.getItem('itrustld_admin_token');
  postMarkAdminOffline(token);
  try {
    window.localStorage.removeItem('itrustld_admin_token');
    window.localStorage.removeItem('itrustld_admin_user');
    window.localStorage.removeItem('itrustld_admin_auth');
    window.sessionStorage.removeItem('itrustld_admin_shell_snapshot');
  } catch {
    // ignore
  }

  const query = reason === 'shift-ended' ? '?reason=shift-ended' : '';
  window.location.replace(`/login${query}`);
}

function maybeKickAdminSession(path, status, message, data) {
  const reason = shouldKickAdminSession(path, status, message, data);
  if (reason) kickOutAdminSession(reason);
}

export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE).replace(/\/$/, '');
}

/** Replace localhost asset URLs from the API with the configured public API origin. */
export function rewritePublicAssetUrl(url) {
  const value = String(url || '').trim();
  if (!value) return value;
  try {
    const parsed = new URL(value);
    if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return value;
    }
    const path = `${parsed.pathname}${parsed.search}`.replace(/^\/api\/v1/, '');
    return `${getApiBaseUrl()}${path}`;
  } catch {
    return value;
  }
}

export async function apiRequest(path, options = {}) {
  const { token, body, headers = {}, ...rest } = options;
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const finalHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    cache: "no-store",
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    let message = data?.message || `Request failed (${response.status})`;
    const missingRoute = response.status === 404 && (!data?.message || data.message === 'Not found');
    const documentPath = path.includes('/documents') || path.includes('kyc-documents');
    if (missingRoute && !documentPath) {
      message =
        'API not found. Start ITrustLD_Backend on port 4000 (npm run dev) and restart it after pulling auth changes.';
    }
    maybeKickAdminSession(path, response.status, message, data);
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiFormRequest(path, options = {}) {
  const { token, formData, headers = {}, method = 'POST', ...rest } = options;
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const finalHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...rest,
    method,
    headers: finalHeaders,
    body: formData,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    maybeKickAdminSession(path, response.status, message, data);
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
