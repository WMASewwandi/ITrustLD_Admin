"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import CurrencyTypesPanel from "@/components/admin/currency-types-panel";
import PayAccountsPanel from "@/components/admin/pay-accounts-panel";
import PaymentMethodsPanel from "@/components/admin/payment-methods-panel";
import WalletsPanel from "@/components/admin/wallets-panel";

const TABS = [
  { id: "pay-accounts", label: "Pay Accounts" },
  { id: "currencies", label: "Currency Types" },
  { id: "wallets", label: "Wallets" },
  { id: "methods", label: "Payment Methods" },
  { id: "user-count", label: "User Count Display" },
];

const TAB_ALIASES = {
  "topup-wallets": "wallets",
  "payment-methods": "methods",
};

function resolveTab(raw) {
  if (!raw) return "pay-accounts";
  const id = TAB_ALIASES[raw] || raw;
  return TABS.some((t) => t.id === id) ? id : "pay-accounts";
}

function ConfigsContent() {
  const params = useSearchParams();
  const [tab, setTab] = useState(() => resolveTab(params.get("tab")));
  const [baseCount, setBaseCount] = useState(200);
  const [liveAdds, setLiveAdds] = useState(47);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTab(resolveTab(params.get("tab")));
  }, [params]);

  function selectTab(id) {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Configurations & Rates", href: "/configs" },
          { label: TABS.find((t) => t.id === tab)?.label },
        ]}
      />
      <div className="admin-fade-up">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-admin-teal/25 bg-admin-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-teal">
          Platform setup
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurations</h1>
      </div>
      <div className="mt-5 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-admin-chrome-deep/80 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-gradient-to-r from-admin-teal to-admin-teal-deep text-white"
                : "text-slate-500 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pay-accounts" ? <PayAccountsPanel /> : null}

      {tab === "currencies" ? <CurrencyTypesPanel /> : null}

      {tab === "wallets" ? <WalletsPanel /> : null}

      {tab === "methods" ? <PaymentMethodsPanel /> : null}

      {tab === "user-count" ? (
        <section className="admin-card mt-5 max-w-xl p-5">
          <h2 className="text-lg font-semibold text-white">Dynamic User Count Display</h2>
          <p className="mt-1 text-sm text-slate-400">
            Set the initial public user count. New registrations increase it automatically; deactivations decrease it.
          </p>
          <label className="mt-4 block text-sm text-slate-400">
            Initial / base count
            <input
              type="number"
              min={0}
              value={baseCount}
              onChange={(e) => {
                setBaseCount(Number(e.target.value) || 0);
                setSaved(false);
              }}
              className="admin-input mt-1"
            />
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Live additions</p>
              <p className="mt-1 text-2xl font-bold text-white">+{liveAdds}</p>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Displayed count</p>
              <p className="mt-1 text-2xl font-bold text-teal-300">{baseCount + liveAdds}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setLiveAdds((n) => n + 1);
                setSaved(false);
              }}
              className="admin-btn-secondary"
            >
              Simulate new user
            </button>
            <button
              type="button"
              onClick={() => {
                setSaved(true);
              }}
              className="admin-btn-primary"
            >
              Save base count
            </button>
          </div>
          {saved ? <p className="mt-3 text-sm text-theme-green-action">Base count saved (frontend demo).</p> : null}
        </section>
      ) : null}
    </div>
  );
}

export default function ConfigsPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">Loading configs…</div>}>
      <ConfigsContent />
    </Suspense>
  );
}
