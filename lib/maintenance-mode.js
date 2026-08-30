import { apiFormRequest, apiRequest, rewritePublicAssetUrl } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchMaintenanceMode() {
  const data = await apiRequest('/admin/maintenance-mode', withToken());
  return withPublicBackground(data);
}

function withPublicBackground(data) {
  const countdown = data?.maintenanceMode?.countdown;
  if (countdown?.backgroundUrl) {
    countdown.backgroundUrl = rewritePublicAssetUrl(countdown.backgroundUrl);
  }
  return data;
}

export async function saveMaintenanceMode(payload, file) {
  if (file || payload?.removeBackground) {
    const formData = new FormData();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value === undefined) return;
      formData.append(key, value === null ? '' : String(value));
    });
    if (file) formData.append('background', file);
    const data = await apiFormRequest('/admin/maintenance-mode', withToken({ method: 'POST', formData }));
    return withPublicBackground(data);
  }

  const data = await apiRequest('/admin/maintenance-mode', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
  return withPublicBackground(data);
}
