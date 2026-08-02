"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/admin/breadcrumb";
import {
  PERFORMANCE_PERIODS,
  fetchMyPerformance,
} from "@/lib/performance";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Clock3,
  Gift,
  HandCoins,
  Loader2,
  Percent,
  Target,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

const BREAKDOWN_ICONS = {
  Deposits: { icon: Banknote, color: "text-theme-green-action", bar: "bg-theme-green-action" },
  Withdrawals: { icon: HandCoins, color: "text-[#FB7185]", bar: "bg-[#FB7185]" },
  Loyalty: { icon: Gift, color: "text-[#FBBF24]", bar: "bg-[#FBBF24]" },
};

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

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
  const ticks = [...new Set([0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max])];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label="Performance trend chart">
      {ticks.map((t, tickIndex) => {
        const y = padT + chartH - (t / max) * chartH;
        return (
          <g key={`tick-${tickIndex}-${t}`}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#2a2d3d" strokeWidth="1" />
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-500" fontSize="9">
              {t}
            </text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const barH = Math.max((v / max) * chartH, v > 0 ? 2 : 0);
        const x = padL + i * (barW + barGap);
        const y = padT + chartH - barH;
        return (
          <g key={`bar-${i}-${labels[i]}`}>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const loadPerformance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchMyPerformance(period);
      setData(response);
    } catch (err) {
      setError(err.message || "Failed to load performance.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  const metricCards = data
    ? [
        {
          label: "Transactions Handled",
          value: Number(data.metrics.handled || 0).toLocaleString(),
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
      ]
    : [];

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
          {PERFORMANCE_PERIODS.map((p) => (
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

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
          <button type="button" className="ml-3 underline" onClick={loadPerformance}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {(loading && !data ? Array.from({ length: 3 }) : metricCards).map((m, i) => (
          <article key={m?.label || i} className={`admin-card admin-fade-up admin-fade-up-delay-${i + 1} p-5`}>
            <div className={`admin-stat-glow -right-6 -top-8 ${m?.glow || "bg-admin-teal"}`} />
            <div className="relative">
              {loading && !data ? (
                <div className="space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="admin-card admin-fade-up admin-fade-up-delay-2 p-5 lg:col-span-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Activity trend</h2>
              <p className="mt-0.5 text-xs text-slate-500">{data?.trend?.subtitle || "Loading trend…"}</p>
            </div>
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {period}
            </span>
          </div>
          {loading && !data ? (
            <Skeleton className="mt-4 h-52 w-full" />
          ) : (
            <TrendChart labels={data?.trend?.labels || []} values={data?.trend?.values || []} />
          )}
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-3 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Breakdown by type</h2>
          <p className="mt-0.5 text-xs text-slate-500">Volume and commission share</p>
          <ul className="mt-5 space-y-4">
            {(loading && !data ? Array.from({ length: 3 }) : data?.breakdown || []).map((row, index) => {
              const meta = BREAKDOWN_ICONS[row?.label] || BREAKDOWN_ICONS.Deposits;
              const Icon = meta.icon;
              return (
                <li key={row?.label || index}>
                  {loading && !data ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ${meta.color}`}>
                            <Icon className="h-4 w-4" />
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
                        <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          {data ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total handled</span>
                <span className="font-semibold tabular-nums text-white">
                  {(data.breakdown || []).reduce((sum, row) => sum + row.count, 0)}
                </span>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {data?.audit ? (
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
      ) : null}
    </div>
  );
}
