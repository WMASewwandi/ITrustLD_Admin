"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";
import {
  fetchLoyaltyMembershipTiers,
  saveLoyaltyMembershipTiers,
} from "@/lib/loyalty-tiers";
import { useCan } from "@/contexts/admin-permissions";
import { LOYALTY_MANAGEMENT_UPDATE } from "@/lib/loyalty-permissions";

const BENEFIT_AUDIENCES = [
  { value: "normal", label: "Normal" },
  { value: "affiliate", label: "Partner" },
  { value: "both", label: "Both" },
];

function normalizeBenefitItem(item) {
  if (typeof item === "string") {
    return { text: item, audience: "both" };
  }
  const audience = BENEFIT_AUDIENCES.some((option) => option.value === item?.audience)
    ? item.audience
    : "both";
  return { text: String(item?.text || ""), audience };
}

function normalizeTiers(list = []) {
  return list.map((tier) => ({
    ...tier,
    benefits: (tier.benefits || []).map(normalizeBenefitItem),
  }));
}

export default function LoyaltyTiersPage() {
  const canMutate = useCan(LOYALTY_MANAGEMENT_UPDATE);
  const [tiers, setTiers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const loadTiers = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const data = await fetchLoyaltyMembershipTiers();
      const loaded = normalizeTiers(data.tiers || []);
      setTiers(loaded);
      setExpandedId((current) => current || loaded[0]?.id || null);
    } catch (err) {
      setPageError(err.message || "Failed to load loyalty tiers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  function updateTier(id, patch) {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setSaved(false);
  }

  function updateBenefit(tierId, benefitIndex, patch) {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        const benefits = [...(t.benefits || [])];
        benefits[benefitIndex] = {
          ...normalizeBenefitItem(benefits[benefitIndex]),
          ...patch,
        };
        return { ...t, benefits };
      }),
    );
    setSaved(false);
  }

  function addBenefit(tierId) {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        return { ...t, benefits: [...(t.benefits || []), { text: "", audience: "both" }] };
      }),
    );
    setExpandedId(tierId);
    setSaved(false);
  }

  function removeBenefit(tierId, benefitIndex) {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        return {
          ...t,
          benefits: (t.benefits || []).filter((_, i) => i !== benefitIndex),
        };
      }),
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setPageError("");
    try {
      const cleaned = tiers.map((t) => ({
        id: t.id,
        slug: t.slug || t.id,
        name: t.name,
        points: Number(t.points) || 0,
        active: t.active !== false && t.isActive !== false,
        benefits: (t.benefits || [])
          .map(normalizeBenefitItem)
          .filter((b) => b.text.trim())
          .map((b) => ({ text: b.text.trim(), audience: b.audience })),
      }));
      const data = await saveLoyaltyMembershipTiers(cleaned);
      setTiers(normalizeTiers(data.tiers || cleaned));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setPageError(err.message || "Failed to save loyalty tiers.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Loyalty", href: "/loyalty" },
          { label: "Loyalty Tiers" },
        ]}
      />

      <div className="admin-fade-up mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-admin-teal/25 bg-admin-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-teal">
            Loyalty master
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Loyalty Tiers</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Fixed Normal → VVIP ladder. Edit point thresholds and benefit details per tier. Thresholds
            apply to membership ranking; existing users keep current behaviour until points are saved.
          </p>
        </div>
        {canMutate ? (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save tiers
        </button>
        ) : null}
      </div>

      {pageError ? (
        <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {pageError}
        </p>
      ) : null}

      {saved ? (
        <p className="mb-4 rounded-xl border border-theme-green-action/30 bg-theme-green-action/10 px-4 py-2 text-sm text-theme-green-action">
          Loyalty tier thresholds and benefits saved.
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-12 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading loyalty tiers…
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, index) => {
            const open = expandedId === tier.id;
            const isActive = tier.active !== false && tier.isActive !== false;
            return (
              <section key={tier.id} className="admin-card admin-fade-up overflow-visible p-0">
                <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-teal/15 text-xs font-bold text-admin-teal">
                      {index + 1}
                    </span>
                    <span className="min-w-[100px] text-base font-semibold text-white">{tier.name}</span>
                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                      Points:{" "}
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={Number(tier.points) || 0}
                        onChange={(e) => updateTier(tier.id, { points: e.target.value })}
                        disabled={!canMutate}
                        className="ml-1 w-24 rounded-md border border-white/10 bg-transparent px-1 py-0.5 text-xs font-semibold text-white outline-none focus:border-admin-teal/50 disabled:opacity-60"
                      />
                    </span>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(isActive)}
                        onChange={(e) =>
                          updateTier(tier.id, { active: e.target.checked, isActive: e.target.checked })
                        }
                        disabled={!canMutate}
                        className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action disabled:opacity-60"
                      />
                      Active
                    </label>
                    <span className="text-xs text-slate-500">
                      {(tier.benefits || []).length} benefit
                      {(tier.benefits || []).length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : tier.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/5"
                    >
                      {open ? (
                        <>
                          Hide benefits <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Edit benefits <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {open ? (
                  <div className="px-5 py-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Benefits – {tier.name || "Tier"} Level
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Choose whether each benefit applies to Normal users, Partners, or both.
                        </p>
                      </div>
                      {canMutate ? (
                      <button
                        type="button"
                        onClick={() => addBenefit(tier.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-theme-green-action/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add benefit
                      </button>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      {(tier.benefits || []).length === 0 ? (
                        <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-slate-500">
                          No benefits yet. Click “Add benefit” to add details for this tier.
                        </p>
                      ) : (
                        (tier.benefits || []).map((benefit, bi) => {
                          const item = normalizeBenefitItem(benefit);
                          return (
                          <div key={`${tier.id}-b-${bi}`} className="flex items-center gap-2">
                            <span className="w-5 shrink-0 text-xs font-semibold text-slate-500">{bi + 1}.</span>
                            <select
                              value={item.audience}
                              onChange={(e) => updateBenefit(tier.id, bi, { audience: e.target.value })}
                              disabled={!canMutate}
                              className={`${inputCls} w-[140px] shrink-0`}
                              aria-label="Benefit audience"
                            >
                              {BENEFIT_AUDIENCES.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => updateBenefit(tier.id, bi, { text: e.target.value })}
                              disabled={!canMutate}
                              placeholder="Benefit detail…"
                              className={inputCls}
                            />
                            {canMutate ? (
                            <button
                              type="button"
                              onClick={() => removeBenefit(tier.id, bi)}
                              className="shrink-0 rounded-lg bg-[#E11D48]/90 p-2 text-white transition hover:brightness-110"
                              title="Remove benefit"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            ) : null}
                          </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
