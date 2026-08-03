import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchPaymentMethodMeta() {
  return apiRequest('/admin/payment-methods/meta', withToken());
}

export async function fetchPaymentMethods() {
  return apiRequest('/admin/payment-methods', withToken());
}

export async function createPaymentMethod(payload) {
  return apiRequest('/admin/payment-methods', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updatePaymentMethod(paymentMethodId, payload) {
  return apiRequest(`/admin/payment-methods/${paymentMethodId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function deletePaymentMethod(paymentMethodId) {
  return apiRequest(`/admin/payment-methods/${paymentMethodId}/delete`, {
    ...withToken({ method: 'POST' }),
  });
}

export async function togglePaymentMethodStatus(paymentMethodId, active) {
  return apiRequest(`/admin/payment-methods/${paymentMethodId}/toggle-status`, {
    ...withToken({ method: 'POST' }),
    body: { active },
  });
}

export async function setPaymentMethodPriority(paymentMethodId) {
  return apiRequest(`/admin/payment-methods/${paymentMethodId}/set-priority`, {
    ...withToken({ method: 'POST' }),
  });
}

export function mapPaymentMethodToRow(paymentMethod) {
  return {
    id: paymentMethod.id,
    name: paymentMethod.name,
    currency: paymentMethod.currency,
    minLimit: paymentMethod.minLimit,
    maxLimit: paymentMethod.maxLimit,
    active: Boolean(paymentMethod.active),
    priority: Boolean(paymentMethod.priority),
  };
}
