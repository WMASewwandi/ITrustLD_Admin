import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export const TEMPLATE_PLACEHOLDERS = [
  { key: '{{username}}', sample: 'John Doe' },
  { key: '{{transaction_id}}', sample: 'TXN-88421' },
  { key: '{{amount}}', sample: 'LKR 25,000' },
  { key: '{{promo_code}}', sample: 'TRUST10' },
];

export function renderTemplatePreview(text, placeholders = TEMPLATE_PLACEHOLDERS) {
  let output = String(text || '');
  placeholders.forEach(({ key, sample }) => {
    output = output.split(key).join(sample);
  });
  return output;
}

export async function fetchMessageTemplates() {
  return apiRequest('/admin/message-templates', withToken());
}

export async function createMessageTemplate(payload) {
  return apiRequest('/admin/message-templates', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function toggleMessageTemplateStatus(id) {
  return apiRequest(`/admin/message-templates/${id}/toggle-status`, withToken({ method: 'POST' }));
}

export async function duplicateMessageTemplate(id) {
  return apiRequest(`/admin/message-templates/${id}/duplicate`, withToken({ method: 'POST' }));
}

export async function deleteMessageTemplate(id) {
  return apiRequest(`/admin/message-templates/${id}/delete`, withToken({ method: 'POST' }));
}
