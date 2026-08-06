"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { fetchShiftCalendar, updateShiftSchedule } from "@/lib/shifts";
import { getColomboDateParts } from "@/lib/sl-time";
import { useCan } from "@/contexts/admin-permissions";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Pencil, RefreshCw } from "lucide-react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shiftBadgeClass(shift) {
  if (shift === "A") {
    return "bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30";
  }
  if (shift === "B") {
    return "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30";
  }
  return "bg-white/10 text-white/50 ring-1 ring-white/10";
}

export default function ShiftManagementPage() {
  const canView = useCan("view_shift_schedule");
  const canEdit = useCan("change_shift_schedule");
  const colomboNow = useMemo(() => getColomboDateParts(), []);
  const [year, setYear] = useState(colomboNow.year);
  const [month, setMonth] = useState(colomboNow.month);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [editDay, setEditDay] = useState(null);
  const [editShift, setEditShift] = useState("A");
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCalendar = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await fetchShiftCalendar({ year, month });
        setCalendar(res.calendar ?? null);
      } catch (err) {
        setError(err.message || "Failed to load shift calendar.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [year, month],
  );

  useEffect(() => {
    if (canView) loadCalendar();
  }, [canView, loadCalendar]);

  function goMonth(delta) {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setYear(nextYear);
    setMonth(nextMonth);
  }

  const leadingBlanks = calendar?.start_weekday ?? 0;
  const cells = useMemo(() => {
    if (!calendar?.days) return [];
    const blanks = Array.from({ length: leadingBlanks }, (_, i) => ({ type: "blank", key: `b-${i}` }));
    const dayCells = calendar.days.map((day) => ({ type: "day", key: day.date, ...day }));
    const total = blanks.length + dayCells.length;
    const trailing = (7 - (total % 7)) % 7;
    const trailBlanks = Array.from({ length: trailing }, (_, i) => ({
      type: "blank",
      key: `t-${i}`,
    }));
    return [...blanks, ...dayCells, ...trailBlanks];
  }, [calendar, leadingBlanks]);

  function openEditDay(day) {
    if (!canEdit || !day?.can_edit) return;
    setEditDay(day);
    setEditShift(day.active_shift === "B" ? "B" : "A");
    setSaveError(null);
  }

  async function handleSaveShift() {
    if (!editDay || !canEdit) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateShiftSchedule({ shift_date: editDay.date, active_shift: editShift });
      setEditDay(null);
      await loadCalendar(true);
    } catch (err) {
      setSaveError(err.message || "Failed to update shift.");
    } finally {
      setSaving(false);
    }
  }

  if (!canView) {
    return (
      <div className="admin-page-shell">
        <p className="text-sm text-slate-400">You do not have permission to view shift management.</p>
      </div>
    );
  }

  return (
    <div className="admin-page-shell space-y-5">
      <Breadcrumb
        items={[
          { label: "System & Scammer", href: "/system/users" },
          { label: "Shift Management" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Shift Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Active shift per business day (0:10 AM – 0:10 AM next day, Sri Lanka time). Shift A and
            Shift B alternate daily.
          </p>
          {!canEdit ? (
            <p className="mt-2 text-xs font-medium text-amber-300/90">
              View only — you can see the schedule but cannot change active shifts.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => loadCalendar(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {calendar ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="admin-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Today&apos;s active shift
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              Shift {calendar.today_active_shift || "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Business day: {calendar.today_shift_date}</p>
          </div>
          <div className="admin-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Shift A days
            </p>
            <p className="mt-2 text-2xl font-bold text-sky-200">
              {calendar.summary?.shift_a_days ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">In {calendar.month_name} {calendar.year}</p>
          </div>
          <div className="admin-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Shift B days
            </p>
            <p className="mt-2 text-2xl font-bold text-violet-200">
              {calendar.summary?.shift_b_days ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">In {calendar.month_name} {calendar.year}</p>
          </div>
        </div>
      ) : null}

      <div className="admin-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-white">
            <CalendarDays className="h-5 w-5 text-admin-teal" />
            <h2 className="text-base font-semibold">
              {calendar ? `${calendar.month_name} ${calendar.year}` : "Calendar"}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = getColomboDateParts();
                setYear(now.year);
                setMonth(now.month);
              }}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => goMonth(1)}
              className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-20 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading calendar…
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-sm text-rose-300">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((cell) =>
                cell.type === "blank" ? (
                  <div
                    key={cell.key}
                    className="min-h-[88px] border-b border-r border-white/5 bg-white/[0.01] last:border-r-0"
                  />
                ) : (
                  <div
                    key={cell.key}
                    className={`min-h-[88px] border-b border-r border-white/5 p-2 last:border-r-0 ${
                      cell.is_today ? "bg-admin-teal/10 ring-1 ring-inset ring-admin-teal/30" : "bg-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`text-sm font-semibold ${
                          cell.is_today ? "text-admin-teal" : "text-white/85"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {cell.is_today ? (
                        <span className="rounded-full bg-admin-teal/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-admin-teal">
                          Today
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-bold ${shiftBadgeClass(
                          cell.active_shift,
                        )}`}
                      >
                        Shift {cell.active_shift}
                      </span>
                      {canEdit && cell.can_edit ? (
                        <button
                          type="button"
                          onClick={() => openEditDay(cell)}
                          className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                          aria-label={`Edit shift for ${cell.date}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className={`inline-flex rounded-md px-2 py-0.5 font-semibold ${shiftBadgeClass("A")}`}>
            Shift A
          </span>
          Deposit / withdrawal executives on Shift A work this business day.
        </span>
        <span className="inline-flex items-center gap-2">
          <span className={`inline-flex rounded-md px-2 py-0.5 font-semibold ${shiftBadgeClass("B")}`}>
            Shift B
          </span>
          Alternates with Shift A at 0:10 AM SL.
        </span>
      </div>

      {editDay && canEdit ? (
        <div className="admin-modal-overlay z-[86]" onClick={() => !saving && setEditDay(null)} role="presentation">
          <div
            className="admin-card w-full max-w-md p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-white">Edit active shift</h3>
            <p className="mt-2 text-sm text-slate-400">
              Business day <span className="font-medium text-white">{editDay.date}</span>. Future days
              will alternate automatically (e.g. if today is B, tomorrow becomes A).
            </p>
            <div className="mt-4 flex gap-2">
              {["A", "B"].map((shift) => (
                <button
                  key={shift}
                  type="button"
                  disabled={saving}
                  onClick={() => setEditShift(shift)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    editShift === shift
                      ? shift === "A"
                        ? "border-sky-400/50 bg-sky-500/20 text-sky-100"
                        : "border-violet-400/50 bg-violet-500/20 text-violet-100"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  Shift {shift}
                </button>
              ))}
            </div>
            {saveError ? (
              <p className="mt-3 text-sm text-rose-300">{saveError}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditDay(null)}
                className="admin-btn-secondary px-4 py-2 text-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveShift}
                disabled={saving || editShift === editDay.active_shift}
                className="rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save shift"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
