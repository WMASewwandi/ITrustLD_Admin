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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurations</h1>
      </div>
      <div className="mt-5 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-gradient-to-r from-admin-teal to-admin-teal-deep text-white"
                : "text-slate-500 hover:text-slate-900"
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
