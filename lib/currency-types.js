import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchCurrencyTypes() {
  return apiRequest('/admin/currency-types', withToken());
}

export async function createCurrencyType(payload) {
  return apiRequest('/admin/currency-types', {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function updateCurrencyType(currencyTypeId, payload) {
  return apiRequest(`/admin/currency-types/${currencyTypeId}/update`, {
    ...withToken({ method: 'POST' }),
    body: payload,
  });
}

export async function deleteCurrencyType(currencyTypeId) {
  return apiRequest(`/admin/currency-types/${currencyTypeId}/delete`, {
    ...withToken({ method: 'POST' }),
  });
}

export async function toggleCurrencyTypeStatus(currencyTypeId, active) {
  return apiRequest(`/admin/currency-types/${currencyTypeId}/toggle-status`, {
    ...withToken({ method: 'POST' }),
    body: { active },
  });
}

export function mapCurrencyTypeToRow(currencyType) {
  return {
    id: currencyType.id,
    name: currencyType.name,
    code: currencyType.code,
    symbol: currencyType.symbol,
    description: currencyType.description,
    active: Boolean(currencyType.active),
  };
}
