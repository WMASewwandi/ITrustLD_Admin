"use client";

import { useState } from "react";

export const REJECT_REASONS = [
  "Payment slip unclear",
  "Account ID mismatch",
  "Insufficient funds / points",
  "Duplicate request",
  "Fraud suspected",
  "Custom",
];

/** Inline reject reason fields — use under a Reject button instead of a separate modal. */
export default function RejectReasonPanel({
  onConfirm,
  onCancel,
  confirmLabel = "Confirm Reject",
  className = "",
}) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [custom, setCustom] = useState("");

  function submit() {
    const finalReason = reason === "Custom" ? custom.trim() : reason;
    if (!finalReason) return;
    onConfirm?.(finalReason);
  }

  return (
    <div
      className={`rounded-xl border border-rose-400/30 bg-[#121826] p-3 shadow-xl ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="mb-2 text-[11px] font-medium text-slate-400">
        Rejection reason (shown to customer)
      </p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="admin-input text-sm"
      >
        {REJECT_REASONS.map((r) => (
          <option key={r} value={r} className="bg-admin-surface">
            {r}
          </option>
        ))}
      </select>
      {reason === "Custom" ? (
        <textarea
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          rows={2}
          placeholder="Custom reject message"
          className="admin-input mt-2 text-sm"
        />
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="admin-btn-secondary px-3 py-1.5 text-xs">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={reason === "Custom" && !custom.trim()}
          className="rounded-lg bg-admin-danger px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
