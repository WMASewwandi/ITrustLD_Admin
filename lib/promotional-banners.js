import { apiFormRequest, apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchPromotionalBanners() {
  return apiRequest('/admin/promotional-banners', withToken());
}

export async function createPromotionalBanner(payload, mediaFile) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description || '');
  formData.append('color', payload.color || '#0D9F1B');
  formData.append('cta_link', payload.ctaLink || '');
  formData.append('cta_label', payload.ctaLabel || 'Learn More');
  formData.append('display_type', payload.displayType || 'Static Banner');
  formData.append('audience', payload.audience || 'Normal Users');
  formData.append('active_from', payload.activeFrom || '');
  formData.append('active_to', payload.activeTo || '');
  formData.append('is_active', payload.isActive === false ? '0' : '1');
  formData.append('sort_order', String(payload.sortOrder || 0));
  if (mediaFile) {
    formData.append('media', mediaFile);
  }
  return apiFormRequest('/admin/promotional-banners', withToken({ method: 'POST', formData }));
}

export async function updatePromotionalBanner(id, payload, mediaFile) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description || '');
  formData.append('color', payload.color || '#0D9F1B');
  formData.append('cta_link', payload.ctaLink || '');
  formData.append('cta_label', payload.ctaLabel || 'Learn More');
  formData.append('display_type', payload.displayType || 'Static Banner');
  formData.append('audience', payload.audience || 'Normal Users');
  formData.append('active_from', payload.activeFrom || '');
  formData.append('active_to', payload.activeTo || '');
  formData.append('is_active', payload.isActive === false ? '0' : '1');
  formData.append('sort_order', String(payload.sortOrder || 0));
  if (payload.removeMedia) {
    formData.append('remove_media', '1');
  }
  if (mediaFile) {
    formData.append('media', mediaFile);
  }
  return apiFormRequest(`/admin/promotional-banners/${id}/update`, withToken({ method: 'POST', formData }));
}

export async function deletePromotionalBanner(id) {
  return apiRequest(`/admin/promotional-banners/${id}/delete`, withToken({ method: 'POST' }));
}
