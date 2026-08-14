"use client";

import { useEffect, useState } from "react";

export const DEPOSIT_PROOF_REJECT_REASONS = [
  "Your slip is not clear",
  "The transaction date does not match",
  "Cash not received today",
  "Your order amount does not match",
  "Duplicate submission, your account is at risk",
  "Your slip details are incomplete",
  "Your slip's XM ID remark is missing",
  "Contact live chat for assistance",
  "Please write your XM ID clearly in the center of the slip",
  "Please Subscribe IB - 67104269",
  "Custom Message",
];

const STATUS_OPTIONS = [
  { value: "Completed", label: "Completed" },
  { value: "Pending", label: "Pending" },
  { value: "Pending Authorization", label: "Pending Authorization" },
  { value: "Rejected", label: "Rejected" },
];

export default function DepositProofStatusPanel({
  initialStatus = "Pending",
  saving = false,
  includeAuthorization = false,
  error = "",
  onCancel,
  onSave,
}) {
  const [status, setStatus] = useState(initialStatus);
  const [rejectReason, setRejectReason] = useState(DEPOSIT_PROOF_REJECT_REASONS[0]);
  const [rejectMessage, setRejectMessage] = useState("");
  const statusOptions = includeAuthorization
    ? STATUS_OPTIONS
    : STATUS_OPTIONS.filter((option) => option.value !== "Pending Authorization");

  useEffect(() => {
    setStatus(initialStatus || "Pending");
    setRejectReason(DEPOSIT_PROOF_REJECT_REASONS[0]);
    setRejectMessage("");
  }, [initialStatus]);

  function handleSave() {
    if (status === "Rejected") {
      const message =
        rejectReason === "Custom Message" ? rejectMessage.trim() : rejectMessage.trim() || rejectReason;
      if (!message) return;
      onSave?.({
        status,
        rejectedReason: rejectReason,
        rejectedReasonMessage: message,
      });
      return;
    }
    onSave?.({ status });
  }

  const saveDisabled =
    saving || (status === "Rejected" && rejectReason === "Custom Message" && !rejectMessage.trim());

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-white">Transaction status</p>
        <div className="flex flex-wrap gap-4">
          {statusOptions.map((option) => (
            <label
              key={option.value}
              className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-200"
            >
              <input
                type="radio"
                name="deposit-proof-status"
                value={option.value}
                checked={status === option.value}
                onChange={() => setStatus(option.value)}
                className="h-4 w-4 border-white/20 bg-admin-chrome-deep text-admin-teal focus:ring-admin-teal/30"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      {status === "Rejected" ? (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">Rejected reason</label>
          <select
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="admin-input text-sm"
            aria-label="Rejected reason"
          >
            {DEPOSIT_PROOF_REJECT_REASONS.map((reason) => (
              <option key={reason} value={reason} className="bg-admin-surface text-slate-100">
                {reason}
              </option>
            ))}
          </select>
          <label className="mb-2 mt-3 block text-sm font-medium text-slate-300">
            Message to customer
          </label>
          <textarea
            value={rejectMessage}
            onChange={(e) => setRejectMessage(e.target.value)}
            rows={3}
            placeholder={
              rejectReason === "Custom Message"
                ? "Enter a custom rejection message…"
                : "Optional — leave blank to use the selected reason"
            }
            className="admin-input text-sm"
          />
        </div>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
        <button type="button" onClick={onCancel} className="admin-btn-secondary px-4 py-2 text-sm" disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveDisabled}
          className="inline-flex items-center justify-center rounded-xl bg-theme-green-action px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
