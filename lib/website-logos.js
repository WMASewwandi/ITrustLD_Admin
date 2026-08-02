import { apiFormRequest, apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export const LOGO_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
export const LOGO_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg'];
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const DEFAULT_WIDE_LOGO_URL = '/assets/img/logos/logo-itrustld-wide.png';

export function validateLogoFile(file) {
  if (!file) {
    return 'Please choose a logo image to upload.';
  }

  const name = String(file.name || '').toLowerCase();
  const hasAllowedExt = LOGO_ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasAllowedType = LOGO_ALLOWED_TYPES.includes(String(file.type || '').toLowerCase());

  if (!hasAllowedExt && !hasAllowedType) {
    return 'Logo must be a JPG, PNG, or SVG image.';
  }

  if (file.size > LOGO_MAX_BYTES) {
    return 'Logo file must not exceed 2MB.';
  }

  return null;
}

export function validateLogoSchedule({ campaign, activeFrom, activeTo, file }) {
  if (!String(campaign || '').trim()) {
    return 'Season / campaign name is required.';
  }
  if (!activeFrom || !activeTo) {
    return 'Active from and active to dates are required.';
  }
  if (activeTo < activeFrom) {
    return 'Active to date must be on or after active from date.';
  }
  return validateLogoFile(file);
}

export async function fetchWebsiteLogos() {
  return apiRequest('/admin/website-logos', withToken());
}

export async function createWebsiteLogoSchedule(payload, logoFile) {
  const formData = new FormData();
  formData.append('campaign', payload.campaign);
  formData.append('active_from', payload.activeFrom);
  formData.append('active_to', payload.activeTo);
  if (logoFile) {
    formData.append('logo', logoFile);
  }
  return apiFormRequest('/admin/website-logos', withToken({ method: 'POST', formData }));
}

export async function deleteWebsiteLogoSchedule(id) {
  return apiRequest(`/admin/website-logos/${id}/delete`, withToken({ method: 'POST' }));
}
