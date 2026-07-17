"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/admin/breadcrumb";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Clock3,
  Gift,
  HandCoins,
  Percent,
  Target,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

const PERIODS = ["Daily", "Weekly", "Monthly"];

const PERIOD_DATA = {
  Daily: {
    metrics: {
      handled: 24,
      handledDelta: "+3 vs yesterday",
      successRate: "96.1%",
      successDelta: "+1.2%",
      commission: "$186",
      commissionDelta: "+$22",
    },
    trend: {
      labels: ["6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p"],
      values: [2, 4, 8, 12, 10, 14, 18, 16],
      subtitle: "Transactions by hour — today",
    },
    breakdown: [
      { label: "Deposits", count: 15, pct: 62, commission: "$118", icon: Banknote, color: "text-theme-green-action", bar: "bg-theme-green-action" },
      { label: "Withdrawals", count: 7, pct: 29, commission: "$54", icon: HandCoins, color: "text-[#FB7185]", bar: "bg-[#FB7185]" },
      { label: "Loyalty", count: 2, pct: 9, commission: "$14", icon: Gift, color: "text-[#FBBF24]", bar: "bg-[#FBBF24]" },
    ],
    audit: { by: "System Admin", at: "Jul 17, 2026 · 6:32 PM" },
  },
  Weekly: {
    metrics: {
      handled: 148,
      handledDelta: "+12 vs last week",
      successRate: "94.2%",
      successDelta: "+0.8%",
      commission: "$1,240",
      commissionDelta: "+$96",
    },
    trend: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [18, 22, 19, 26, 24, 28, 11],
      subtitle: "Daily volume — current week",
    },
    breakdown: [
      { label: "Deposits", count: 92, pct: 62, commission: "$768", icon: Banknote, color: "text-theme-green-action", bar: "bg-theme-green-action" },
      { label: "Withdrawals", count: 44, pct: 30, commission: "$398", icon: HandCoins, color: "text-[#FB7185]", bar: "bg-[#FB7185]" },
      { label: "Loyalty", count: 12, pct: 8, commission: "$74", icon: Gift, color: "text-[#FBBF24]", bar: "bg-[#FBBF24]" },
    ],
    audit: { by: "System Admin", at: "Jul 17, 2026 · 6:00 PM" },
  },
  Monthly: {
    metrics: {
      handled: 612,
      handledDelta: "+48 vs last month",
      successRate: "93.4%",
      successDelta: "-0.3%",
      commission: "$4,860",
      commissionDelta: "+$420",
    },
    trend: {
      labels: ["W1", "W2", "W3", "W4"],
      values: [138, 152, 148, 174],
      subtitle: "Weekly volume — July 2026",
    },
    breakdown: [
      { label: "Deposits", count: 378, pct: 62, commission: "$3,012", icon: Banknote, color: "text-theme-green-action", bar: "bg-theme-green-action" },
      { label: "Withdrawals", count: 186, pct: 30, commission: "$1,548", icon: HandCoins, color: "text-[#FB7185]", bar: "bg-[#FB7185]" },
      { label: "Loyalty", count: 48, pct: 8, commission: "$300", icon: Gift, color: "text-[#FBBF24]", bar: "bg-[#FBBF24]" },
    ],
    audit: { by: "Sub Admin", at: "Jul 17, 2026 · 5:45 PM" },
  },
};

function TrendChart({ labels, values }) {
  const max = Math.max(...values, 1);
  const w = 480;
  const h = 200;
  const padL = 36;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const barGap = labels.length > 10 ? 4 : 10;
  const barW = (chartW - barGap * (values.length - 1)) / values.length;
  const ticks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label="Performance trend chart">
      {ticks.map((t) => {
        const y = padT + chartH - (t / max) * chartH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#2a2d3d" strokeWidth="1" />
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-500" fontSize="9">
              {t}
            </text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const barH = Math.max((v / max) * chartH, 2);
        const x = padL + i * (barW + barGap);
        const y = padT + chartH - barH;
        return (
          <g key={labels[i]}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="4"
              fill="url(#perfBarGrad)"
              opacity={v > max * 0.15 ? 1 : 0.55}
            />
            <text x={x + barW / 2} y={h - 8} textAnchor="middle" className="fill-slate-500" fontSize="9">
              {labels[i]}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="perfBarGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#236B6B" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function DeltaBadge({ value }) {
  const positive = value.startsWith("+") && !value.includes("-");
  const neutral = value.includes("vs");
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        neutral
          ? "bg-white/5 text-slate-400"
          : positive
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-red-500/15 text-red-400"
      }`}
    >
      {!neutral && (positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
      {value}
    </span>
  );
}

export default function PerformancePage() {
  const [period, setPeriod] = useState("Weekly");
  const data = useMemo(() => PERIOD_DATA[period], [period]);

  const metricCards = [
    {
      label: "Transactions Handled",
      value: data.metrics.handled.toLocaleString(),
      delta: data.metrics.handledDelta,
      icon: Target,
      glow: "bg-admin-teal",
      color: "text-admin-teal",
    },
    {
      label: "Success Rate",
      value: data.metrics.successRate,
      delta: data.metrics.successDelta,
      icon: Percent,
      glow: "bg-theme-green-action",
      color: "text-theme-green-action",
    },
    {
      label: "Commission Earned",
      value: data.metrics.commission,
      delta: data.metrics.commissionDelta,
      icon: Wallet,
      glow: "bg-[#FBBF24]",
      color: "text-[#FBBF24]",
    },
  ];

  return (
    <div className="pb-10">
      <Breadcrumb items={[{ label: "My Performance" }]} />

      <div className="admin-fade-up mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-admin-teal/25 bg-admin-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-teal">
            <TrendingUp className="h-3 w-3" />
            Executive scorecard
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Performance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Transactions handled, success rate, and commission earned
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                period === p
                  ? "bg-gradient-to-r from-admin-teal to-admin-teal-deep text-white shadow-sm"
                  : "border border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
          <Link
            href="/team-performance"
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3.5 py-2 text-xs text-slate-400 transition hover:border-white/20 hover:text-white"
          >
            Team view
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {metricCards.map((m, i) => (
          <article key={m.label} className={`admin-card admin-fade-up admin-fade-up-delay-${i + 1} p-5`}>
            <div className={`admin-stat-glow -right-6 -top-8 ${m.glow}`} />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">{m.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">{m.value}</p>
                </div>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ${m.color}`}>
                  <m.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 border-t border-white/10 pt-3">
                <DeltaBadge value={m.delta} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="admin-card admin-fade-up admin-fade-up-delay-2 p-5 lg:col-span-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Daily trend</h2>
              <p className="mt-0.5 text-xs text-slate-500">{data.trend.subtitle}</p>
            </div>
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {period}
            </span>
          </div>
          <TrendChart labels={data.trend.labels} values={data.trend.values} />
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-3 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Breakdown by type</h2>
          <p className="mt-0.5 text-xs text-slate-500">Volume and commission share</p>
          <ul className="mt-5 space-y-4">
            {data.breakdown.map((row) => (
              <li key={row.label}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ${row.color}`}>
                      <row.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{row.label}</p>
                      <p className="text-[11px] text-slate-500">{row.commission} commission</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-white">{row.count}</p>
                    <p className="text-[11px] text-slate-500">{row.pct}%</p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${row.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total handled</span>
              <span className="font-semibold tabular-nums text-white">
                {data.breakdown.reduce((s, r) => s + r.count, 0)}
              </span>
            </div>
          </div>
        </section>
      </div>

      <p className="admin-fade-up admin-fade-up-delay-4 mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 text-slate-600" />
          Last updated {data.audit.at}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-600" />
          Updated by {data.audit.by}
        </span>
      </p>
    </div>
  );
}
