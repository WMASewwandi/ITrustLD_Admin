"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { useAdminPermissions, useCan } from "@/contexts/admin-permissions";
import { getAdminUser } from "@/lib/auth";
import { downloadDepositsExport } from "@/lib/deposits";
import { downloadWithdrawalsExport } from "@/lib/withdrawals";
import {
  DEFAULT_DASHBOARD_FILTER,
  DASHBOARD_FILTER_OPTIONS,
  fetchAdminDashboard,
  fetchDashboardPlatforms,
  formatDashboardLkr,
  formatDashboardUsd,
  formatPlatformDepositAmount,
  resolveDashboardDurationLabel,
  resolveDashboardFilterLabel,
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
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

function PlatformWalletIcon({ platform }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = platform?.logoUrl;
  const showImage = Boolean(logoUrl) && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [logoUrl]);

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full bg-white/10 object-contain p-1.5"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: platform?.bg || "#64748B" }}
    >
      {platform?.letter || "?"}
    </span>
  );
}

function PlatformWalletRows({ items }) {
  if (!items.length) {
    return <li className="py-4 text-center text-xs text-slate-500">No wallets</li>;
  }

  return items.map((platform) => (
    <li key={platform.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <PlatformWalletIcon platform={platform} />
        <p className="truncate text-sm font-semibold text-slate-100">{platform.name}</p>
      </div>
      <p className="shrink-0 text-sm font-bold tabular-nums text-white">
        {formatPlatformDepositAmount(platform, platform.amount)}
      </p>
    </li>
  ));
}

function formatChartValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

function BarChart({ values, labels }) {
  const [hover, setHover] = useState(null);
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
    <div className="relative">
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
          const active = hover?.index === i;
          return (
            <g key={`bar-${i}-${labels[i]}`}>
              <rect
                x={x}
                y={padT}
                width={barW}
                height={chartH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHover({ index: i, value: v, x: x + barW / 2, y })}
                onMouseLeave={() => setHover(null)}
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="3"
                fill="#2dd4bf"
                opacity={active ? 1 : v > max * 0.15 ? 0.9 : 0.45}
                className="pointer-events-none"
              />
              <text x={x + barW / 2} y={h - 8} textAnchor="middle" className="fill-slate-500" fontSize="9">
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
      {hover ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md border border-white/15 bg-[#0B1020] px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg"
          style={{
            left: `${(hover.x / w) * 100}%`,
            top: `${(Math.max(hover.y, 24) / h) * 100}%`,
          }}
        >
          <span className="text-slate-400">{labels[hover.index]}:</span> {formatChartValue(hover.value)}
        </div>
      ) : null}
    </div>
  );
}

function DotLineChart({ points, labels, color = "#22c55e", height = 140, showDots = true }) {
  const [hover, setHover] = useState(null);
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
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={line}
        />
        {coords.map(([x, y], i) => {
          const active = hover?.index === i;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="12"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHover({ index: i, value: safePoints[i], x, y })}
                onMouseLeave={() => setHover(null)}
              />
              {showDots ? (
                <circle
                  cx={x}
                  cy={y}
                  r={active ? 5 : 3.5}
                  fill={color}
                  stroke="#141625"
                  strokeWidth="1.5"
                  className="pointer-events-none"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      {hover ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md border border-white/15 bg-[#0B1020] px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg"
          style={{
            left: `${(hover.x / w) * 100}%`,
            top: `${(Math.max(hover.y, 18) / h) * 100}%`,
          }}
        >
          {labels?.[hover.index] ? (
            <span className="text-slate-400">{labels[hover.index]}: </span>
          ) : null}
          {formatChartValue(hover.value)}
        </div>
      ) : null}
    </div>
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

function DashboardDateFilter({
  open,
  onToggle,
  onClose,
  activeFilter,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  onSelectPreset,
  onApplyCustom,
}) {
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

  return (
    <div ref={ref} className="relative z-50 shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <span className="text-slate-400">Period:</span>
        <span>{resolveDashboardFilterLabel(activeFilter)}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-[200] mt-2 w-56 rounded-xl border border-white/10 bg-[#1a1d2e] p-3 shadow-2xl ring-1 ring-black/20">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Date range
          </p>
          {DASHBOARD_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
                activeFilter === option.id ? "bg-teal-600/20 font-semibold text-teal-300" : "text-slate-200"
              }`}
              onClick={() => onSelectPreset(option.id)}
            >
              {option.label}
            </button>
          ))}
          <hr className="my-2 border-white/10" />
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Custom range
          </p>
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
              Apply custom range
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCardMenu({ canExport, exportOpen, onToggleExport, onCloseMenus, onExport }) {
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

  if (!canExport) return null;

  return (
    <div ref={wrapRef} className="relative flex shrink-0 items-center gap-1">
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
    </div>
  );
}

export default function DashboardPage() {
  const permissions = useAdminPermissions();
  const canViewDashboard = useCan("view_admin_dashboard");
  const canFilterDeposits = useCan("read_deposit_data");
  const canFilterWithdrawals = useCan("read_withdrawal_data");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [depositFilter, setDepositFilter] = useState(DEFAULT_DASHBOARD_FILTER);
  const [withdrawalFilter, setWithdrawalFilter] = useState(DEFAULT_DASHBOARD_FILTER);
  const [globalFilter, setGlobalFilter] = useState(DEFAULT_DASHBOARD_FILTER);
  const [globalCustomFrom, setGlobalCustomFrom] = useState("");
  const [globalCustomTo, setGlobalCustomTo] = useState("");
  const [globalFilterOpen, setGlobalFilterOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState(null);
  const [depositDuration, setDepositDuration] = useState("");
  const [withdrawalDuration, setWithdrawalDuration] = useState("");

  const [depositExportOpen, setDepositExportOpen] = useState(false);
  const [withdrawalExportOpen, setWithdrawalExportOpen] = useState(false);

  const redirectedRef = useRef(false);
  useEffect(() => {
    if (canViewDashboard || redirectedRef.current) return;
    if (!permissions.length) return;
    const user = getAdminUser();
    const fallback =
      getFirstAllowedNavHref(TOP_NAV, permissions) ||
      resolveAdminLandingPath(user?.roles ?? [], permissions);
    if (!fallback || fallback === "/dashboard" || fallback.startsWith("/dashboard?")) {
      return;
    }
    redirectedRef.current = true;
    window.location.replace(fallback);
  }, [canViewDashboard, permissions]);

  const loadRequestRef = useRef(0);

  const loadDashboard = useCallback(async (filter, from, to) => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setError("");
    const resolvedFilter = filter || DEFAULT_DASHBOARD_FILTER;
    const customFrom = resolvedFilter === "customdate" ? from : undefined;
    const customTo = resolvedFilter === "customdate" ? to : undefined;
    setGlobalFilter(resolvedFilter);

    // Start platforms in parallel so cards/charts can paint without waiting on that scan.
    const platformsPromise = fetchDashboardPlatforms({
      filter: resolvedFilter,
      from: customFrom,
      to: customTo,
    }).catch(() => null);

    try {
      const response = await fetchAdminDashboard({
        filter: resolvedFilter,
        from: customFrom,
        to: customTo,
      });

      if (requestId !== loadRequestRef.current) return;

      // New API always returns periodLabel + filter; old process ignores query and omits them.
      if (!response?.periodLabel || (response.filter && response.filter !== resolvedFilter)) {
        throw new Error(
          "Dashboard API did not apply the date filter. Restart ITrustLD_Backend on port 4000, then refresh.",
        );
      }

      setData(response);
      setDepositAmount(Number(response.totalCompletedDeposits) || 0);
      setWithdrawalAmount(Number(response.totalCompletedWithdrawals) || 0);
      const duration = resolveDashboardDurationLabel(
        resolvedFilter,
        response.year,
        response.periodLabel,
      );
      setDepositDuration(duration);
      setWithdrawalDuration(duration);
      setDepositFilter(resolvedFilter);
      setWithdrawalFilter(resolvedFilter);
      setLoading(false);

      const needsPlatforms =
        response.platformsDeferred ||
        !Array.isArray(response.platforms) ||
        response.platforms.length === 0;
      if (needsPlatforms) {
        const platforms = await platformsPromise;
        if (requestId !== loadRequestRef.current || !platforms) return;
        setData((prev) => (prev ? { ...prev, platforms, platformsDeferred: false } : prev));
      }
    } catch (err) {
      if (requestId !== loadRequestRef.current) return;
      setError(err.message || "Failed to load dashboard.");
      setLoading(false);
    }
  }, []);

  const applyGlobalFilter = useCallback(
    async (filter, from, to) => {
      if (filter === "customdate") {
        setGlobalCustomFrom(from || "");
        setGlobalCustomTo(to || "");
      }
      setGlobalFilterOpen(false);
      await loadDashboard(filter, from, to);
    },
    [loadDashboard],
  );

  useEffect(() => {
    if (canViewDashboard) {
      loadDashboard(DEFAULT_DASHBOARD_FILTER);
    }
  }, [canViewDashboard, loadDashboard]);

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
        {permissions.length ? "Redirecting…" : "Loading…"}
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
  const periodLabel =
    data?.periodLabel ||
    resolveDashboardDurationLabel(globalFilter, year) ||
    String(year);
  const chartMode = data?.chartMode ?? (globalFilter === "last7days" || globalFilter === "today" || globalFilter === "yesterday" || globalFilter === "lastmonth" ? "daily" : "monthly");
  const revenueLabels = data?.revenueLabels ?? MONTHS;
  const platforms = data?.platforms ?? [];
  const depositPlatforms = platforms.filter((p) => p.type !== "withdrawal");
  const withdrawalPlatforms = platforms.filter((p) => p.type === "withdrawal");
  const growth = data?.growth ?? {};
  const isLoading = loading && !data;

  const revenueTitle =
    chartMode === "daily" ? "Daily Revenue in ('000 USD)" : "Total Monthly Revenue in ('000 USD)";
  const profitTitle = chartMode === "daily" ? "Daily Profit" : "Monthly Profit";
  const dailyProfitTitle =
    globalFilter === DEFAULT_DASHBOARD_FILTER ? "Daily Profit" : "Period Profit Trend";
  const dailyProfitSubtitle =
    globalFilter === DEFAULT_DASHBOARD_FILTER ? monthName : periodLabel;
  const platformsTitle =
    globalFilter === DEFAULT_DASHBOARD_FILTER ? "All Time Transactions" : `Transactions (${periodLabel})`;

  return (
    <div className="pb-10">
      <Breadcrumb items={[{ label: "Dashboard" }]} />

      <div className="admin-fade-up relative z-30 mb-6 flex flex-col gap-3 overflow-visible sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Completed volumes, revenue and profit overview</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {loading ? (
            <span className="inline-flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </span>
          ) : null}
          <DashboardDateFilter
            open={globalFilterOpen}
            onToggle={() => setGlobalFilterOpen((open) => !open)}
            onClose={() => setGlobalFilterOpen(false)}
            activeFilter={globalFilter}
            customFrom={globalCustomFrom}
            customTo={globalCustomTo}
            onCustomFrom={setGlobalCustomFrom}
            onCustomTo={setGlobalCustomTo}
            onSelectPreset={(filter) => applyGlobalFilter(filter)}
            onApplyCustom={() => {
              if (!globalCustomFrom || !globalCustomTo) {
                setError("Select both start and end dates for a custom range.");
                return;
              }
              applyGlobalFilter("customdate", globalCustomFrom, globalCustomTo);
            }}
          />
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="relative z-0 grid gap-4 lg:grid-cols-2">
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
              canExport={canFilterDeposits}
              exportOpen={depositExportOpen}
              onToggleExport={() => setDepositExportOpen((open) => !open)}
              onCloseMenus={() => setDepositExportOpen(false)}
              onExport={async () => {
                setDepositExportOpen(false);
                try {
                  await downloadDepositsExport({
                    status: "Completed",
                    filter: depositFilter,
                    fromDate: depositFilter === "customdate" ? globalCustomFrom : undefined,
                    toDate: depositFilter === "customdate" ? globalCustomTo : undefined,
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
              canExport={canFilterWithdrawals}
              exportOpen={withdrawalExportOpen}
              onToggleExport={() => setWithdrawalExportOpen((open) => !open)}
              onCloseMenus={() => setWithdrawalExportOpen(false)}
              onExport={async () => {
                setWithdrawalExportOpen(false);
                try {
                  await downloadWithdrawalsExport({
                    status: "Completed",
                    filter: withdrawalFilter,
                    fromDate: withdrawalFilter === "customdate" ? globalCustomFrom : undefined,
                    toDate: withdrawalFilter === "customdate" ? globalCustomTo : undefined,
                  });
                } catch (err) {
                  setError(err.message || "Export failed.");
                }
              }}
            />
          </div>
        </article>
      </div>

      <div className="relative z-0 mt-4 grid gap-4 xl:grid-cols-12">
        <section className="admin-card admin-fade-up p-5 xl:col-span-6">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">{revenueTitle}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{periodLabel}</p>
            </div>
          </div>
          {isLoading ? <Skeleton className="h-52 w-full" /> : (
            <BarChart values={data?.monthlyRevenue ?? []} labels={revenueLabels} />
          )}
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-1 flex flex-col p-5 xl:col-span-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">{profitTitle}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{periodLabel}</p>
            </div>
          </div>
          <div className="mt-2 h-36 flex-1">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DotLineChart
                points={data?.monthlyProfit ?? []}
                labels={data?.profitChartLabels?.length ? data.profitChartLabels : MONTHS.slice(0, (data?.monthlyProfit ?? []).length || 12)}
                color="#22c55e"
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
                <p className="text-base font-bold text-white">{formatDashboardLkr(data?.currentMonthProfit)}</p>
                <PercentChange value={data?.lastMonthPercentageIncrease ?? 0} />
              </>
            )}
          </div>
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-2 flex flex-col p-5 xl:col-span-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">{dailyProfitTitle}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{dailyProfitSubtitle}</p>
            </div>
          </div>
          <div className="mt-2 h-36 flex-1">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DotLineChart
                points={data?.dailyProfit ?? []}
                labels={
                  data?.dailyProfitLabels?.length
                    ? data.dailyProfitLabels
                    : (data?.dailyProfit ?? []).map((_, i) => `Day ${i + 1}`)
                }
                color="#ef4444"
                showDots={(data?.dailyProfit ?? []).some((v) => Number(v) !== 0)}
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

      <div className="relative z-0 mt-4 grid gap-4 lg:grid-cols-2">
        <section className="admin-card admin-fade-up p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-100">{platformsTitle}</h2>
          </div>
          {isLoading ? (
            <ul className="divide-y divide-white/10">
              {Array.from({ length: 5 }).map((_, index) => (
                <li key={index} className="flex items-center justify-between gap-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </li>
              ))}
            </ul>
          ) : platforms.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No active wallets to show.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Deposits
                </h3>
                <ul className="divide-y divide-white/10">
                  <PlatformWalletRows items={depositPlatforms} />
                </ul>
              </div>
              <div className="border-t border-white/10 pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Withdrawals
                </h3>
                <ul className="divide-y divide-white/10">
                  <PlatformWalletRows items={withdrawalPlatforms} />
                </ul>
              </div>
            </div>
          )}
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
