import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchShiftCalendar({ year, month }) {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  const qs = params.toString();
  return apiRequest(`/admin/shifts/calendar${qs ? `?${qs}` : ''}`, withToken());
}

export async function updateShiftSchedule({ shift_date, active_shift }) {
  return apiRequest('/admin/shifts/schedule', {
    ...withToken(),
    method: 'PATCH',
    body: { shift_date, active_shift },
  });
}
