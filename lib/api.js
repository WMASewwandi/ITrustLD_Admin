const DEFAULT_API_BASE = 'http://localhost:4000/api/v1';

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
    const error = new Error(data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
