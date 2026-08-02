import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchHelpTickets({
  search = '',
  email = '',
  type = '',
  read = '',
  page = 1,
  perPage = 10,
} = {}) {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (email.trim()) params.set('email', email.trim());
  if (type.trim()) params.set('type', type.trim());
  if (read.trim()) params.set('read', read.trim());
  params.set('page', String(page));
  params.set('per_page', String(perPage));
  const query = params.toString();
  return apiRequest(`/admin/help-tickets${query ? `?${query}` : ''}`, withToken());
}

export async function fetchHelpTicket(id) {
  return apiRequest(`/admin/help-tickets/${id}`, withToken());
}

export async function markHelpTicketRead(id) {
  return apiRequest(`/admin/help-tickets/${id}/read`, {
    ...withToken(),
    method: 'PATCH',
  });
}

export async function markAllHelpTicketsRead() {
  return apiRequest('/admin/help-tickets/read-all', {
    ...withToken(),
    method: 'PATCH',
  });
}

export async function replyToHelpTicket(id, payload) {
  return apiRequest(`/admin/help-tickets/${id}/reply`, {
    ...withToken(),
    method: 'POST',
    body: payload,
  });
}

export const ADMIN_NAV_COUNTS_REFRESH_EVENT = 'admin-nav-counts-refresh';

export function notifyAdminNavCountsRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_NAV_COUNTS_REFRESH_EVENT));
  }
}
