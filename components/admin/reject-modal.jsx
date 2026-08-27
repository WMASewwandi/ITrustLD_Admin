"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { FormError } from "@/components/admin/queue-ui";

const PRESET = [
  "Payment slip unclear",
  "Account ID mismatch",
  "Insufficient funds / points",
  "Duplicate request",
  "Fraud suspected",
  "Custom",
];

function isCustomReason(value) {
  const key = String(value || "").trim().toLowerCase();
  return key === "custom" || key === "custom message" || key === "other";
}

export default function RejectModal({
  open,
  title = "Reject record",
  onClose,
  onConfirm,
  error = "",
  busy = false,
  reasons,
}) {
  const options = reasons?.length ? reasons : PRESET;
  const [reason, setReason] = useState(options[0] || "");
  const [custom, setCustom] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason(options[0] || "");
    setCustom("");
    setConfirming(false);
  }, [open, options[0]]);

  if (!open) return null;

  const finalReason = isCustomReason(reason) ? custom.trim() : reason;
  const canContinue = Boolean(finalReason);

  async function submit() {
    if (!canContinue) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await onConfirm?.(finalReason);
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
              {options.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {isCustomReason(reason) ? (
              <textarea
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Enter custom rejection reason…"
                className="admin-input"
              />
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            Reason: <span className="font-semibold">{finalReason}</span>
          </div>
        )}

        <FormError message={error} className="mt-4" />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              onClose?.();
            }}
            className="admin-btn-secondary"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !canContinue}
            className="rounded-xl bg-admin-danger px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
          >
            {busy ? "Please wait…" : confirming ? "Confirm Reject" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
