import { apiFormRequest, apiRequest, getApiBaseUrl } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

/** Shown when a wallet has no logo or the stored logo file is unavailable. */
export const SAMPLE_WALLET_LOGO = '/assets/img/logos/favicon.svg';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export function getWalletLogoUrl(wallet) {
  if (wallet?.logoUrl) return wallet.logoUrl;
  if (!wallet?.logo) return null;
  return `${getApiBaseUrl()}/public/wallet-logos/${encodeURIComponent(wallet.logo)}`;
}

export async function fetchWalletMeta() {
  return apiRequest('/admin/wallets/meta', withToken());
}

export async function fetchTopupWallets() {
  return apiRequest('/admin/wallets/topup', withToken());
}

export async function fetchCashoutWallets() {
  return apiRequest('/admin/wallets/cashout', withToken());
}

export async function fetchTopupWallet(walletId) {
  return apiRequest(`/admin/wallets/topup/${walletId}`, withToken());
}

export async function fetchCashoutWallet(walletId) {
  return apiRequest(`/admin/wallets/cashout/${walletId}`, withToken());
}

function buildWalletFormData(payload, logoFile) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('currency', payload.currency);
  formData.append('minLimit', String(payload.minLimit));
  formData.append('maxLimit', String(payload.maxLimit));
  formData.append('platformType', payload.platformType);
  formData.append('terms', payload.terms);
  formData.append('paymentMethodIds', JSON.stringify(payload.paymentMethodIds || []));
  if (logoFile) {
    formData.append('wallet_logo', logoFile);
  }
  return formData;
}

export async function createTopupWallet(payload, logoFile) {
  return apiFormRequest(
    '/admin/wallets/topup',
    withToken({ method: 'POST', formData: buildWalletFormData(payload, logoFile) }),
  );
}

export async function updateTopupWallet(walletId, payload, logoFile) {
  return apiFormRequest(
    `/admin/wallets/topup/${walletId}/update`,
    withToken({ method: 'POST', formData: buildWalletFormData(payload, logoFile) }),
  );
}

export async function deleteTopupWallet(walletId) {
  return apiRequest(`/admin/wallets/topup/${walletId}/delete`, withToken({ method: 'POST' }));
}

export async function toggleTopupWalletStatus(walletId, active) {
  return apiRequest(`/admin/wallets/topup/${walletId}/toggle-status`, {
    ...withToken({ method: 'POST' }),
    body: { active },
  });
}

export async function createCashoutWallet(payload, logoFile) {
  return apiFormRequest(
    '/admin/wallets/cashout',
    withToken({ method: 'POST', formData: buildWalletFormData(payload, logoFile) }),
  );
}

export async function updateCashoutWallet(walletId, payload, logoFile) {
  return apiFormRequest(
    `/admin/wallets/cashout/${walletId}/update`,
    withToken({ method: 'POST', formData: buildWalletFormData(payload, logoFile) }),
  );
}

export async function deleteCashoutWallet(walletId) {
  return apiRequest(`/admin/wallets/cashout/${walletId}/delete`, withToken({ method: 'POST' }));
}

export async function toggleCashoutWalletStatus(walletId, active) {
  return apiRequest(`/admin/wallets/cashout/${walletId}/toggle-status`, {
    ...withToken({ method: 'POST' }),
    body: { active },
  });
}

export function mapWalletToRow(wallet) {
  return {
    id: wallet.id,
    name: wallet.name,
    logoName: wallet.logoName || wallet.logo || null,
    logoUrl: getWalletLogoUrl(wallet),
    paymentMethods: Array.isArray(wallet.paymentMethods) ? wallet.paymentMethods : [],
    paymentMethodIds: Array.isArray(wallet.paymentMethodIds) ? wallet.paymentMethodIds : [],
    minLimit: wallet.minLimit,
    maxLimit: wallet.maxLimit,
    currency: wallet.currency,
    platformType: wallet.platformType,
    terms: wallet.terms || '',
    active: Boolean(wallet.active),
    badgeColor: '#236B6B',
  };
}
