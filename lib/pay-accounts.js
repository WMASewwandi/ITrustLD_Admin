import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchPayAccounts() {
  return apiRequest('/admin/pay-accounts', withToken());
}

export async function createBankAccount(payload) {
  return apiRequest('/admin/pay-accounts/bank', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updateBankAccount(accountId, payload) {
  return apiRequest(`/admin/pay-accounts/bank/${accountId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function createSkrillAccount(payload) {
  return apiRequest('/admin/pay-accounts/skrill', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updateSkrillAccount(accountId, payload) {
  return apiRequest(`/admin/pay-accounts/skrill/${accountId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function createNetellerAccount(payload) {
  return apiRequest('/admin/pay-accounts/neteller', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updateNetellerAccount(accountId, payload) {
  return apiRequest(`/admin/pay-accounts/neteller/${accountId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function createBinanceAccount(payload) {
  return apiRequest('/admin/pay-accounts/binance', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updateBinanceAccount(accountId, payload) {
  return apiRequest(`/admin/pay-accounts/binance/${accountId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function createPmAccount(payload) {
  return apiRequest('/admin/pay-accounts/pm', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updatePmAccount(accountId, payload) {
  return apiRequest(`/admin/pay-accounts/pm/${accountId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function createXmAccount(payload) {
  return apiRequest('/admin/pay-accounts/xm', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updateXmAccount(accountId, payload) {
  return apiRequest(`/admin/pay-accounts/xm/${accountId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function deletePayAccount(accountType, accountId) {
  return apiRequest(`/admin/pay-accounts/${accountType}/${accountId}/delete`, {
    ...withToken({ method: 'POST' }),
  });
}

export async function togglePayAccountStatus(accountType, accountId, active) {
  return apiRequest(`/admin/pay-accounts/${accountType}/${accountId}/toggle-status`, {
    ...withToken({ method: 'POST' }),
    body: { active },
  });
}

export async function createPayAccountCategory(payload) {
  return apiRequest('/admin/pay-accounts/categories', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updatePayAccountCategory(categoryId, payload) {
  return apiRequest(`/admin/pay-accounts/categories/${categoryId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function deletePayAccountCategory(categoryId) {
  return apiRequest(`/admin/pay-accounts/categories/${categoryId}/delete`, {
    ...withToken({ method: 'POST' }),
  });
}

export async function createPayAccountField(categoryId, payload) {
  return apiRequest(`/admin/pay-accounts/categories/${categoryId}/fields`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updatePayAccountField(fieldId, payload) {
  return apiRequest(`/admin/pay-accounts/fields/${fieldId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function deletePayAccountField(fieldId) {
  return apiRequest(`/admin/pay-accounts/fields/${fieldId}/delete`, {
    ...withToken({ method: 'POST' }),
  });
}

export async function createCustomPayAccount(categoryId, payload) {
  return apiRequest(`/admin/pay-accounts/categories/${categoryId}/records`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updateCustomPayAccount(recordId, payload) {
  return apiRequest(`/admin/pay-accounts/records/${recordId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function deleteCustomPayAccount(recordId) {
  return apiRequest(`/admin/pay-accounts/records/${recordId}/delete`, {
    ...withToken({ method: 'POST' }),
  });
}

export async function toggleCustomPayAccountStatus(recordId, active) {
  return apiRequest(`/admin/pay-accounts/records/${recordId}/toggle-status`, {
    ...withToken({ method: 'POST' }),
    body: { active },
  });
}
