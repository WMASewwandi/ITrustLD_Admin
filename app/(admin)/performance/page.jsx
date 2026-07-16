"use client";

import { useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/admin/breadcrumb";
import { ArrowUpRight, Target, Percent, Wallet } from "lucide-react";

const METRICS = [
  { label: "Transactions Handled", value: "148", icon: Target, glow: "bg-admin-teal", color: "text-admin-teal" },
  { label: "Success Rate", value: "94.2%", icon: Percent, glow: "bg-theme-green-action", color: "text-theme-green-action" },
  { label: "Commission Earned", value: "$1,240", icon: Wallet, glow: "bg-[#FBBF24]", color: "text-[#FBBF24]" },
];

export default function PerformancePage() {
  const [period, setPeriod] = useState("Weekly");

  return (
    <div>
      <Breadcrumb items={[{ label: "My Performance" }]} />
      <div className="admin-fade-up mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-admin-teal/25 bg-admin-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-teal">
            Executive scorecard
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Transactions handled, success rate, commission earned</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Daily", "Weekly", "Monthly"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                period === p
                  ? "bg-gradient-to-r from-admin-teal to-admin-teal-deep text-white"
                  : "border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {p}
            </button>
          ))}
          <Link
            href="/team-performance"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-600 transition hover:text-slate-900"
          >
            Team view
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {METRICS.map((m, i) => (
          <article key={m.label} className={`admin-card admin-fade-up admin-fade-up-delay-${i + 1} p-5`}>
            <div className={`admin-stat-glow -right-6 -top-8 ${m.glow}`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{m.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{m.value}</p>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 ${m.color}`}>
                <m.icon className="h-4 w-4" />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="admin-card p-5">
          <h2 className="font-semibold text-slate-900">Daily trend ({period})</h2>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {[30, 45, 38, 60, 55, 72, 68, 80, 75, 90, 84, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-[#3B5BDB]/50 via-[#236B6B] to-[#A8C4FF] transition hover:brightness-110"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </section>
        <section className="admin-card p-5">
          <h2 className="font-semibold text-slate-900">Breakdown by type</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Deposits", 92, 62],
              ["Withdrawals", 56, 38],
              ["Loyalty claims", 12, 8],
            ].map(([label, count, pct]) => (
              <li key={label}>
                <div className="mb-1.5 flex justify-between">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-admin-teal" style={{ width: `${pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
