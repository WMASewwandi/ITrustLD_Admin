"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";
import { getLoyaltyTiers, saveLoyaltyTiers } from "@/lib/loyalty-tiers";

export default function LoyaltyTiersPage() {
  const [tiers, setTiers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = getLoyaltyTiers();
    setTiers(loaded);
    setExpandedId(loaded[0]?.id || null);
  }, []);

  function updateTier(id, patch) {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setSaved(false);
  }

  function updateBenefit(tierId, benefitIndex, value) {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        const benefits = [...(t.benefits || [])];
        benefits[benefitIndex] = value;
        return { ...t, benefits };
      })
    );
    setSaved(false);
  }

  function addBenefit(tierId) {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        return { ...t, benefits: [...(t.benefits || []), ""] };
      })
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
      })
    );
    setSaved(false);
  }

  function addTier() {
    const id = `tier-${Date.now()}`;
    const next = {
      id,
      name: "New tier",
      points: 0,
      active: true,
      benefits: ["New benefit detail"],
    };
    setTiers((prev) => [...prev, next]);
    setExpandedId(id);
    setSaved(false);
  }

  function removeTier(id) {
    setTiers((prev) => prev.filter((t) => t.id !== id));
    setSaved(false);
  }

  function handleSave() {
    const cleaned = tiers.map((t) => ({
      ...t,
      name: String(t.name || "").trim() || "Untitled",
      points: Number(t.points) || 0,
      benefits: (t.benefits || []).map((b) => String(b).trim()).filter(Boolean),
    }));
    setTiers(cleaned);
    saveLoyaltyTiers(cleaned);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
            Manage Normal → VVIP tiers and add multiple benefit details for each tier. These drive the
            user Loyalty Levels benefits reveal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addTier}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            Add tier
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Save className="h-4 w-4" />
            Save tiers
          </button>
        </div>
      </div>

      {saved ? (
        <p className="mb-4 rounded-xl border border-theme-green-action/30 bg-theme-green-action/10 px-4 py-2 text-sm text-theme-green-action">
          Loyalty tiers and benefits saved.
        </p>
      ) : null}

      <div className="space-y-3">
        {tiers.map((tier, index) => {
          const open = expandedId === tier.id;
          return (
            <section key={tier.id} className="admin-card admin-fade-up overflow-visible p-0">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-teal/15 text-xs font-bold text-admin-teal">
                    {index + 1}
                  </span>
                  <input
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                    className={`${inputCls} max-w-[180px] font-semibold`}
                    aria-label="Tier name"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    Points
                    <input
                      value={tier.points}
                      onChange={(e) =>
                        updateTier(tier.id, {
                          points: Number(String(e.target.value).replace(/\D/g, "")) || 0,
                        })
                      }
                      inputMode="numeric"
                      className={`${inputCls} w-32`}
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(tier.active)}
                      onChange={(e) => updateTier(tier.id, { active: e.target.checked })}
                      className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action"
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
                  <button
                    type="button"
                    onClick={() => removeTier(tier.id)}
                    disabled={tiers.length <= 1}
                    className="rounded-lg bg-[#E11D48] p-2 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Remove tier"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {open ? (
                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">
                      Benefits – {tier.name || "Tier"} Level
                    </h3>
                    <button
                      type="button"
                      onClick={() => addBenefit(tier.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-theme-green-action/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add benefit
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(tier.benefits || []).length === 0 ? (
                      <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-slate-500">
                        No benefits yet. Click “Add benefit” to add details for this tier.
                      </p>
                    ) : (
                      (tier.benefits || []).map((benefit, bi) => (
                        <div key={`${tier.id}-b-${bi}`} className="flex items-start gap-2">
                          <span className="mt-3 text-xs font-semibold text-slate-500">{bi + 1}.</span>
                          <textarea
                            value={benefit}
                            onChange={(e) => updateBenefit(tier.id, bi, e.target.value)}
                            rows={2}
                            placeholder="Benefit detail…"
                            className={`${inputCls} min-h-[44px] resize-y`}
                          />
                          <button
                            type="button"
                            onClick={() => removeBenefit(tier.id, bi)}
                            className="mt-1 rounded-lg bg-[#E11D48]/90 p-2 text-white transition hover:brightness-110"
                            title="Remove benefit"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
