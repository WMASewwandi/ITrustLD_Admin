import { PARTNER_TIERS, USERS } from "@/lib/mock-data";

const TIERS_KEY = "itrustld_admin_partner_tiers";
const TIERS_VERSION_KEY = "itrustld_admin_partner_tiers_version";
const TIERS_VERSION = 2;
const ACCOUNTS_KEY = "itrustld_admin_partner_accounts";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isLegacyTierLadder(tiers) {
  if (!Array.isArray(tiers) || tiers.length === 0) return true;
  const names = tiers.map((t) => String(t.name || "").toLowerCase());
  return names.includes("bronze") || names.includes("platinum") || !names.includes("normal") || !names.includes("vvip");
}

function seedPartnerAccounts() {
  const fromUsers = USERS.map((u) => {
    const isPartner = String(u.partner).toLowerCase() === "yes" || u.partner === "Affiliate";
    return {
      id: u.id,
      accountId: u.accountId,
      name: u.name,
      email: u.email,
      mobile: u.mobile,
      partner: isPartner,
      partnerTier: isPartner ? "Normal" : null,
      partnerPoints: isPartner ? 45 : 0,
    };
  });

  const hasDemo = fromUsers.some((a) => a.email.toLowerCase() === "partner@itrustld.com");
  if (!hasDemo) {
    fromUsers.unshift({
      id: "U-PARTNER",
      accountId: "88001001",
      name: "Partner Demo",
      email: "partner@itrustld.com",
      mobile: "+94 77 000 1001",
      partner: true,
      partnerTier: "Normal",
      partnerPoints: 45,
    });
  }
  return fromUsers;
}

export function getPartnerTiers() {
  if (!canUseStorage()) return PARTNER_TIERS.map((t) => ({ ...t }));
  try {
    const version = Number(localStorage.getItem(TIERS_VERSION_KEY) || 0);
    const raw = localStorage.getItem(TIERS_KEY);
    if (!raw || version < TIERS_VERSION) {
      const seeded = PARTNER_TIERS.map((t) => ({ ...t }));
      localStorage.setItem(TIERS_KEY, JSON.stringify(seeded));
      localStorage.setItem(TIERS_VERSION_KEY, String(TIERS_VERSION));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (isLegacyTierLadder(parsed)) {
      const seeded = PARTNER_TIERS.map((t) => ({ ...t }));
      localStorage.setItem(TIERS_KEY, JSON.stringify(seeded));
      localStorage.setItem(TIERS_VERSION_KEY, String(TIERS_VERSION));
      return seeded;
    }
    return parsed;
  } catch {
    return PARTNER_TIERS.map((t) => ({ ...t }));
  }
}

export function savePartnerTiers(tiers) {
  if (!canUseStorage()) return;
  localStorage.setItem(TIERS_KEY, JSON.stringify(tiers));
  localStorage.setItem(TIERS_VERSION_KEY, String(TIERS_VERSION));
}

export function getPartnerAccounts() {
  if (!canUseStorage()) return seedPartnerAccounts();
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      const seeded = seedPartnerAccounts();
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = seedPartnerAccounts();
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    // Migrate legacy Bronze/Platinum labels on accounts
    return parsed.map((acc) => {
      if (!acc.partner) return acc;
      if (acc.partnerTier === "Bronze") return { ...acc, partnerTier: "Normal" };
      if (acc.partnerTier === "Platinum") return { ...acc, partnerTier: "Diamond" };
      return acc;
    });
  } catch {
    return seedPartnerAccounts();
  }
}

export function savePartnerAccounts(accounts) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
