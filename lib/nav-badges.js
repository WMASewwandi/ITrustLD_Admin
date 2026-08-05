function badgeCount(value) {
  const n = Number(value);
  return n > 0 ? n : undefined;
}

const HREF_BADGES = {
  '/users?filter=pending': (c) => c?.users?.pending,
  '/users?filter=address-pending': (c) => c?.users?.address_pending,
  '/users?filter=nic-pending': (c) => c?.users?.nic_pending,
  '/transactions?tab=deposits&status=Pending': (c) => c?.deposits?.pending,
  '/transactions?tab=withdrawals&status=Pending': (c) => c?.withdrawals?.pending,
  '/loyalty?tab=orders&status=Pending': (c) => c?.loyalty?.orders,
  '/loyalty?tab=bonus&status=Pending': (c) => c?.loyalty?.bonus,
  '/loyalty?tab=vouchers&status=Pending': (c) => c?.loyalty?.vouchers,
  '/loyalty?tab=gifts&section=catalog': (c) => c?.loyalty?.gifts,
  '/loyalty?tab=gifts': (c) => c?.loyalty?.gifts,
  '/help-tickets': (c) => c?.help_tickets?.unread,
};

const CATEGORY_BADGES = {
  users: (c) => c?.users?.pending,
  transactions: (c) => (c?.deposits?.pending || 0) + (c?.withdrawals?.pending || 0),
  loyalty: (c) =>
    (c?.loyalty?.orders || 0) +
    (c?.loyalty?.bonus || 0) +
    (c?.loyalty?.vouchers || 0) +
    (c?.loyalty?.gifts || 0),
};

const GROUP_BADGES = {
  'Pending Users': (c) => c?.users?.pending,
  Deposits: (c) => c?.deposits?.pending,
  Withdrawals: (c) => c?.withdrawals?.pending,
  Orders: (c) => c?.loyalty?.orders,
  'Bonus Claims': (c) => c?.loyalty?.bonus,
  'Voucher Claims': (c) => c?.loyalty?.vouchers,
  Gift: (c) => c?.loyalty?.gifts,
};

export function applyNavBadges(nav, counts) {
  if (!counts) return nav;

  return nav.map((cat) => ({
    ...cat,
    badge: badgeCount(CATEGORY_BADGES[cat.id]?.(counts)),
    summary: buildCategorySummary(cat.id, counts),
    groups: cat.groups?.map((group) => ({
      ...group,
      badge: badgeCount(GROUP_BADGES[group.label]?.(counts)),
      items: group.items?.map((item) => ({
        ...item,
        badge: badgeCount(HREF_BADGES[item.href]?.(counts)),
      })),
    })),
  }));
}

export function applyBookmarkBadges(bookmarks, counts) {
  if (!counts) return bookmarks;

  return bookmarks.map((bookmark) => ({
    ...bookmark,
    badge: badgeCount(HREF_BADGES[bookmark.href]?.(counts)),
  }));
}

function buildCategorySummary(catId, counts) {
  if (catId === 'users') {
    const n = counts?.users?.pending;
    return n != null ? `Pending KYC: ${n}` : undefined;
  }
  if (catId === 'transactions') {
    const d = counts?.deposits?.pending ?? 0;
    const w = counts?.withdrawals?.pending ?? 0;
    return `Deposits: ${d} · Withdrawals: ${w}`;
  }
  if (catId === 'loyalty') {
    const o = counts?.loyalty?.orders ?? 0;
    const b = counts?.loyalty?.bonus ?? 0;
    const v = counts?.loyalty?.vouchers ?? 0;
    const g = counts?.loyalty?.gifts ?? 0;
    return `Orders: ${o} · Bonus: ${b} · Vouchers: ${v} · Gifts: ${g}`;
  }
  return undefined;
}

export function buildNotificationItems(counts) {
  if (!counts) return [];

  const items = [
    {
      label: 'Deposits',
      count: counts.deposits?.pending,
      detail: 'pending approvals',
      href: '/transactions?tab=deposits&status=Pending',
      permission: 'read_deposit_data',
    },
    {
      label: 'Withdrawals',
      count: counts.withdrawals?.pending,
      detail: 'awaiting processing',
      href: '/transactions?tab=withdrawals&status=Pending',
      permission: 'read_withdrawal_data',
    },
    {
      label: 'Users',
      count: counts.users?.pending,
      detail: 'KYC pending',
      href: '/users?filter=pending',
      permission: 'read_customer_accounts_data',
    },
    {
      label: 'Help Tickets',
      count: counts.help_tickets?.unread,
      detail: 'unread support tickets',
      href: '/help-tickets',
      permission: 'read_help_requests',
    },
    {
      label: 'Loyalty',
      count:
        (counts.loyalty?.orders || 0) +
        (counts.loyalty?.bonus || 0) +
        (counts.loyalty?.vouchers || 0) +
        (counts.loyalty?.gifts || 0),
      detail: 'pending claims/orders',
      href: '/loyalty?tab=vouchers&status=Pending',
      permission: 'read_customer_loyalty_data',
    },
  ];

  return items.filter((item) => item.count > 0);
}
