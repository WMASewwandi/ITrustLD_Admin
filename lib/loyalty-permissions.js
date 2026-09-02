export const LOYALTY_ORDERS_READ = 'read_loyalty_orders_data';
export const LOYALTY_ORDERS_UPDATE = 'status_update_loyalty_orders_data';
export const AUTHORIZE_LOYALTY_ORDERS = 'authorize_loyalty_orders_data';

export const LOYALTY_BONUS_READ = 'read_loyalty_bonus_claims_data';
export const LOYALTY_BONUS_UPDATE = 'status_update_loyalty_bonus_claims_data';

export const LOYALTY_VOUCHER_READ = 'read_loyalty_voucher_claims_data';
export const LOYALTY_VOUCHER_UPDATE = 'status_update_loyalty_voucher_claims_data';

export const LOYALTY_MANAGEMENT_READ = 'read_loyalty_management_data';
export const LOYALTY_MANAGEMENT_UPDATE = 'change_loyalty_management_data';

export const LOYALTY_GIFTS_READ = 'read_loyalty_gifts_data';
export const LOYALTY_GIFTS_CLAIMS_UPDATE = 'status_update_loyalty_gifts_data';
export const LOYALTY_GIFTS_CATALOG_UPDATE = 'change_loyalty_gifts_data';

const LEGACY_LOYALTY_READ = 'read_customer_loyalty_data';
const LEGACY_LOYALTY_UPDATE = 'change_customer_loyalty_status';

const READ_ALIASES = {
  [LOYALTY_ORDERS_READ]: [LEGACY_LOYALTY_READ],
  [LOYALTY_BONUS_READ]: [LEGACY_LOYALTY_READ],
  [LOYALTY_VOUCHER_READ]: [LEGACY_LOYALTY_READ],
  [LOYALTY_MANAGEMENT_READ]: [LEGACY_LOYALTY_READ, 'view_account_configs'],
  [LOYALTY_GIFTS_READ]: [LEGACY_LOYALTY_READ],
};

const UPDATE_ALIASES = {
  [LOYALTY_ORDERS_UPDATE]: [LEGACY_LOYALTY_UPDATE],
  [LOYALTY_BONUS_UPDATE]: [LEGACY_LOYALTY_UPDATE],
  [LOYALTY_VOUCHER_UPDATE]: [LEGACY_LOYALTY_UPDATE],
  [LOYALTY_MANAGEMENT_UPDATE]: ['change_account_configs'],
  [LOYALTY_GIFTS_CLAIMS_UPDATE]: [LEGACY_LOYALTY_UPDATE],
  [LOYALTY_GIFTS_CATALOG_UPDATE]: ['change_account_configs'],
};

export const LOYALTY_TAB_READ = {
  orders: LOYALTY_ORDERS_READ,
  bonus: LOYALTY_BONUS_READ,
  vouchers: LOYALTY_VOUCHER_READ,
  management: LOYALTY_MANAGEMENT_READ,
  gifts: LOYALTY_GIFTS_READ,
};

export const LOYALTY_TAB_UPDATE = {
  orders: LOYALTY_ORDERS_UPDATE,
  bonus: LOYALTY_BONUS_UPDATE,
  vouchers: LOYALTY_VOUCHER_UPDATE,
  management: LOYALTY_MANAGEMENT_UPDATE,
  gifts: LOYALTY_GIFTS_CLAIMS_UPDATE,
};

export const LOYALTY_LANDING_ROUTES = [
  { permission: AUTHORIZE_LOYALTY_ORDERS, href: '/loyalty?tab=orders&status=Pending%20Authorization' },
  { permission: LOYALTY_ORDERS_READ, href: '/loyalty?tab=orders&status=Pending' },
  { permission: LOYALTY_BONUS_READ, href: '/loyalty?tab=bonus&status=Pending' },
  { permission: LOYALTY_VOUCHER_READ, href: '/loyalty?tab=vouchers&status=Pending' },
  { permission: LOYALTY_MANAGEMENT_READ, href: '/loyalty?tab=management&audience=normal' },
  { permission: LOYALTY_GIFTS_READ, href: '/loyalty?tab=gifts&section=catalog' },
];

export const ALL_LOYALTY_READ_PERMISSIONS = [
  LOYALTY_ORDERS_READ,
  LOYALTY_BONUS_READ,
  LOYALTY_VOUCHER_READ,
  LOYALTY_MANAGEMENT_READ,
  LOYALTY_GIFTS_READ,
];

function hasWithAliases(userPermissions, required) {
  const list = Array.isArray(userPermissions) ? userPermissions : [];
  if (list.includes(required)) return true;
  const aliases = READ_ALIASES[required] || UPDATE_ALIASES[required] || [];

  // Once a role uses section-wise loyalty permissions, we should not “re-expand”
  // missing sections via legacy broad permissions. This prevents cases like:
  // Gifts read disabled, but legacy `read_customer_loyalty_data` still makes
  // the Gift navigation appear.
  const hasAnySectionWiseLoyaltyRead = list.some((p) => ALL_LOYALTY_READ_PERMISSIONS.includes(p));
  // If no section-wise loyalty read permissions are present at all,
  // treat legacy broad loyalty read as NOT granting any section navigation.
  if (!hasAnySectionWiseLoyaltyRead) return false;

  const effectiveAliases = aliases.filter((a) => a !== LEGACY_LOYALTY_READ && a !== LEGACY_LOYALTY_UPDATE);

  return effectiveAliases.some((alias) => list.includes(alias));
}

export function hasLoyaltyPermission(userPermissions, required) {
  return hasWithAliases(userPermissions, required);
}

export function hasAnyLoyaltyRead(userPermissions) {
  const list = Array.isArray(userPermissions) ? userPermissions : [];
  if (list.includes(AUTHORIZE_LOYALTY_ORDERS)) return true;
  return ALL_LOYALTY_READ_PERMISSIONS.some((permission) =>
    hasWithAliases(userPermissions, permission),
  );
}

export function hasLoyaltyTabRead(userPermissions, tabId) {
  const list = Array.isArray(userPermissions) ? userPermissions : [];
  if (tabId === 'orders' && list.includes(AUTHORIZE_LOYALTY_ORDERS)) return true;
  const required = LOYALTY_TAB_READ[tabId];
  return required ? hasWithAliases(userPermissions, required) : false;
}

export function canAuthorizeLoyaltyOrders(userPermissions) {
  const list = Array.isArray(userPermissions) ? userPermissions : [];
  return list.includes(AUTHORIZE_LOYALTY_ORDERS);
}

export function hasLoyaltyTabUpdate(userPermissions, tabId) {
  const required = LOYALTY_TAB_UPDATE[tabId];
  return required ? hasWithAliases(userPermissions, required) : false;
}

export function hasLoyaltyGiftsCatalogUpdate(userPermissions) {
  return hasWithAliases(userPermissions, LOYALTY_GIFTS_CATALOG_UPDATE);
}

export function resolveFirstLoyaltyHref(userPermissions) {
  for (const route of LOYALTY_LANDING_ROUTES) {
    if (hasWithAliases(userPermissions, route.permission)) {
      return route.href;
    }
  }
  return null;
}
