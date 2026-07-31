"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { assignDeposits, fetchDepositExecutives } from "@/lib/deposits";

export default function AssignDepositsModal({ open, depositIds, onClose, onAssigned }) {
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [activeShift, setActiveShift] = useState("—");
  const [executives, setExecutives] = useState([]);
  const [executiveId, setExecutiveId] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setExecutiveId("");
    setLoading(true);
    fetchDepositExecutives()
      .then((data) => {
        setActiveShift(data.active_shift ? `Shift ${data.active_shift}` : "—");
        setExecutives(data.executives || []);
      })
      .catch((err) => setError(err.message || "Failed to load executives."))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleConfirm() {
    if (!depositIds?.length) {
      setError("Please select at least one deposit.");
      return;
    }
    setAssigning(true);
    setError("");
    try {
      await assignDeposits({
        depositIds,
        executiveId: executiveId ? Number(executiveId) : null,
      });
      onAssigned?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to assign deposits.");
    } finally {
      setAssigning(false);
    }
  }

  if (!open) return null;

  return (
    <div className="admin-modal-overlay z-[80]" onClick={onClose}>
      <div className="admin-card w-full max-w-xl p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white">Assign Deposits to Executive</h3>
        <p className="mt-1 text-sm text-slate-400">
          Selected deposits: <span className="font-semibold text-white">{depositIds.length}</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Today&apos;s active shift: <span className="font-semibold text-white">{activeShift}</span>
        </p>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Select Executive
          </span>
          <select
            value={executiveId}
            onChange={(e) => setExecutiveId(e.target.value)}
            disabled={loading || assigning}
            className="w-full rounded-xl border border-white/10 bg-admin-chrome-deep px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="" className="bg-admin-surface">
              -- Unassign (Remove assignment) --
            </option>
            {executives.map((exec) => (
              <option key={exec.id} value={exec.id} className="bg-admin-surface">
                {`${exec.is_online ? "🟢" : "⚫"} ${exec.name} (${exec.role}) - ${
                  exec.shift ? `Shift ${exec.shift}` : "—"
                } - Pending: ${exec.pending_count}`}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="admin-btn-secondary" disabled={assigning}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={assigning || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
