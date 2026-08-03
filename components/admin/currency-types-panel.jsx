"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import {
  createCurrencyType,
  deleteCurrencyType,
  fetchCurrencyTypes,
  mapCurrencyTypeToRow,
  toggleCurrencyTypeStatus,
  updateCurrencyType,
} from "@/lib/currency-types";

const emptyForm = {
  name: "",
  code: "",
  symbol: "",
  description: "",
};

function ActiveCheckbox({ checked, onChange, disabled }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action disabled:cursor-not-allowed disabled:opacity-60"
      title={checked ? "Active" : "Set as active"}
    />
  );
}

function ActionButtons({ onEdit, onDelete, disabled }) {
  return (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="rounded-lg bg-theme-green-action/90 p-1.5 text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ModalShell({ title, onClose, children, onSave, saving }) {
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
            <button type="button" onClick={onClose} className="admin-btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CurrencyTypesPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [modal, setModal] = useState(null);

  const reloadCurrencyTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCurrencyTypes();
      setRows((data?.currencyTypes || []).map(mapCurrencyTypeToRow));
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadCurrencyTypes();
  }, [reloadCurrencyTypes]);

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
    });
  }

  async function save() {
    if (!modal || saving) return;
    const { mode, id, name, code, symbol, description } = modal;
    if (!name.trim() || !code.trim() || !symbol.trim() || !description.trim()) return;

    const payload = {
      name: name.trim(),
      code: code.trim(),
      symbol: symbol.trim(),
      description: description.trim(),
    };

    setSaving(true);
    try {
      if (mode === "edit") {
        const data = await updateCurrencyType(id, payload);
        const currencyType = data?.currencyType;
        if (currencyType) {
          setRows((prev) =>
            prev.map((row) => (row.id === id ? mapCurrencyTypeToRow(currencyType) : row)),
          );
        } else {
          await reloadCurrencyTypes();
        }
      } else {
        const data = await createCurrencyType(payload);
        const currencyType = data?.currencyType;
        if (currencyType) {
          setRows((prev) => [...prev, mapCurrencyTypeToRow(currencyType)]);
        } else {
          await reloadCurrencyTypes();
        }
      }
      setModal(null);
    } catch (error) {
      window.alert(error?.message || "Could not save currency type.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    if (togglingId === row.id) return;

    const nextActive = !row.active;
    setRows((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, active: nextActive } : item)),
    );
    setTogglingId(row.id);

    try {
      const data = await toggleCurrencyTypeStatus(row.id, nextActive);
      if (data?.currencyType) {
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id ? mapCurrencyTypeToRow(data.currencyType) : item,
          ),
        );
      }
    } catch (error) {
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, active: row.active } : item)),
      );
      window.alert(error?.message || "Could not update currency type status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this currency type?")) return;

    try {
      await deleteCurrencyType(id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      window.alert(error?.message || "Could not delete currency type.");
    }
  }

  const busy = loading || saving;

  return (
    <div className="mt-5">
      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">Currency Types</h2>
          <button
            type="button"
            onClick={openAdd}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
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
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading currency types…
                    </span>
                  </td>
                </tr>
              ) : null}
              {!loading
                ? rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]"
                    >
                      <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                      <td className="px-4 py-3">{row.code}</td>
                      <td className="px-4 py-3">{row.symbol}</td>
                      <td className="px-4 py-3">{row.description}</td>
                      <td className="px-4 py-3">
                        <ActiveCheckbox
                          checked={row.active}
                          disabled={togglingId === row.id || saving}
                          onChange={() => toggleActive(row)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionButtons
                          disabled={busy || togglingId === row.id}
                          onEdit={() => openEdit(row)}
                          onDelete={() => remove(row.id)}
                        />
                      </td>
                    </tr>
                  ))
                : null}
              {!loading && rows.length === 0 ? (
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
          saving={saving}
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
              required
              value={modal.description}
              onChange={(e) => setModal((m) => ({ ...m, description: e.target.value }))}
              className={inputCls}
              placeholder="e.g. All USD wallet"
            />
          </label>
        </ModalShell>
      ) : null}
    </div>
  );
}
