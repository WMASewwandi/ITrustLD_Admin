"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyCell({ value, sub }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* demo fallback */
    }
  }

  return (
    <div className="flex items-start gap-1.5">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-100">{value}</p>
        {sub ? <p className="truncate text-[11px] text-slate-500">{sub}</p> : null}
      </div>
      <button
        type="button"
        onClick={copy}
        className="mt-0.5 shrink-0 rounded p-0.5 text-slate-500 transition hover:bg-white/10 hover:text-teal-300"
        title="Copy"
      >
        {copied ? <Check className="h-3 w-3 text-theme-green-action" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

export function StatusPill({ status }) {
  const s = String(status || "");
  const tone = s.includes("Pending")
    ? "bg-amber-500 text-white"
    : s === "Completed" || s === "Claimed"
      ? "bg-theme-green-action text-white"
      : s === "Rejected"
        ? "bg-admin-danger text-white"
        : "bg-white/10 text-slate-300";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      {status}
    </span>
  );
}

export function FilterField({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-admin-chrome-deep px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-admin-teal/50 focus:ring-2 focus:ring-admin-teal/20";
