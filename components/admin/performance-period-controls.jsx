"use client";

import { PERFORMANCE_PERIODS, defaultCommissionRange } from "@/lib/performance";

const dateInputCls =
  "rounded-xl border border-white/10 bg-admin-chrome-deep px-2.5 py-2 text-xs text-slate-100 outline-none transition focus:border-admin-teal/50 focus:ring-2 focus:ring-admin-teal/20 [color-scheme:dark]";

export function PerformancePeriodControls({
  period,
  from,
  to,
  onPeriodChange,
  onRangeChange,
  extra,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PERFORMANCE_PERIODS.map((nextPeriod) => (
        <button
          key={nextPeriod}
          type="button"
          onClick={() => {
            if (nextPeriod === "Custom" && period !== "Custom") {
              const defaults = defaultCommissionRange();
              onRangeChange?.(defaults.from, defaults.to);
            }
            onPeriodChange(nextPeriod);
          }}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            period === nextPeriod
              ? "bg-gradient-to-r from-admin-teal to-admin-teal-deep text-white shadow-sm"
              : "border border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
          }`}
        >
          {nextPeriod}
        </button>
      ))}
      {period === "Custom" ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
            From
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => onRangeChange?.(event.target.value, to)}
              className={dateInputCls}
            />
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => onRangeChange?.(from, event.target.value)}
              className={dateInputCls}
            />
          </label>
        </div>
      ) : null}
      {extra}
    </div>
  );
}
