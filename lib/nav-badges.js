function badgeCount(value) {
  const n = Number(value);
  return n > 0 ? n : undefined;
}

const HREF_BADGES = {
  '/users?filter=pending': (c) => c?.users?.pending,
  '/users?filter=address-pending': (c) => c?.users?.address_pending,
  '/users?filter=nic-pending': (c) => c?.users?.nic_pending,
  '/users?filter=mobile-pending': () => undefined,
  '/transactions?tab=deposits&status=Pending': (c) => c?.deposits?.pending,
  '/transactions?tab=withdrawals&status=Pending': (c) => c?.withdrawals?.pending,
  '/transactions?tab=withdrawals&status=Pending%20Authorization': (c) =>
    c?.withdrawals?.pending_authorization,
  '/transactions?tab=withdrawals&status=Pending Authorization': (c) =>
    c?.withdrawals?.pending_authorization,
  '/loyalty?tab=orders&status=Pending': (c) => c?.loyalty?.orders,
  '/loyalty?tab=bonus&status=Pending': (c) => c?.loyalty?.bonus,
  '/loyalty?tab=vouchers&status=Pending': (c) => c?.loyalty?.vouchers,
  '/loyalty?tab=gifts&section=catalog': (c) => c?.loyalty?.gifts,
  '/loyalty?tab=gifts': (c) => c?.loyalty?.gifts,
  '/help-tickets': (c) => c?.help_tickets?.unread,
};

const CATEGORY_BADGES = {
  users: (c) => c?.users?.pending,
  transactions: (c) =>
    (c?.deposits?.pending || 0) +
    (c?.withdrawals?.pending || 0) +
    (c?.withdrawals?.pending_authorization || 0),
  loyalty: (c) =>
    (c?.loyalty?.orders || 0) +
    (c?.loyalty?.bonus || 0) +
    (c?.loyalty?.vouchers || 0) +
    (c?.loyalty?.gifts || 0),
  system: (c) => c?.help_tickets?.unread,
};

const GROUP_BADGES = {
  'Pending Users': (c) => c?.users?.pending,
  Deposits: (c) => c?.deposits?.pending,
  Withdrawals: (c) =>
    (c?.withdrawals?.pending || 0) + (c?.withdrawals?.pending_authorization || 0),
  Orders: (c) => c?.loyalty?.orders,
  'Bonus Claims': (c) => c?.loyalty?.bonus,
  'Voucher Claims': (c) => c?.loyalty?.vouchers,
  Gift: (c) => c?.loyalty?.gifts,
  'Help & Support': (c) => c?.help_tickets?.unread,
};

export function applyNavBadges(nav, counts) {
  if (!counts) return nav;

  return nav.map((cat) => {
    const groups = cat.groups?.map((group) => ({
      ...group,
      badge: badgeCount(GROUP_BADGES[group.label]?.(counts)),
      items: group.items?.map((item) => ({
        ...item,
        badge: badgeCount(HREF_BADGES[item.href]?.(counts)),
      })),
    }));

    const groupBadgeTotal = (groups || []).reduce((sum, group) => sum + (Number(group.badge) || 0), 0);
    const badge =
      (cat.id === 'transactions' || cat.id === 'loyalty' || cat.id === 'system') && groups?.length
        ? badgeCount(groupBadgeTotal)
        : badgeCount(CATEGORY_BADGES[cat.id]?.(counts));

    return {
      ...cat,
      badge,
      summary: buildCategorySummary(cat.id, counts, groups),
      groups,
    };
  });
}

function isPendingWithdrawalsHref(href) {
  try {
    const url = new URL(String(href || ''), 'http://local');
    return (
      url.pathname === '/transactions' &&
      url.searchParams.get('tab') === 'withdrawals' &&
      url.searchParams.get('status') === 'Pending'
    );
  } catch {
    return false;
  }
}

function bookmarkBadgeValue(bookmark, counts) {
  if (isPendingWithdrawalsHref(bookmark.href)) {
    return (counts?.withdrawals?.pending || 0) + (counts?.withdrawals?.pending_authorization || 0);
  }
  return HREF_BADGES[bookmark.href]?.(counts);
}

export function applyBookmarkBadges(bookmarks, counts) {
  if (!counts) return bookmarks;

  return bookmarks.map((bookmark) => ({
    ...bookmark,
    badge: badgeCount(bookmarkBadgeValue(bookmark, counts)),
  }));
}

function buildCategorySummary(catId, counts, groups) {
  if (catId === 'users') {
    const n = counts?.users?.pending;
    return n != null ? `Pending KYC: ${n}` : undefined;
  }
  if (catId === 'transactions') {
    const parts = [];
    const hasDeposits = groups?.some((group) => group.label === 'Deposits');
    const hasWithdrawals = groups?.some((group) => group.label === 'Withdrawals');
    if (hasDeposits) parts.push(`Deposits: ${counts?.deposits?.pending ?? 0}`);
    if (hasWithdrawals) parts.push(`Withdrawals: ${counts?.withdrawals?.pending ?? 0}`);
    return parts.length ? parts.join(' · ') : undefined;
  }
  if (catId === 'loyalty') {
    const parts = [];
    if (groups?.some((group) => group.label === 'Orders')) {
      parts.push(`Orders: ${counts?.loyalty?.orders ?? 0}`);
    }
    if (groups?.some((group) => group.label === 'Bonus Claims')) {
      parts.push(`Bonus: ${counts?.loyalty?.bonus ?? 0}`);
    }
    if (groups?.some((group) => group.label === 'Voucher Claims')) {
      parts.push(`Vouchers: ${counts?.loyalty?.vouchers ?? 0}`);
    }
    if (groups?.some((group) => group.label === 'Gift')) {
      parts.push(`Gifts: ${counts?.loyalty?.gifts ?? 0}`);
    }
    return parts.length ? parts.join(' · ') : undefined;
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
      checkLoyaltyRead: true,
    },
  ];

  return items.filter((item) => item.count > 0);
}
