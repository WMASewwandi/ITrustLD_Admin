"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/admin/breadcrumb";
import { SYSTEM_USERS } from "@/lib/mock-data";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Circle,
  Crown,
  Percent,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

const PERIODS = ["Daily", "Weekly", "Monthly"];

const TEAM_AGGREGATE = {
  Daily: { transactions: 118, success: "92.4%", commission: "$1,420", trend: [14, 18, 16, 22, 20, 28] },
  Weekly: { transactions: 842, success: "91.8%", commission: "$18,420", trend: [112, 128, 118, 142, 136, 156, 50] },
  Monthly: { transactions: "3,284", success: "90.6%", commission: "$72.8K", trend: [780, 812, 848, 844] },
};

const MEMBER_STATS = {
  "SU-1": {
    handled: { Daily: 8, Weekly: 52, Monthly: 218 },
    success: { Daily: 98, Weekly: 97, Monthly: 96 },
    commission: { Daily: 240, Weekly: 1560, Monthly: 6520 },
    breakdown: { deposits: 62, withdrawals: 28, loyalty: 10 },
    shift: "—",
    lastActive: "Online now",
  },
  "SU-2": {
    handled: { Daily: 6, Weekly: 38, Monthly: 164 },
    success: { Daily: 95, Weekly: 94, Monthly: 93 },
    commission: { Daily: 180, Weekly: 1140, Monthly: 4920 },
    breakdown: { deposits: 55, withdrawals: 35, loyalty: 10 },
    shift: "—",
    lastActive: "2h ago",
  },
  "SU-3": {
    handled: { Daily: 32, Weekly: 198, Monthly: 812 },
    success: { Daily: 94, Weekly: 93, Monthly: 92 },
    commission: { Daily: 960, Weekly: 5940, Monthly: 24360 },
    breakdown: { deposits: 68, withdrawals: 26, loyalty: 6 },
    shift: "Shift B",
    lastActive: "Online now",
  },
  "SU-4": {
    handled: { Daily: 28, Weekly: 176, Monthly: 724 },
    success: { Daily: 91, Weekly: 90, Monthly: 89 },
    commission: { Daily: 840, Weekly: 5280, Monthly: 21720 },
    breakdown: { deposits: 64, withdrawals: 30, loyalty: 6 },
    shift: "Shift B",
    lastActive: "45m ago",
  },
  "SU-5": {
    handled: { Daily: 44, Weekly: 278, Monthly: 1146 },
    success: { Daily: 96, Weekly: 95, Monthly: 94 },
    commission: { Daily: 1320, Weekly: 8340, Monthly: 34380 },
    breakdown: { deposits: 70, withdrawals: 24, loyalty: 6 },
    shift: "Shift B",
    lastActive: "Online now",
  },
};

function formatCommission(amount, period) {
  if (period === "Monthly" && amount >= 10000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function TeamTrendChart({ values, period }) {
  const labels =
    period === "Daily"
      ? ["6a", "8a", "10a", "12p", "2p", "4p"]
      : period === "Weekly"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        : ["W1", "W2", "W3", "W4"];
  const max = Math.max(...values, 1);
  const w = 480;
  const h = 160;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const coords = values.map((v, i) => {
    const x = padL + (i / Math.max(values.length - 1, 1)) * chartW;
    const y = padT + chartH - (v / max) * chartH;
    return [x, y];
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${coords.map(([x, y]) => `${x},${y}`).join(" ")} ${padL + chartW},${padT + chartH} ${padL},${padT + chartH}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" role="img" aria-label="Team performance trend">
      <polygon points={area} fill="url(#teamAreaGrad)" opacity="0.35" />
      <polyline
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
      {coords.map(([x, y], i) => (
        <g key={labels[i]}>
          <circle cx={x} cy={y} r="4" fill="#2dd4bf" stroke="#141625" strokeWidth="1.5" />
          <text x={x} y={h - 6} textAnchor="middle" className="fill-slate-500" fontSize="9">
            {labels[i]}
          </text>
        </g>
      ))}
      <defs>
        <linearGradient id="teamAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CommissionBar({ members, period }) {
  const total = members.reduce((s, m) => s + m.commission, 0) || 1;
  const colors = ["#2dd4bf", "#6366f1", "#fbbf24", "#fb7185", "#22c55e"];

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
        {members.map((m, i) => (
          <div
            key={m.id}
            className="h-full transition-all"
            style={{ width: `${(m.commission / total) * 100}%`, backgroundColor: colors[i % colors.length] }}
            title={`${m.name}: ${formatCommission(m.commission, period)}`}
          />
        ))}
      </div>
      <ul className="space-y-2">
        {members.map((m, i) => (
          <li key={m.id} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              {m.name}
            </span>
            <span className="font-semibold tabular-nums text-white">
              {formatCommission(m.commission, period)}
              <span className="ml-1 text-slate-500">({Math.round((m.commission / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TeamPerformancePage() {
  const [period, setPeriod] = useState("Weekly");
  const [expanded, setExpanded] = useState(null);

  const aggregate = TEAM_AGGREGATE[period];

  const members = useMemo(() => {
    return SYSTEM_USERS.map((u) => {
      const stats = MEMBER_STATS[u.id] || MEMBER_STATS["SU-3"];
      return {
        ...u,
        handled: stats.handled[period],
        success: stats.success[period],
        commission: stats.commission[period],
        breakdown: stats.breakdown,
        shift: stats.shift || u.shift,
        lastActive: stats.lastActive,
      };
    }).sort((a, b) => b.commission - a.commission);
  }, [period]);

  const topPerformer = members[0];

  function toggleRow(id) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div className="pb-10">
      <Breadcrumb items={[{ label: "Team Performance" }]} />

      <div className="admin-fade-up mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-admin-teal/25 bg-admin-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-teal">
            <Users className="h-3 w-3" />
            Super Admin view
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Team Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Aggregate metrics, leaderboard, and commission overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                setExpanded(null);
              }}
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
            href="/performance"
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3.5 py-2 text-xs text-slate-400 transition hover:border-white/20 hover:text-white"
          >
            My scorecard
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Team Transactions", value: aggregate.transactions, icon: Target, glow: "bg-admin-teal", color: "text-admin-teal" },
          { label: "Avg Success Rate", value: aggregate.success, icon: Percent, glow: "bg-theme-green-action", color: "text-theme-green-action" },
          { label: "Total Commission", value: aggregate.commission, icon: Wallet, glow: "bg-[#FBBF24]", color: "text-[#FBBF24]" },
        ].map((m, i) => (
          <article key={m.label} className={`admin-card admin-fade-up admin-fade-up-delay-${i + 1} p-5`}>
            <div className={`admin-stat-glow -right-6 -top-8 ${m.glow}`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{m.label}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-white">{m.value}</p>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ${m.color}`}>
                <m.icon className="h-4 w-4" />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-12">
        <section className="admin-card admin-fade-up admin-fade-up-delay-2 p-5 xl:col-span-7">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Team trend summary</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {period === "Daily" ? "Hourly volume today" : period === "Weekly" ? "Daily volume this week" : "Weekly volume this month"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              +8.2%
            </span>
          </div>
          <TeamTrendChart values={aggregate.trend} period={period} />
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-3 p-5 xl:col-span-5">
          <h2 className="text-sm font-semibold text-white">Commission overview</h2>
          <p className="mt-0.5 text-xs text-slate-500">Share across active admins — {period.toLowerCase()}</p>
          <div className="mt-5">
            <CommissionBar members={members} period={period} />
          </div>
          {topPerformer && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBBF24]/15 text-[#FBBF24]">
                <Crown className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Top earner</p>
                <p className="text-sm font-semibold text-white">
                  {topPerformer.name}
                  <span className="ml-2 font-normal text-slate-400">
                    {formatCommission(topPerformer.commission, period)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="admin-card admin-fade-up admin-fade-up-delay-4 mt-6 overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Team leaderboard</h2>
          <p className="mt-0.5 text-xs text-slate-500">Click a row to expand type breakdown and shift details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-3 py-3 font-semibold">Admin</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Handled</th>
                <th className="px-3 py-3 font-semibold">Success</th>
                <th className="px-3 py-3 font-semibold">Commission</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="w-10 px-3 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {members.map((u, i) => {
                const isOpen = expanded === u.id;
                return (
                  <Fragment key={u.id}>
                    <tr
                      className={`cursor-pointer border-t border-white/10 transition hover:bg-white/[0.03] ${
                        isOpen ? "bg-white/[0.04]" : ""
                      }`}
                      onClick={() => toggleRow(u.id)}
                    >
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0 ? "bg-[#FBBF24]/15 text-[#FBBF24]" : "bg-white/5 text-admin-teal"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-3 py-3.5 text-slate-300">{u.role}</td>
                      <td className="px-3 py-3.5 font-semibold tabular-nums text-white">{u.handled}</td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`font-semibold tabular-nums ${
                            u.success >= 94 ? "text-emerald-400" : u.success >= 90 ? "text-white" : "text-amber-400"
                          }`}
                        >
                          {u.success}%
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-semibold tabular-nums text-white">
                        {formatCommission(u.commission, period)}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <Circle
                            className={`h-2 w-2 fill-current ${u.online ? "text-emerald-400" : "text-slate-600"}`}
                          />
                          {u.lastActive}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-500">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t border-white/5 bg-white/[0.02]">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="grid gap-4 sm:grid-cols-3">
                            {[
                              ["Deposits", u.breakdown.deposits, "bg-theme-green-action"],
                              ["Withdrawals", u.breakdown.withdrawals, "bg-[#FB7185]"],
                              ["Loyalty", u.breakdown.loyalty, "bg-[#FBBF24]"],
                            ].map(([label, pct, bar]) => (
                              <div key={label} className="rounded-xl border border-white/10 bg-admin-surface/80 p-3">
                                <div className="mb-2 flex justify-between text-xs">
                                  <span className="text-slate-400">{label}</span>
                                  <span className="font-semibold text-white">{pct}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                            <span>
                              Shift: <span className="text-slate-300">{u.shift}</span>
                            </span>
                            <span>
                              Est. per txn:{" "}
                              <span className="text-slate-300">
                                ${(u.commission / Math.max(u.handled, 1)).toFixed(2)}
                              </span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
