"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const PRESET = [
  "Payment slip unclear",
  "Account ID mismatch",
  "Insufficient funds / points",
  "Duplicate request",
  "Fraud suspected",
  "Custom",
];

export default function RejectModal({ open, title = "Reject record", onClose, onConfirm }) {
  const [reason, setReason] = useState(PRESET[0]);
  const [custom, setCustom] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (!open) return null;

  function submit() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    const finalReason = reason === "Custom" ? custom.trim() : reason;
    if (!finalReason) return;
    onConfirm?.(finalReason);
    setConfirming(false);
    setReason(PRESET[0]);
    setCustom("");
    onClose?.();
  }

  return (
    <div className="admin-modal-overlay z-[80]" onClick={onClose}>
      <div className="admin-card w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {confirming
                  ? "Confirm — this reason will be shown to the customer."
                  : "Select a rejection reason shown to the customer."}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!confirming ? (
          <div className="space-y-3">
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="admin-input"
            >
              {PRESET.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {reason === "Custom" ? (
              <textarea
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                rows={3}
                placeholder="Custom reject message"
                className="admin-input"
              />
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            Reason: <span className="font-semibold">{reason === "Custom" ? custom : reason}</span>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              onClose?.();
            }}
            className="admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-xl bg-admin-danger px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            {confirming ? "Confirm Reject" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
