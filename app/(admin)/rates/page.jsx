"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import RatesPanel from "@/components/admin/rates-panel";
import { fetchRatePaymentOptions } from "@/lib/rates";
import { RATES } from "@/lib/mock-data";

const FALLBACK_METHODS = RATES.map((row) => row.method);

function resolveMethod(raw, methods) {
  if (!methods.length) return FALLBACK_METHODS[0];
  if (raw && methods.some((name) => name.toLowerCase() === raw.toLowerCase())) {
    return methods.find((name) => name.toLowerCase() === raw.toLowerCase());
  }
  return methods[0];
}

function RatesContent() {
  const params = useSearchParams();
  const [methods, setMethods] = useState(FALLBACK_METHODS);
  const [method, setMethod] = useState(() => resolveMethod(params.get("method"), FALLBACK_METHODS));

  const loadMethods = useCallback(async () => {
    try {
      const data = await fetchRatePaymentOptions();
      const names = (data.paymentOptions || []).map((option) => option.name).filter(Boolean);
      if (names.length) {
        setMethods(names);
        setMethod((current) => resolveMethod(params.get("method") || current, names));
      }
    } catch {
      setMethods(FALLBACK_METHODS);
    }
  }, [params]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  useEffect(() => {
    setMethod(resolveMethod(params.get("method"), methods));
  }, [params, methods]);

  function selectMethod(nextMethod) {
    setMethod(nextMethod);
    const url = new URL(window.location.href);
    url.searchParams.set("method", nextMethod);
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Configurations & Rates", href: "/configs" },
          { label: "Rates Management" },
          { label: method },
        ]}
      />
      <div className="admin-fade-up">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-admin-teal/25 bg-admin-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-teal">
          Exchange rates
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white">Rates Management</h1>
      </div>

      <div className="mt-5 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-admin-chrome-deep/80 p-1">
        {methods.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => selectMethod(name)}
            className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
              method === name
                ? "bg-gradient-to-r from-admin-teal to-admin-teal-deep text-white"
                : "text-slate-500 hover:text-white"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <RatesPanel method={method} />
    </div>
  );
}

export default function RatesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading rates…</div>}>
      <RatesContent />
    </Suspense>
  );
}
