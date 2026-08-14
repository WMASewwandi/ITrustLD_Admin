"use client";

import { FormError } from "@/components/admin/queue-ui";

export default function DepositStatusConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Yes",
  confirmClassName = "bg-theme-green-action",
  busy = false,
  error = "",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="admin-modal-overlay z-[86]" onClick={onCancel} role="presentation">
      <div
        className="admin-card w-full max-w-sm p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {message ? <p className="mt-2 text-sm text-slate-400">{message}</p> : null}
        <FormError message={error} className="mt-3" />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="admin-btn-secondary px-4 py-2 text-sm" disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40 ${confirmClassName}`}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
