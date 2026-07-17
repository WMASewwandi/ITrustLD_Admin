"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import { CURRENCY_TYPES, PAYMENT_METHODS } from "@/lib/mock-data";

const emptyForm = {
  name: "",
  currency: "USDT",
  minLimit: "",
  maxLimit: "",
};

function nextId(rows) {
  const max = rows.reduce((acc, row) => {
    const n = Number(row.id);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return max + 1;
}

function formatLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 gap-y-1 border-b border-white/10 py-2.5 last:border-b-0 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-white">{children}</dd>
    </div>
  );
}

function CheckboxControl({ checked, label, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium transition ${
        checked ? "text-theme-green-action" : "text-slate-500 hover:text-slate-100"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
          checked
            ? "border-theme-green-action bg-theme-green-action text-white"
            : "border-white/20 bg-admin-surface"
        }`}
      >
        {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </span>
      {label}
    </button>
  );
}

export default function PaymentMethodsPanel() {
  const [rows, setRows] = useState(PAYMENT_METHODS);
  const [modal, setModal] = useState(null);

  const currencyOptions = CURRENCY_TYPES.filter((c) => c.active !== false);

  function openAdd() {
    setModal({ mode: "add", ...emptyForm });
  }

  function openEdit(row) {
    setModal({
      mode: "edit",
      id: row.id,
      name: row.name,
      currency: row.currency || "USDT",
      minLimit: row.minLimit === 0 || row.minLimit ? String(row.minLimit) : "",
      maxLimit: row.maxLimit === 0 || row.maxLimit ? String(row.maxLimit) : "",
    });
  }

  function save() {
    if (!modal) return;
    const { mode, id, name, currency, minLimit, maxLimit } = modal;
    if (!name.trim() || !currency) return;

    const payload = {
      name: name.trim(),
      currency,
      minLimit: Number(minLimit) || 0,
      maxLimit: Number(maxLimit) || 0,
    };

    if (mode === "edit") {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...payload } : row)));
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: nextId(prev),
          ...payload,
          active: true,
          priority: false,
        },
      ]);
    }
    setModal(null);
  }

  function toggleActive(id) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, active: !row.active } : row))
    );
  }

  function setPriority(id) {
    setRows((prev) => {
      const target = prev.find((r) => r.id === id);
      if (!target) return prev;
      if (target.priority) {
        return prev.map((row) => (row.id === id ? { ...row, priority: false } : row));
      }
      return prev.map((row) => ({ ...row, priority: row.id === id }));
    });
  }

  function remove(id) {
    if (!window.confirm("Delete this payment method?")) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  return (
    <div className="mt-5">
      <div className="admin-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white">Payment Method</h2>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl border border-theme-green-action bg-admin-surface px-3.5 py-2 text-sm font-semibold text-theme-green-action shadow-sm transition hover:bg-theme-green-action/10"
        >
          <Plus className="h-4 w-4" />
          Add Method
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {rows.map((row, i) => (
          <article
            key={row.id}
            className={`admin-card admin-fade-up overflow-visible p-0 ${
              i % 2 === 1 ? "admin-fade-up-delay-1" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <h3 className="text-base font-semibold text-white">{row.name}</h3>
              <CheckboxControl
                checked={row.active}
                label="Activate Method"
                onChange={() => toggleActive(row.id)}
              />
            </div>

            <dl className="px-5 py-2">
              <FieldRow label="ID">{row.id}</FieldRow>
              <FieldRow label="Currency">{row.currency}</FieldRow>
              <FieldRow label="Minimum limit">{formatLimit(row.minLimit)}</FieldRow>
              <FieldRow label="Maximum limit">{formatLimit(row.maxLimit)}</FieldRow>
            </dl>

            <div className="border-t border-white/10 px-5 py-3">
              <CheckboxControl
                checked={row.priority}
                label="This is the priority payment method"
                onChange={() => setPriority(row.id)}
              />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3.5">
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-green-action px-3 py-1.5 text-sm font-semibold text-theme-green-action transition hover:bg-theme-green-action/10"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E11D48] px-3 py-1.5 text-sm font-semibold text-[#E11D48] transition hover:bg-[#E11D48]/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="admin-card mt-5 p-8 text-center text-sm text-slate-400">
          No payment methods yet. Click Add Method to create one.
        </div>
      ) : null}

      {modal ? (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div
            className="admin-card w-full max-w-md overflow-visible p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {modal.mode === "edit" ? "Edit Payment Method" : "Add Payment Method"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {modal.mode === "edit"
                    ? "Update the details below for this payment method."
                    : "Fill the below details to add a payment method."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="shrink-0 text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="mt-5 space-y-4"
            >
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  Payment Method Name
                </span>
                <input
                  required
                  value={modal.name}
                  onChange={(e) => setModal((m) => ({ ...m, name: e.target.value }))}
                  className={inputCls}
                  placeholder="Enter payment method name"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Currency</span>
                <select
                  required
                  value={modal.currency}
                  onChange={(e) => setModal((m) => ({ ...m, currency: e.target.value }))}
                  className={inputCls}
                >
                  {currencyOptions.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} - {c.symbol}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  Minimum Limit
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={modal.minLimit}
                  onChange={(e) => setModal((m) => ({ ...m, minLimit: e.target.value }))}
                  className={inputCls}
                  placeholder="Enter minimum limit"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  Maximum Limit
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={modal.maxLimit}
                  onChange={(e) => setModal((m) => ({ ...m, maxLimit: e.target.value }))}
                  className={inputCls}
                  placeholder="Enter maximum limit"
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setModal(null)} className="admin-btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                >
                  {modal.mode === "edit" ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
