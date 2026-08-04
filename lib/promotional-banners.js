import { apiFormRequest, apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

function appendMediaFiles(formData, mediaFileOrFiles) {
  const files = Array.isArray(mediaFileOrFiles)
    ? mediaFileOrFiles.filter(Boolean)
    : mediaFileOrFiles
      ? [mediaFileOrFiles]
      : [];

  for (const file of files) {
    formData.append('media', file);
  }
}

export async function fetchPromotionalBanners() {
  return apiRequest('/admin/promotional-banners', withToken());
}

export async function createPromotionalBanner(payload, mediaFileOrFiles) {
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
  appendMediaFiles(formData, mediaFileOrFiles);
  return apiFormRequest('/admin/promotional-banners', withToken({ method: 'POST', formData }));
}

export async function updatePromotionalBanner(id, payload, mediaFileOrFiles) {
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
  appendMediaFiles(formData, mediaFileOrFiles);
  return apiFormRequest(`/admin/promotional-banners/${id}/update`, withToken({ method: 'POST', formData }));
}

export async function deletePromotionalBanner(id) {
  return apiRequest(`/admin/promotional-banners/${id}/delete`, withToken({ method: 'POST' }));
}
