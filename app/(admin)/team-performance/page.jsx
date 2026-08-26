"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import { PerformancePeriodControls } from "@/components/admin/performance-period-controls";
import {
  canViewTeamPerformance,
  fetchTeamPerformance,
  formatPerformanceCommission,
  getCurrentAdminAccess,
} from "@/lib/performance";
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

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

function TeamTrendChart({ labels, values }) {
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
        <g key={`point-${i}-${labels[i]}`}>
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
  const total = members.reduce((sum, member) => sum + member.commission, 0) || 1;
  const colors = ["#2dd4bf", "#6366f1", "#fbbf24", "#fb7185", "#22c55e"];

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="h-full transition-all"
            style={{
              width: `${(member.commission / total) * 100}%`,
              backgroundColor: colors[index % colors.length],
            }}
            title={`${member.name}: ${formatPerformanceCommission(member.commission, period)}`}
          />
        ))}
      </div>
      <ul className="space-y-2">
        {members.slice(0, 6).map((member, index) => (
          <li key={member.id} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              {member.name}
            </span>
            <span className="font-semibold tabular-nums text-white">
              {formatPerformanceCommission(member.commission, period)}
              <span className="ml-1 text-slate-500">({Math.round((member.commission / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TeamPerformancePage() {
  const router = useRouter();
  const [period, setPeriod] = useState("Weekly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const { roles, permissions } = getCurrentAdminAccess();
  const allowed = canViewTeamPerformance(roles, permissions);

  const loadTeamPerformance = useCallback(async () => {
    if (!allowed) return;
    if (period === "Custom" && (!from || !to)) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetchTeamPerformance(period, { from, to });
      setData(response);
    } catch (err) {
      setError(err.message || "Failed to load team performance.");
    } finally {
      setLoading(false);
    }
  }, [allowed, period, from, to]);

  useEffect(() => {
    if (!allowed) {
      router.replace("/performance");
      return;
    }
    loadTeamPerformance();
  }, [allowed, loadTeamPerformance, router]);

  function toggleRow(id) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
        Redirecting…
      </div>
    );
  }

  const members = data?.members ?? [];
  const aggregate = data?.aggregate ?? {};
  const topPerformer = members[0];

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
          <p className="mt-1 text-sm text-slate-500">
            {data?.range
              ? `${data.range.from} – ${data.range.to}`
              : "Aggregate metrics, leaderboard, and commission overview"}
          </p>
        </div>
        <PerformancePeriodControls
          period={period}
          from={from}
          to={to}
          onPeriodChange={(nextPeriod) => {
            setPeriod(nextPeriod);
            setExpanded(null);
          }}
          onRangeChange={(nextFrom, nextTo) => {
            setFrom(nextFrom);
            setTo(nextTo);
          }}
          extra={
            <Link
              href="/performance"
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3.5 py-2 text-xs text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              My scorecard
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
          <button type="button" className="ml-3 underline" onClick={loadTeamPerformance}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Team Transactions", value: aggregate.transactions, icon: Target, glow: "bg-admin-teal", color: "text-admin-teal" },
          {
            label: "Avg Success Rate",
            value: aggregate.success,
            note: aggregate.avgHandleTime ? `Avg handle ${aggregate.avgHandleTime}` : null,
            noteHint: aggregate.handleTimeDelta || "Create time → status update",
            icon: Percent,
            glow: "bg-theme-green-action",
            color: "text-theme-green-action",
          },
          {
            label: "Total Commission",
            value: aggregate.commission,
            note: aggregate.commissionHint || null,
            icon: Wallet,
            glow: "bg-[#FBBF24]",
            color: "text-[#FBBF24]",
          },
        ].map((metric, index) => (
          <article key={metric.label} className={`admin-card admin-fade-up admin-fade-up-delay-${index + 1} p-5`}>
            <div className={`admin-stat-glow -right-6 -top-8 ${metric.glow}`} />
            <div className="relative flex items-start justify-between">
              {loading && !data ? (
                <div className="space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-28" />
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">{metric.label}</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-white">{metric.value ?? "—"}</p>
                    {metric.note ? (
                      <p className="mt-1 text-[11px] text-slate-400" title={metric.noteHint || undefined}>
                        {metric.note}
                      </p>
                    ) : null}
                  </div>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ${metric.color}`}>
                    <metric.icon className="h-4 w-4" />
                  </span>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-12">
        <section className="admin-card admin-fade-up admin-fade-up-delay-2 p-5 xl:col-span-7">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Team trend summary</h2>
              <p className="mt-0.5 text-xs text-slate-500">{data?.trend?.subtitle || "Loading trend…"}</p>
            </div>
            {aggregate.trendDelta ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                {aggregate.trendDelta}
              </span>
            ) : null}
          </div>
          {loading && !data ? (
            <Skeleton className="mt-4 h-44 w-full" />
          ) : (
            <TeamTrendChart labels={data?.trend?.labels || []} values={data?.trend?.values || []} />
          )}
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-3 p-5 xl:col-span-5">
          <h2 className="text-sm font-semibold text-white">Commission overview</h2>
          <p className="mt-0.5 text-xs text-slate-500">Share across active admins — {period.toLowerCase()}</p>
          <div className="mt-5">
            {loading && !data ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <CommissionBar members={members} period={period} />
            )}
          </div>
          {topPerformer ? (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBBF24]/15 text-[#FBBF24]">
                <Crown className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Top earner</p>
                <p className="text-sm font-semibold text-white">
                  {topPerformer.name}
                  <span className="ml-2 font-normal text-slate-400">
                    {formatPerformanceCommission(topPerformer.commission, period)}
                  </span>
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="admin-card admin-fade-up admin-fade-up-delay-4 mt-6 overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Team leaderboard</h2>
          <p className="mt-0.5 text-xs text-slate-500">Click a row to expand type breakdown and shift details</p>
        </div>
        <div className="overflow-x-auto">
          {loading && !data ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : (
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
                {members.map((member, index) => {
                  const isOpen = expanded === member.id;
                  return (
                    <Fragment key={member.id}>
                      <tr
                        className={`cursor-pointer border-t border-white/10 transition hover:bg-white/[0.03] ${
                          isOpen ? "bg-white/[0.04]" : ""
                        }`}
                        onClick={() => toggleRow(member.id)}
                      >
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              index === 0 ? "bg-[#FBBF24]/15 text-[#FBBF24]" : "bg-white/5 text-admin-teal"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-[11px] text-slate-500">{member.email}</p>
                        </td>
                        <td className="px-3 py-3.5 text-slate-300">{member.role}</td>
                        <td className="px-3 py-3.5 font-semibold tabular-nums text-white">{member.handled}</td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`font-semibold tabular-nums ${
                              member.success >= 94
                                ? "text-emerald-400"
                                : member.success >= 90
                                  ? "text-white"
                                  : "text-amber-400"
                            }`}
                          >
                            {member.success}%
                            {member.avgHandleTime && member.avgHandleTime !== "—" ? (
                              <span className="mt-0.5 block text-[10px] font-medium text-slate-500">
                                {member.avgHandleTime}
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-semibold tabular-nums text-white">
                          {formatPerformanceCommission(member.commission, period)}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <Circle
                              className={`h-2 w-2 fill-current ${member.online ? "text-emerald-400" : "text-slate-600"}`}
                            />
                            {member.lastActive}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-slate-500">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-t border-white/5 bg-white/[0.02]">
                          <td colSpan={8} className="px-5 py-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                              {[
                                ["Deposits", member.breakdown.deposits, "bg-theme-green-action"],
                                ["Withdrawals", member.breakdown.withdrawals, "bg-[#FB7185]"],
                                ["Loyalty", member.breakdown.loyalty, "bg-[#FBBF24]"],
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
                                Shift: <span className="text-slate-300">{member.shift}</span>
                              </span>
                              <span>
                                Est. per txn:{" "}
                                <span className="text-slate-300">
                                  ${(member.commission / Math.max(member.handled, 1)).toFixed(2)}
                                </span>
                              </span>
                              <span>
                                Avg handle:{" "}
                                <span className="text-slate-300">{member.avgHandleTime || "—"}</span>
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
