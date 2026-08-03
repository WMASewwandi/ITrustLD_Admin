import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

function encodeMethod(method) {
  return encodeURIComponent(method);
}

export async function fetchRatePaymentOptions() {
  return apiRequest('/admin/rates/payment-options', withToken());
}

export async function fetchRatesForMethod(method) {
  return apiRequest(`/admin/rates/${encodeMethod(method)}`, withToken());
}

export async function createRates(payload) {
  return apiRequest('/admin/rates', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updateDepositRate(payload) {
  return apiRequest('/admin/rates/deposit/update', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updateWithdrawalRate(payload) {
  return apiRequest('/admin/rates/withdrawal/update', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function deleteRate(payload) {
  return apiRequest('/admin/rates/delete', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function addPointWithdrawalRate(payload) {
  return apiRequest('/admin/rates/point-withdrawal', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updatePointWithdrawalRate(payload) {
  return apiRequest('/admin/rates/point-withdrawal/update', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function deletePointWithdrawalRate(pointRateId) {
  return apiRequest(`/admin/rates/point-withdrawal/${pointRateId}/delete`, {
    ...withToken({ method: 'POST' }),
  });
}
