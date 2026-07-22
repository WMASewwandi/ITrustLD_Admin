import { LOYALTY_TIERS } from "@/lib/mock-data";

const KEY = "itrustld_admin_loyalty_tiers";
const VERSION_KEY = "itrustld_admin_loyalty_tiers_version";
const VERSION = 1;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function seed() {
  return LOYALTY_TIERS.map((t) => ({
    ...t,
    benefits: Array.isArray(t.benefits) ? [...t.benefits] : [],
  }));
}

export function getLoyaltyTiers() {
  if (!canUseStorage()) return seed();
  try {
    const version = Number(localStorage.getItem(VERSION_KEY) || 0);
    const raw = localStorage.getItem(KEY);
    if (!raw || version < VERSION) {
      const seeded = seed();
      localStorage.setItem(KEY, JSON.stringify(seeded));
      localStorage.setItem(VERSION_KEY, String(VERSION));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = seed();
      localStorage.setItem(KEY, JSON.stringify(seeded));
      localStorage.setItem(VERSION_KEY, String(VERSION));
      return seeded;
    }
    return parsed.map((t) => ({
      ...t,
      benefits: Array.isArray(t.benefits) ? t.benefits : [],
    }));
  } catch {
    return seed();
  }
}

export function saveLoyaltyTiers(tiers) {
  if (!canUseStorage()) return;
  localStorage.setItem(KEY, JSON.stringify(tiers));
  localStorage.setItem(VERSION_KEY, String(VERSION));
}
