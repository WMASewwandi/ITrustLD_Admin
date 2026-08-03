"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import { useAdminPermissions, useCan } from "@/contexts/admin-permissions";
import { getAdminUser } from "@/lib/auth";
import { downloadDepositsExport } from "@/lib/deposits";
import { downloadWithdrawalsExport } from "@/lib/withdrawals";
import {
  DASHBOARD_FILTER_OPTIONS,
  fetchAdminDashboard,
  fetchFilteredDepositsTotal,
  fetchFilteredWithdrawalsTotal,
  formatDashboardLkr,
  formatDashboardUsd,
  formatPlatformDepositAmount,
  resolveDashboardDurationLabel,
} from "@/lib/dashboard";
import { TOP_NAV } from "@/lib/mock-data";
import { getFirstAllowedNavHref, resolveAdminLandingPath } from "@/lib/permissions";
import {
  Banknote,
  Briefcase,
  ChevronDown,
  DollarSign,
  HandCoins,
  Loader2,
  MoreVertical,
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

function BarChart({ values, labels }) {
  const max = Math.max(...values, 0.05);
  const w = 480;
  const h = 200;
  const padL = 36;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const barGap = 8;
  const barW = (chartW - barGap * (values.length - 1)) / values.length;
  const tickStep = max <= 0.5 ? 0.1 : max <= 2 ? 0.5 : Math.ceil(max / 4);
  const ticks = [...new Set(Array.from({ length: 5 }, (_, i) => Number((i * tickStep).toFixed(2))))];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label="Monthly revenue bar chart">
      {ticks.map((t, tickIndex) => {
        const y = padT + chartH - (t / max) * chartH;
        return (
          <g key={`tick-${tickIndex}-${t}`}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#2a2d3d" strokeWidth="1" />
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-500" fontSize="9">
              {t.toFixed(1)}
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
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill="#2dd4bf" opacity={v > max * 0.15 ? 1 : 0.45} />
            <text x={x + barW / 2} y={h - 8} textAnchor="middle" className="fill-slate-500" fontSize="9">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DotLineChart({ points, color = "#22c55e", height = 140, showDots = true }) {
  const w = 320;
  const h = height;
  const padX = 10;
  const padY = 18;
  const safePoints = points.length ? points : [0];
  const max = Math.max(...safePoints, 0.01);
  const min = Math.min(...safePoints, 0);
  const range = max - min || 1;
  const coords = safePoints.map((p, i) => {
    const x = padX + (i / Math.max(safePoints.length - 1, 1)) * (w - padX * 2);
    const y = padY + (1 - (p - min) / range) * (h - padY * 2);
    return [x, y];
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
      {showDots &&
        coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="#141625" strokeWidth="1.5" />
        ))}
    </svg>
  );
}

function GrowthGauge({ percent = 0 }) {
  const r = 70;
  const cx = 100;
  const cy = 95;
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweep = Math.min(Math.abs(percent) / 100, 1);
  const clamped = Math.max(sweep, 0.02);
  const angle = startAngle + (endAngle - startAngle) * clamped;

  function polar(a) {
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  }

  const [sx, sy] = polar(startAngle);
  const [ex, ey] = polar(endAngle);
  const [ax, ay] = polar(angle);
  const track = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
  const arc = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ax} ${ay}`;

  return (
    <svg viewBox="0 0 200 120" className="mx-auto h-36 w-full max-w-[220px]" role="img" aria-label="Company growth gauge">
      <path d={track} fill="none" stroke="#2a2d3d" strokeWidth="14" strokeLinecap="round" />
      <path d={arc} fill="none" stroke="#EAB308" strokeWidth="14" strokeLinecap="round" />
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-white" fontSize="22" fontWeight="700">
        {percent.toFixed(2)} %
      </text>
    </svg>
  );
}

function PercentChange({ value }) {
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <p
      className={`text-sm font-semibold ${
        neutral ? "text-slate-400" : positive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {value.toFixed(2)}%
    </p>
  );
}

function FilterMenu({ open, onClose, onSelect, customFrom, customTo, onCustomFrom, onCustomTo, onApplyCustom }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-white/10 bg-[#1a1d2e] p-3 shadow-xl"
    >
      {DASHBOARD_FILTER_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
          onClick={() => onSelect(option.id)}
        >
          {option.label}
        </button>
      ))}
      <hr className="my-2 border-white/10" />
      <div className="space-y-2">
        <label className="block text-xs text-slate-400">
          From
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-slate-400">
          To
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <button
          type="button"
          className="w-full rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-500"
          onClick={onApplyCustom}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function StatCardMenu({
  canFilter,
  canExport,
  filterOpen,
  exportOpen,
  onToggleFilter,
  onToggleExport,
  onCloseMenus,
  onSelectFilter,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  onApplyCustom,
  onExport,
}) {
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        onCloseMenus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onCloseMenus]);

  return (
    <div ref={wrapRef} className="relative flex shrink-0 items-center gap-1">
      {canExport ? (
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-500"
            onClick={onToggleExport}
          >
            Export
            <ChevronDown className="h-3 w-3 opacity-90" />
          </button>
          {exportOpen ? (
            <div className="absolute right-0 top-full z-30 mt-2 w-28 rounded-xl border border-white/10 bg-[#1a1d2e] p-2 shadow-xl">
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                onClick={onExport}
              >
                CSV
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      {canFilter ? (
        <div className="relative">
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
            aria-label="Filter options"
            onClick={onToggleFilter}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <FilterMenu
            open={filterOpen}
            onClose={onCloseMenus}
            onSelect={onSelectFilter}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFrom={onCustomFrom}
            onCustomTo={onCustomTo}
            onApplyCustom={onApplyCustom}
          />
        </div>
      ) : (
        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canViewDashboard = useCan("view_admin_dashboard");
  const canFilterDeposits = useCan("read_deposit_data");
  const canFilterWithdrawals = useCan("read_withdrawal_data");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [depositFilter, setDepositFilter] = useState("currentyear");
  const [withdrawalFilter, setWithdrawalFilter] = useState("currentyear");
  const [depositAmount, setDepositAmount] = useState(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState(null);
  const [depositDuration, setDepositDuration] = useState("");
  const [withdrawalDuration, setWithdrawalDuration] = useState("");

  const [depositFilterOpen, setDepositFilterOpen] = useState(false);
  const [withdrawalFilterOpen, setWithdrawalFilterOpen] = useState(false);
  const [depositExportOpen, setDepositExportOpen] = useState(false);
  const [withdrawalExportOpen, setWithdrawalExportOpen] = useState(false);

  const [depositCustomFrom, setDepositCustomFrom] = useState("");
  const [depositCustomTo, setDepositCustomTo] = useState("");
  const [withdrawalCustomFrom, setWithdrawalCustomFrom] = useState("");
  const [withdrawalCustomTo, setWithdrawalCustomTo] = useState("");

  useEffect(() => {
    if (!canViewDashboard) {
      const user = getAdminUser();
      const fallback =
        getFirstAllowedNavHref(TOP_NAV, permissions) ||
        resolveAdminLandingPath(user?.roles ?? [], permissions);
      router.replace(fallback || "/login");
    }
  }, [canViewDashboard, permissions, router]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchAdminDashboard();
      setData(response);
      setDepositAmount(response.totalCompletedDeposits);
      setWithdrawalAmount(response.totalCompletedWithdrawals);
      setDepositDuration(resolveDashboardDurationLabel("currentyear", response.year));
      setWithdrawalDuration(resolveDashboardDurationLabel("currentyear", response.year));
      setDepositFilter("currentyear");
      setWithdrawalFilter("currentyear");
    } catch (err) {
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canViewDashboard) {
      loadDashboard();
    }
  }, [canViewDashboard, loadDashboard]);

  const applyDepositFilter = useCallback(
    async (filter, from, to) => {
      if (!canFilterDeposits || !data) return;
      try {
        const total = await fetchFilteredDepositsTotal({ filter, from, to });
        setDepositAmount(total);
        setDepositFilter(filter);
        setDepositDuration(resolveDashboardDurationLabel(filter, data.year));
      } catch (err) {
        setError(err.message || "Failed to filter deposits.");
      } finally {
        setDepositFilterOpen(false);
      }
    },
    [canFilterDeposits, data],
  );

  const applyWithdrawalFilter = useCallback(
    async (filter, from, to) => {
      if (!canFilterWithdrawals || !data) return;
      try {
        const total = await fetchFilteredWithdrawalsTotal({ filter, from, to });
        setWithdrawalAmount(total);
        setWithdrawalFilter(filter);
        setWithdrawalDuration(resolveDashboardDurationLabel(filter, data.year));
      } catch (err) {
        setError(err.message || "Failed to filter withdrawals.");
      } finally {
        setWithdrawalFilterOpen(false);
      }
    },
    [canFilterWithdrawals, data],
  );

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
        Redirecting…
      </div>
    );
  }

  if (error && !data && !loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-slate-400">
        <p>{error}</p>
        <button
          type="button"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
          onClick={loadDashboard}
        >
          Retry
        </button>
      </div>
    );
  }

  const year = data?.year ?? new Date().getFullYear();
  const monthName = data?.monthName ?? MONTHS[new Date().getMonth()];
  const platforms = data?.platforms ?? [];
  const growth = data?.growth ?? {};
  const isLoading = loading && !data;

  return (
    <div className="pb-10">
      <Breadcrumb items={[{ label: "Dashboard" }]} />

      <div className="admin-fade-up mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Completed volumes, revenue and profit overview</p>
        </div>
        {loading ? (
          <span className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating…
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="admin-card admin-fade-up p-5">
          <div className="admin-stat-glow -right-8 -top-10 bg-theme-green-action" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-theme-green-action text-white shadow-sm">
                <Banknote className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">Total Completed Deposits</p>
                <p className="mt-0.5 text-xs text-slate-500">{depositDuration || year}</p>
                {isLoading ? (
                  <Skeleton className="mt-3 h-9 w-40" />
                ) : (
                  <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                    {formatDashboardUsd(depositAmount ?? data?.totalCompletedDeposits)}
                  </p>
                )}
              </div>
            </div>
            <StatCardMenu
              canFilter={canFilterDeposits}
              canExport={canFilterDeposits}
              filterOpen={depositFilterOpen}
              exportOpen={depositExportOpen}
              onToggleFilter={() => {
                setDepositExportOpen(false);
                setDepositFilterOpen((open) => !open);
              }}
              onToggleExport={() => {
                setDepositFilterOpen(false);
                setDepositExportOpen((open) => !open);
              }}
              onCloseMenus={() => {
                setDepositFilterOpen(false);
                setDepositExportOpen(false);
              }}
              onSelectFilter={(filter) => applyDepositFilter(filter)}
              customFrom={depositCustomFrom}
              customTo={depositCustomTo}
              onCustomFrom={setDepositCustomFrom}
              onCustomTo={setDepositCustomTo}
              onApplyCustom={() => applyDepositFilter("customdate", depositCustomFrom, depositCustomTo)}
              onExport={async () => {
                setDepositExportOpen(false);
                try {
                  await downloadDepositsExport({
                    status: "Completed",
                    filter: depositFilter,
                    fromDate: depositFilter === "customdate" ? depositCustomFrom : undefined,
                    toDate: depositFilter === "customdate" ? depositCustomTo : undefined,
                  });
                } catch (err) {
                  setError(err.message || "Export failed.");
                }
              }}
            />
          </div>
        </article>

        <article className="admin-card admin-fade-up admin-fade-up-delay-1 p-5">
          <div className="admin-stat-glow -right-8 -top-10 bg-[#FB7185]" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E11D48] text-white shadow-sm">
                <HandCoins className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">Total Completed Withdrawals</p>
                <p className="mt-0.5 text-xs text-slate-500">{withdrawalDuration || year}</p>
                {isLoading ? (
                  <Skeleton className="mt-3 h-9 w-40" />
                ) : (
                  <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                    {formatDashboardUsd(withdrawalAmount ?? data?.totalCompletedWithdrawals)}
                  </p>
                )}
              </div>
            </div>
            <StatCardMenu
              canFilter={canFilterWithdrawals}
              canExport={canFilterWithdrawals}
              filterOpen={withdrawalFilterOpen}
              exportOpen={withdrawalExportOpen}
              onToggleFilter={() => {
                setWithdrawalExportOpen(false);
                setWithdrawalFilterOpen((open) => !open);
              }}
              onToggleExport={() => {
                setWithdrawalFilterOpen(false);
                setWithdrawalExportOpen((open) => !open);
              }}
              onCloseMenus={() => {
                setWithdrawalFilterOpen(false);
                setWithdrawalExportOpen(false);
              }}
              onSelectFilter={(filter) => applyWithdrawalFilter(filter)}
              customFrom={withdrawalCustomFrom}
              customTo={withdrawalCustomTo}
              onCustomFrom={setWithdrawalCustomFrom}
              onCustomTo={setWithdrawalCustomTo}
              onApplyCustom={() =>
                applyWithdrawalFilter("customdate", withdrawalCustomFrom, withdrawalCustomTo)
              }
              onExport={async () => {
                setWithdrawalExportOpen(false);
                try {
                  await downloadWithdrawalsExport({
                    status: "Completed",
                    filter: withdrawalFilter,
                    fromDate: withdrawalFilter === "customdate" ? withdrawalCustomFrom : undefined,
                    toDate: withdrawalFilter === "customdate" ? withdrawalCustomTo : undefined,
                  });
                } catch (err) {
                  setError(err.message || "Export failed.");
                }
              }}
            />
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <section className="admin-card admin-fade-up p-5 xl:col-span-6">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Total Monthly Revenue in (&apos;000 USD)</h2>
              <p className="mt-0.5 text-xs text-slate-500">{year}</p>
            </div>
          </div>
          {isLoading ? <Skeleton className="h-52 w-full" /> : (
            <BarChart values={data?.monthlyRevenue ?? []} labels={MONTHS} />
          )}
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-1 flex flex-col p-5 xl:col-span-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Monthly Profit</h2>
              <p className="mt-0.5 text-xs text-slate-500">{year}</p>
            </div>
          </div>
          <div className="mt-2 h-36 flex-1">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DotLineChart points={data?.monthlyProfit ?? []} color="#22c55e" />
            )}
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-12" />
              </>
            ) : (
              <>
                <p className="text-base font-bold text-white">{formatDashboardLkr(data?.currentMonthProfit)}</p>
                <PercentChange value={data?.lastMonthPercentageIncrease ?? 0} />
              </>
            )}
          </div>
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-2 flex flex-col p-5 xl:col-span-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Daily Profit</h2>
              <p className="mt-0.5 text-xs text-slate-500">{monthName}</p>
            </div>
          </div>
          <div className="mt-2 h-36 flex-1">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DotLineChart
                points={data?.dailyProfit ?? []}
                color="#ef4444"
                showDots={(data?.dailyProfit ?? []).some((v) => v > 0)}
              />
            )}
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-12" />
              </>
            ) : (
              <>
                <p className="text-base font-bold text-white">{formatDashboardLkr(data?.todayProfit)}</p>
                <PercentChange value={data?.todayPercentageIncrease ?? 0} />
              </>
            )}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="admin-card admin-fade-up p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-100">All Time Transactions</h2>
          </div>
          <ul className="divide-y divide-white/10">
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <li key={index} className="flex items-center justify-between gap-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </li>
                ))
              : null}
            {!isLoading && platforms.map((platform) => (
              <li key={platform.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: platform.bg }}
                  >
                    {platform.letter}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{platform.name}</p>
                    <p className="text-xs text-slate-500">Deposits</p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums text-white">
                  {formatPlatformDepositAmount(platform, platform.amount)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-1 p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-100">Company Growth</h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <Skeleton className="mx-auto h-36 w-full max-w-[220px]" />
              <div className="flex flex-1 flex-col gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <GrowthGauge percent={growth.growthPercentage ?? 0} />
              </div>

              <div className="flex flex-1 flex-col gap-4 sm:max-w-[200px]">
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">{growth.lastYear}</p>
                    <p className="text-base font-bold text-white">
                      {(growth.lastYearThousands ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      K
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">{growth.currentYear}</p>
                    <p className="text-base font-bold text-white">
                      {(growth.currentYearThousands ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      K
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
