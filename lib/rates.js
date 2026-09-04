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

export function withDynamicRateNavItems(nav, extraNames) {
  if (!Array.isArray(extraNames) || !extraNames.length) return nav;
  return nav.map((cat) => {
    if (cat.id !== 'configs') return cat;
    return {
      ...cat,
      groups: (cat.groups || []).map((group) => {
        if (group.label !== 'Rates Management') return group;
        const existingItems = group.items || [];
        const seen = new Set(
          existingItems.map((item) => String(item.label || '').trim().toLowerCase()).filter(Boolean),
        );
        const extras = extraNames
          .map((name) => String(name || '').trim())
          .filter((name) => {
            const key = name.toLowerCase();
            if (!name || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((name) => ({
            label: name,
            href: `/rates?method=${encodeURIComponent(name)}`,
            permission: 'view_currency_configs',
          }));
        if (!extras.length) return group;
        return {
          ...group,
          items: [...existingItems, ...extras],
        };
      }),
    };
  });
}

export function appendUniqueRateMethods(existing, extraNames) {
  const result = [...(existing || [])];
  const seen = new Set(result.map((name) => String(name || '').trim().toLowerCase()).filter(Boolean));
  for (const raw of extraNames || []) {
    const name = String(raw || '').trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
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
