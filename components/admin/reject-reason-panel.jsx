"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { FormError } from "@/components/admin/queue-ui";

export const REJECT_REASONS = [
  "Payment slip unclear",
  "Account ID mismatch",
  "Insufficient funds / points",
  "Duplicate request",
  "Fraud suspected",
  "Custom",
];

function isCustomReason(value) {
  const key = String(value || "").trim().toLowerCase();
  return key === "custom" || key === "custom message";
}

function RejectReasonForm({
  onConfirm,
  onCancel,
  confirmLabel = "Confirm reject",
  cancelLabel = "Cancel",
  compact = false,
  error = "",
  busy = false,
  reasons = REJECT_REASONS,
}) {
  const options = reasons.length ? reasons : REJECT_REASONS;
  const [reason, setReason] = useState(options[0]);
  const [custom, setCustom] = useState("");

  function submit() {
    const finalReason = isCustomReason(reason) ? custom.trim() : reason;
    if (!finalReason) return;
    onConfirm?.(finalReason);
  }

  return (
    <>
      <label className={`block ${compact ? "mb-1.5" : "mb-2"}`}>
        <span className={`font-medium text-slate-300 ${compact ? "text-xs" : "text-sm"}`}>
          Rejection reason
        </span>
        <span className={`mt-0.5 block text-slate-500 ${compact ? "text-[11px]" : "text-xs"}`}>
          This message is sent to the customer by SMS and email.
        </span>
      </label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="admin-input text-sm"
        aria-label="Rejection reason"
      >
        {options.map((r) => (
          <option key={r} value={r} className="bg-admin-surface text-slate-100">
            {r}
          </option>
        ))}
      </select>
      {isCustomReason(reason) ? (
        <textarea
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          rows={3}
          placeholder="Enter a custom message for the customer…"
          className="admin-input mt-3 text-sm"
          aria-label="Custom rejection message"
        />
      ) : null}
      <FormError message={error} className={compact ? "mt-3" : "mt-4"} />
      <div className={`flex justify-end gap-2 ${compact ? "mt-3" : "mt-5"}`}>
        <button type="button" onClick={onCancel} className="admin-btn-secondary px-4 py-2 text-sm" disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy || (isCustomReason(reason) && !custom.trim())}
          className="inline-flex items-center gap-1.5 rounded-xl bg-admin-danger px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40"
        >
          <AlertTriangle className="h-4 w-4" />
          {confirmLabel}
        </button>
      </div>
    </>
  );
}

/** Reject reason UI — inline panel or full modal for row actions. */
export default function RejectReasonPanel({
  onConfirm,
  onCancel,
  confirmLabel = "Confirm reject",
  cancelLabel = "Cancel",
  className = "",
  variant = "inline",
  open = false,
  title = "Reject deposit?",
  subtitle,
  error = "",
  busy = false,
  reasons,
}) {
  if (variant === "modal") {
    if (!open) return null;

    return (
      <div className="admin-modal-overlay z-[85]" onClick={onCancel} role="presentation">
        <div
          className="admin-card flex w-full max-w-md flex-col overflow-hidden p-0 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-reason-title"
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Reject transaction
              </div>
              <h3 id="reject-reason-title" className="text-lg font-semibold text-white">
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-1 truncate text-sm text-slate-400">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-5 py-4">
            <RejectReasonForm
              onConfirm={onConfirm}
              onCancel={onCancel}
              confirmLabel={confirmLabel}
              cancelLabel={cancelLabel}
              error={error}
              busy={busy}
              reasons={reasons}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-rose-400/30 bg-[#121826] p-4 shadow-xl ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <RejectReasonForm
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        compact
        error={error}
        busy={busy}
        reasons={reasons}
      />
    </div>
  );
}
