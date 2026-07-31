import { apiRequest, apiFormRequest, getApiBaseUrl } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchCustomers({
  filter = 'pending',
  email,
  accountId,
  firstName,
  lastName,
  primaryId,
} = {}) {
  const params = new URLSearchParams();
  params.set('filter', filter);
  if (email) params.set('email', email);
  if (accountId) params.set('account_id', accountId);
  if (firstName) params.set('first_name', firstName);
  if (lastName) params.set('last_name', lastName);
  if (primaryId) params.set('primary_id', primaryId);

  return apiRequest(`/admin/customers?${params.toString()}`, withToken());
}

export async function fetchCustomerKycDocuments(accountHolderId, field) {
  const params = new URLSearchParams();
  params.set('field', field);
  return apiRequest(
    `/admin/customers/${accountHolderId}/kyc-documents?${params.toString()}`,
    withToken(),
  );
}

export async function fetchKycDocumentBlob(filename) {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Not signed in.');
  }

  const url = `${getApiBaseUrl()}/admin/customers/documents/${encodeURIComponent(filename)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load document preview.');
  }

  return response.blob();
}

export async function approveCustomerKyc(accountHolderId, field) {
  return apiRequest(`/admin/customers/${accountHolderId}/kyc/${field}/approve`, withToken({
    method: 'POST',
  }));
}

export async function rejectCustomerKyc(accountHolderId, field, reason) {
  return apiRequest(`/admin/customers/${accountHolderId}/kyc/${field}/reject`, withToken({
    method: 'POST',
    body: { reason },
  }));
}

export async function banCustomer(accountHolderId, reason) {
  return apiRequest(`/admin/customers/${accountHolderId}/ban`, withToken({
    method: 'POST',
    body: { reason },
  }));
}

export async function unbanCustomer(accountHolderId) {
  return apiRequest(`/admin/customers/${accountHolderId}/unban`, withToken({
    method: 'POST',
  }));
}

export async function updateCustomerPartner(accountHolderId, isPartner) {
  return apiRequest(`/admin/customers/${accountHolderId}/partner`, withToken({
    method: 'POST',
    body: { is_partner: isPartner },
  }));
}

export async function banMultipleCustomers(accountHolderIds) {
  return apiRequest('/admin/customers/ban-multiple', withToken({
    method: 'POST',
    body: { account_holder_ids: accountHolderIds },
  }));
}

export async function updateCustomerEmail(accountHolderId, email) {
  return apiRequest(`/admin/customers/${accountHolderId}/email`, withToken({
    method: 'PATCH',
    body: { email },
  }));
}

export async function sendCustomerEmail({ receivers, subject, body, attachment }) {
  const formData = new FormData();
  formData.append('receivers', receivers);
  formData.append('subject', subject);
  formData.append('body', body);
  if (attachment) {
    formData.append('attachment', attachment);
  }
  return apiFormRequest('/admin/customers/email/send', withToken({
    method: 'POST',
    formData,
  }));
}

export async function sendCustomerSms({ mobileNumbers, message }) {
  return apiRequest('/admin/customers/sms/send', withToken({
    method: 'POST',
    body: { mobile_numbers: mobileNumbers, message },
  }));
}
