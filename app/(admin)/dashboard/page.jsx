"use client";

import Breadcrumb from "@/components/admin/breadcrumb";
import {
  Banknote,
  Briefcase,
  ChevronDown, 
  DollarSign,
  HandCoins,
  MoreVertical,
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Monthly revenue in '000 USD — Feb ~0.4, Apr ~0.1, rest near 0 */
const MONTHLY_REVENUE = [0.02, 0.4, 0.01, 0.1, 0.015, 0.02, 0.01, 0.005, 0.01, 0.02, 0.01, 0.015];
/** Monthly profit index — peaks Feb / Apr */
const MONTHLY_PROFIT = [0.05, 0.95, 0.08, 0.72, 0.06, 0.04, 0.03, 0.05, 0.04, 0.06, 0.03, 0.05];
const DAILY_PROFIT = Array.from({ length: 31 }, () => 0);

const PLATFORMS = [
  { name: "XM", amount: "$5,969.51", letter: "X", bg: "bg-[#F59E0B]", text: "text-white" },
  { name: "Skrill", amount: "$2,317.64", letter: "S", bg: "bg-[#862165]", text: "text-white" },
  { name: "Neteller", amount: "$171,032.20", letter: "N", bg: "bg-[#6BBE45]", text: "text-white" },
  { name: "Perfect Money", amount: "$144,731.03", letter: "P", bg: "bg-[#E11D48]", text: "text-white" },
  { name: "USDT", amount: "USDT5,197,262.34", letter: "₮", bg: "bg-[#26A17B]", text: "text-white" },
];

function CardMenu() {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
      >
        Export
        <ChevronDown className="h-3 w-3 opacity-90" />
      </button>
      <button
        type="button"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        aria-label="More options"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

function EllipsisOnly() {
  return (
    <button
      type="button"
      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
      aria-label="More options"
    >
      <MoreVertical className="h-4 w-4" />
    </button>
  );
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
  const ticks = [0, 0.1, 0.2, 0.3, 0.4];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label="Monthly revenue bar chart">
      {ticks.map((t) => {
        const y = padT + chartH - (t / max) * chartH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-400" fontSize="9">
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
          <g key={labels[i]}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill="#236B6B" opacity={v > 0.05 ? 1 : 0.55} />
            <text
              x={x + barW / 2}
              y={h - 8}
              textAnchor="middle"
              className="fill-slate-400"
              fontSize="9"
            >
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
  const max = Math.max(...points, 0.01);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = padX + (i / Math.max(points.length - 1, 1)) * (w - padX * 2);
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
          <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5" />
        ))}
    </svg>
  );
}

function FlatLineChart({ days = 31, color = "#ef4444", height = 140 }) {
  const w = 320;
  const h = height;
  const padX = 8;
  const midY = h / 2;
  const points = Array.from({ length: days }, (_, i) => {
    const x = padX + (i / (days - 1)) * (w - padX * 2);
    return `${x},${midY}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <line x1={padX} y1={midY} x2={w - padX} y2={midY} stroke="#f1f5f9" strokeWidth="1" />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={points} />
    </svg>
  );
}

function GrowthGauge({ percent = -99.92 }) {
  const r = 70;
  const cx = 100;
  const cy = 95;
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweep = Math.abs(percent) / 100;
  const clamped = Math.min(Math.max(sweep, 0.02), 1);
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
      <path d={track} fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
      <path d={arc} fill="none" stroke="#EAB308" strokeWidth="14" strokeLinecap="round" />
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-900" fontSize="22" fontWeight="700">
        {percent.toFixed(2)} %
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <div className="pb-10">
      <Breadcrumb items={[{ label: "Dashboard" }]} />

      <div className="admin-fade-up mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Completed volumes, revenue and profit overview</p>
      </div>

      {/* Row 1 — deposits / withdrawals */}
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="admin-card admin-fade-up p-5">
          <div className="admin-stat-glow -right-8 -top-10 bg-theme-green-action" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-theme-green-action text-white shadow-sm">
                <Banknote className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Total Completed Deposits</p>
                <p className="mt-0.5 text-xs text-slate-400">2026</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">$ 505.95</p>
              </div>
            </div>
            <CardMenu />
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
                <p className="text-sm font-semibold text-slate-800">Total Completed Withdrawals</p>
                <p className="mt-0.5 text-xs text-slate-400">2026</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">$ 0.00</p>
              </div>
            </div>
            <CardMenu />
          </div>
        </article>
      </div>

      {/* Row 2 — revenue + profit charts */}
      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <section className="admin-card admin-fade-up p-5 xl:col-span-6">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Total Monthly Revenue in (&apos;000 USD)</h2>
              <p className="mt-0.5 text-xs text-slate-400">2026</p>
            </div>
            <EllipsisOnly />
          </div>
          <BarChart values={MONTHLY_REVENUE} labels={MONTHS} />
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-1 flex flex-col p-5 xl:col-span-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Monthly Profit</h2>
              <p className="mt-0.5 text-xs text-slate-400">2026</p>
            </div>
            <EllipsisOnly />
          </div>
          <div className="mt-2 h-36 flex-1">
            <DotLineChart points={MONTHLY_PROFIT} color="#22c55e" />
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
            <p className="text-base font-bold text-slate-900">LKR 0.00</p>
            <p className="text-sm font-semibold text-red-500">0.00%</p>
          </div>
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-2 flex flex-col p-5 xl:col-span-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Daily Profit</h2>
              <p className="mt-0.5 text-xs text-slate-400">July</p>
            </div>
            <EllipsisOnly />
          </div>
          <div className="mt-2 h-36 flex-1">
            <FlatLineChart days={DAILY_PROFIT.length} color="#ef4444" />
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
            <p className="text-base font-bold text-slate-900">LKR 0.00</p>
            <p className="text-sm font-semibold text-red-500">0.00%</p>
          </div>
        </section>
      </div>

      {/* Row 3 — transactions + growth */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="admin-card admin-fade-up p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">All Time Transactions</h2>
            <EllipsisOnly />
          </div>
          <ul className="divide-y divide-slate-100">
            {PLATFORMS.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${p.bg} ${p.text}`}
                  >
                    {p.letter}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">Deposits</p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums text-slate-900">{p.amount}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-card admin-fade-up admin-fade-up-delay-1 p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Company Growth</h2>
            <EllipsisOnly />
          </div>

          <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <GrowthGauge percent={-99.92} />
            </div>

            <div className="flex flex-1 flex-col gap-4 sm:max-w-[200px]">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-slate-400">2025</p>
                  <p className="text-base font-bold text-slate-900">601.42 K</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-slate-400">2026</p>
                  <p className="text-base font-bold text-slate-900">0.51 K</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
