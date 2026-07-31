const DEFAULT_API_BASE = 'http://localhost:4000/api/v1';

export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE).replace(/\/$/, '');
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
    if (response.status === 404) {
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
