"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import { CURRENCY_TYPES } from "@/lib/mock-data";

const emptyForm = {
  name: "",
  code: "",
  symbol: "",
  description: "",
  active: true,
};

function nextId(rows) {
  const max = rows.reduce((acc, row) => {
    const n = Number(String(row.id).replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `CT-${max + 1}`;
}

function ActiveCheckbox({ checked, onChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action"
      title={checked ? "Active" : "Set as active"}
    />
  );
}

function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg bg-theme-green-action/90 p-1.5 text-white shadow-sm transition hover:brightness-110"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm transition hover:brightness-110"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ModalShell({ title, onClose, children, onSave }) {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-card w-full max-w-md overflow-visible p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="space-y-4"
        >
          {children}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="admin-btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CurrencyTypesPanel() {
  const [rows, setRows] = useState(CURRENCY_TYPES);
  const [modal, setModal] = useState(null);

  function openAdd() {
    setModal({ mode: "add", ...emptyForm });
  }

  function openEdit(row) {
    setModal({
      mode: "edit",
      id: row.id,
      name: row.name,
      code: row.code,
      symbol: row.symbol,
      description: row.description,
      active: row.active,
    });
  }

  function save() {
    if (!modal) return;
    const { mode, id, name, code, symbol, description, active } = modal;
    if (!name.trim() || !code.trim() || !symbol.trim()) return;

    const payload = {
      name: name.trim(),
      code: code.trim(),
      symbol: symbol.trim(),
      description: description.trim(),
      active: Boolean(active),
    };

    if (mode === "edit") {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...payload } : row)));
    } else {
      setRows((prev) => [...prev, { id: nextId(prev), ...payload }]);
    }
    setModal(null);
  }

  function toggleActive(id) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, active: !row.active } : row))
    );
  }

  return (
    <div className="mt-5">
      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">Currency Types</h2>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Currency
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Set as Active</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-white/10 text-slate-300">
                  <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                  <td className="px-4 py-3">{row.code}</td>
                  <td className="px-4 py-3">{row.symbol}</td>
                  <td className="px-4 py-3">{row.description}</td>
                  <td className="px-4 py-3">
                    <ActiveCheckbox
                      checked={row.active}
                      onChange={() => toggleActive(row.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ActionButtons
                      onEdit={() => openEdit(row)}
                      onDelete={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    No currency types yet. Click Add Currency to create one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {modal ? (
        <ModalShell
          title={modal.mode === "edit" ? "Edit Currency" : "Add Currency"}
          onClose={() => setModal(null)}
          onSave={save}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Name</span>
            <input
              required
              value={modal.name}
              onChange={(e) => setModal((m) => ({ ...m, name: e.target.value }))}
              className={inputCls}
              placeholder="e.g. US Dollars"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Code</span>
            <input
              required
              value={modal.code}
              onChange={(e) => setModal((m) => ({ ...m, code: e.target.value }))}
              className={inputCls}
              placeholder="e.g. USD"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Symbol</span>
            <input
              required
              value={modal.symbol}
              onChange={(e) => setModal((m) => ({ ...m, symbol: e.target.value }))}
              className={inputCls}
              placeholder="e.g. $"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Description</span>
            <input
              value={modal.description}
              onChange={(e) => setModal((m) => ({ ...m, description: e.target.value }))}
              className={inputCls}
              placeholder="e.g. All USD wallet"
            />
          </label>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={modal.active}
              onChange={(e) => setModal((m) => ({ ...m, active: e.target.checked }))}
              className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action"
            />
            <span className="text-sm font-medium text-slate-300">Active</span>
          </label>
        </ModalShell>
      ) : null}
    </div>
  );
}
