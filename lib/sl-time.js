export const SL_TIMEZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE || 'Asia/Colombo';

const SL_OFFSET = '+05:30';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function getColomboDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function parseDbDateTime(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const parsed = new Date(`${normalized}${SL_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateTimeParts(value) {
  const date = parseDbDateTime(value);
  if (!date) {
    return { date: '—', time: '', raw: value };
  }

  const parts = getColomboDateParts(date);
  return {
    date: `${pad2(parts.month)}/${pad2(parts.day)}/${parts.year}`,
    time: `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`,
    raw: value,
  };
}

export function formatDateSl(value, options = {}) {
  const date = parseDbDateTime(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', {
    timeZone: SL_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTimeDisplaySl(value, options = {}) {
  const date = parseDbDateTime(value);
  if (!date) return '—';
  return date.toLocaleString('en-GB', {
    timeZone: SL_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options,
  });
}

export function todayYmdColombo() {
  const parts = getColomboDateParts();
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}
