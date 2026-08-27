import { hasLoyaltyPermission } from '@/lib/loyalty-permissions';

/**
 * Check if the user has at least one of the required permissions.
 * @param {string[]} userPermissions
 * @param {string | string[] | null | undefined} required
 */
export function hasPermission(userPermissions, required) {
  if (!required) return true;
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) return false;
  const requiredList = Array.isArray(required) ? required : [required];
  if (requiredList.some((permission) => userPermissions.includes(permission))) return true;
  return requiredList.some((permission) => hasLoyaltyPermission(userPermissions, permission));
}

function filterItems(items = [], permissions) {
  return items
    .filter((item) => hasPermission(permissions, item.permission))
    .map((item) => ({
      ...item,
      items: item.items ? filterItems(item.items, permissions) : undefined,
    }));
}

function filterGroups(groups = [], permissions) {
  return groups
    .map((group) => {
      if (group.permission && !hasPermission(permissions, group.permission)) return null;
      const items = filterItems(group.items || [], permissions);
      if (items.length === 0) return null;
      return { ...group, items };
    })
    .filter(Boolean);
}

/**
 * Filter TOP_NAV categories by the signed-in user's permissions.
 */
export function filterNavByPermissions(nav = [], permissions = []) {
  return nav
    .map((category) => {
      if (category.href) {
        return hasPermission(permissions, category.permission) ? category : null;
      }
      const groups = filterGroups(category.groups || [], permissions);
      if (groups.length === 0) return null;
      return { ...category, groups };
    })
    .filter(Boolean);
}

export function filterBookmarksByPermissions(bookmarks = [], permissions = []) {
  return bookmarks.filter((bookmark) => hasPermission(permissions, bookmark.permission));
}

function filterNavItemsRecursive(items = [], permissions) {
  return items
    .map((item) => {
      if (item.items?.length) {
        if (item.permission && !hasPermission(permissions, item.permission)) return null;
        const children = filterNavItemsRecursive(item.items, permissions);
        if (children.length === 0) return null;
        return { ...item, items: children };
      }
      return hasPermission(permissions, item.permission) ? item : null;
    })
    .filter(Boolean);
}

export function filterSidebarSections(sections = [], permissions = []) {
  return sections
    .map((section) => {
      if (section.href) {
        return hasPermission(permissions, section.permission) ? section : null;
      }
      if (section.permission && !hasPermission(permissions, section.permission)) return null;
      const items = filterNavItemsRecursive(section.items || [], permissions);
      if (items.length === 0) return null;
      return { ...section, items };
    })
    .filter(Boolean);
}

/** First navigable href from permission-filtered TOP_NAV (for access-denied redirects). */
export function getFirstAllowedNavHref(nav = [], permissions = []) {
  const filtered = filterNavByPermissions(nav, permissions);
  for (const category of filtered) {
    if (category.href) return category.href;
    for (const group of category.groups || []) {
      for (const item of group.items || []) {
        if (item.href) return item.href;
      }
    }
  }
  return null;
}

import { LOYALTY_LANDING_ROUTES } from '@/lib/loyalty-permissions';

const PERMISSION_LANDING_ROUTES = [
  { permission: "view_admin_dashboard", href: "/dashboard" },
  { permission: "read_customer_accounts_data", href: "/users?filter=pending" },
  { permission: "read_mobile_verification_pending", href: "/users?filter=mobile-pending" },
  { permission: "read_deposit_data", href: "/transactions?tab=deposits&status=Pending" },
  { permission: "authorize_withdrawal_data", href: "/transactions?tab=withdrawals&status=Pending%20Authorization" },
  { permission: "read_withdrawal_data", href: "/transactions?tab=withdrawals&status=Pending" },
  ...LOYALTY_LANDING_ROUTES,
  { permission: "role_manage_activity", href: "/system/roles" },
  { permission: "system_user_manage_activity", href: "/system/users" },
  { permission: "view_shift_schedule", href: "/system/shifts" },
  { permission: "view_account_configs", href: "/configs" },
  { permission: "view_currency_configs", href: "/rates" },
  { permission: "manage_blog_posts", href: "/content/blogs" },
  { permission: "read_help_requests", href: "/help-tickets" },
];

/**
 * Post-login landing path (mirrors backend resolveAdminRedirect).
 */
export function resolveAdminLandingPath(roles = [], permissions = []) {
  if (roles.includes("deposit-executive")) {
    return "/transactions?tab=deposits&status=Pending";
  }
  if (roles.includes("withdrawal-executive")) {
    return "/transactions?tab=withdrawals&status=Pending";
  }
  if (
    hasPermission(permissions, "authorize_withdrawal_data") &&
    !roles.includes("super-admin") &&
    !roles.includes("sub-admin")
  ) {
    return "/transactions?tab=withdrawals&status=Pending%20Authorization";
  }
  if (roles.includes("sub-admin")) {
    return "/users?filter=pending";
  }
  if (roles.includes("super-admin") && hasPermission(permissions, "view_admin_dashboard")) {
    return "/dashboard";
  }
  if (hasPermission(permissions, "view_admin_dashboard")) {
    return "/dashboard";
  }
  for (const route of PERMISSION_LANDING_ROUTES) {
    if (hasPermission(permissions, route.permission)) {
      return route.href;
    }
  }
  if (roles.includes("super-admin")) {
    return "/dashboard";
  }
  return null;
}
