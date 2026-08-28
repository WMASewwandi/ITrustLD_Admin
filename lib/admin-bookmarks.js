const STORAGE_KEY = 'itrustld_admin_bookmarks';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function serializeBookmarks(bookmarks = []) {
  return bookmarks
    .filter((item) => item?.href && item?.label)
    .map((item) => ({
      label: String(item.label),
      href: String(item.href),
      permission: item.permission || undefined,
    }));
}

export function readStoredBookmarks() {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return serializeBookmarks(parsed);
  } catch {
    return null;
  }
}

export function writeStoredBookmarks(bookmarks = []) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeBookmarks(bookmarks)));
  } catch {
    // ignore quota / private mode
  }
}
