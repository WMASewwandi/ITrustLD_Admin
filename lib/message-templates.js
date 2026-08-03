import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export const TEMPLATE_PLACEHOLDERS = [
  { key: '{{username}}', sample: 'John Doe' },
  { key: '{{first_name}}', sample: 'John' },
  { key: '{{transaction_id}}', sample: 'TXN-88421' },
  { key: '{{amount}}', sample: 'LKR 25,000' },
  { key: '{{status}}', sample: 'Completed' },
  { key: '{{platform}}', sample: 'XM Global' },
  { key: '{{account}}', sample: '12345678' },
  { key: '{{reason}}', sample: 'Invalid payment proof' },
  { key: '{{promo_code}}', sample: 'TRUST10' },
  { key: '{{verification_url}}', sample: 'https://app.itrustld.com/verify' },
  { key: '{{reset_url}}', sample: 'https://app.itrustld.com/reset-password' },
];

export function renderTemplateVariables(text, variables = {}) {
  let output = String(text || '');
  for (const [rawKey, value] of Object.entries(variables)) {
    const key = rawKey.startsWith('{{') ? rawKey : `{{${rawKey}}}`;
    output = output.split(key).join(value == null ? '' : String(value));
  }
  return output;
}

export function renderTemplatePreview(text, placeholders = TEMPLATE_PLACEHOLDERS) {
  const variables = Object.fromEntries(placeholders.map(({ key, sample }) => [key, sample]));
  return renderTemplateVariables(text, variables);
}

export async function fetchMessageTemplates() {
  return apiRequest('/admin/message-templates', withToken());
}

export async function fetchMessageTemplateKeys() {
  return apiRequest('/admin/message-templates/keys', withToken());
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
