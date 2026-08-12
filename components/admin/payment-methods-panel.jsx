"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import { useAppDialog } from "@/components/admin/app-dialog";
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethodMeta,
  fetchPaymentMethods,
  mapPaymentMethodToRow,
  setPaymentMethodPriority,
  togglePaymentMethodStatus,
  updatePaymentMethod,
} from "@/lib/payment-methods";

const emptyForm = {
  name: "",
  currency: "",
  minLimit: "",
  maxLimit: "",
};

function formatLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ActiveCheckbox({ checked, onChange, disabled, title }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      title={title}
      className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action disabled:cursor-not-allowed disabled:opacity-60"
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

export default function PaymentMethodsPanel() {
  const { alert, confirm } = useAppDialog();
  const [rows, setRows] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const reloadPaymentMethods = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await fetchPaymentMethods();
      setRows((data?.paymentMethods || []).map(mapPaymentMethodToRow));
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const reloadMeta = useCallback(async () => {
    try {
      const data = await fetchPaymentMethodMeta();
      const options = Array.isArray(data?.currencyTypes) ? data.currencyTypes : [];
      setCurrencyOptions(options);
      return options;
    } catch (error) {
      console.error(error);
      setCurrencyOptions([]);
      return [];
    }
  }, []);

  useEffect(() => {
    reloadMeta();
    reloadPaymentMethods();
  }, [reloadMeta, reloadPaymentMethods]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const search = q.toLowerCase();
    return rows.filter((row) =>
      [row.id, row.name, row.currency, row.minLimit, row.maxLimit, row.active ? "active" : "inactive", row.priority ? "priority" : ""]
        .filter((value) => value !== "" && value != null)
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function openAdd() {
    const options = currencyOptions.length > 0 ? currencyOptions : await reloadMeta();
    setModal({
      mode: "add",
      ...emptyForm,
      currency: options[0]?.code || "USD",
    });
  }

  function openEdit(row) {
    setModal({
      mode: "edit",
      id: row.id,
      name: row.name,
      currency: row.currency || currencyOptions[0]?.code || "USD",
      minLimit: row.minLimit === 0 || row.minLimit ? String(row.minLimit) : "",
      maxLimit: row.maxLimit === 0 || row.maxLimit ? String(row.maxLimit) : "",
    });
  }

  async function save() {
    if (!modal || saving) return;
    const { mode, id, name, currency, minLimit, maxLimit } = modal;
    if (!name.trim() || !currency) return;

    const payload = {
      name: name.trim(),
      currency,
      minLimit: Number(minLimit),
      maxLimit: Number(maxLimit),
    };

    setSaving(true);
    try {
      if (mode === "edit") {
        const data = await updatePaymentMethod(id, payload);
        const paymentMethod = data?.paymentMethod;
        if (paymentMethod) {
          setRows((prev) =>
            prev.map((row) => (row.id === id ? mapPaymentMethodToRow(paymentMethod) : row)),
          );
        } else {
          await reloadPaymentMethods(true);
        }
      } else {
        const data = await createPaymentMethod(payload);
        const paymentMethod = data?.paymentMethod;
        if (paymentMethod) {
          setRows((prev) => [...prev, mapPaymentMethodToRow(paymentMethod)]);
        } else {
          await reloadPaymentMethods(true);
        }
      }
      setModal(null);
    } catch (error) {
      await alert(error?.message || "Could not save payment method.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    const toggleKey = `active-${row.id}`;
    if (togglingId === toggleKey) return;

    const nextActive = !row.active;
    setRows((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, active: nextActive } : item)),
    );
    setTogglingId(toggleKey);

    try {
      const data = await togglePaymentMethodStatus(row.id, nextActive);
      if (data?.paymentMethod) {
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id ? mapPaymentMethodToRow(data.paymentMethod) : item,
          ),
        );
      }
    } catch (error) {
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, active: row.active } : item)),
      );
      await alert(error?.message || "Could not update payment method status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSetPriority(row) {
    const toggleKey = `priority-${row.id}`;
    if (togglingId === toggleKey) return;

    setTogglingId(toggleKey);
    try {
      const data = await setPaymentMethodPriority(row.id);
      if (Array.isArray(data?.paymentMethods)) {
        setRows(data.paymentMethods.map(mapPaymentMethodToRow));
      } else {
        await reloadPaymentMethods(true);
      }
    } catch (error) {
      await alert(error?.message || "Could not update payment method priority.");
    } finally {
      setTogglingId(null);
    }
  }

  async function remove(id) {
    if (!(await confirm("Delete this payment method?", { title: "Delete payment method", confirmLabel: "Delete" }))) return;

    try {
      await deletePaymentMethod(id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      await alert(error?.message || "Could not delete payment method.");
    }
  }

  const busy = loading || saving;

  if (loading && rows.length === 0) {
    return (
      <div className="mt-5 flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading payment methods…
      </div>
    );
  }

  return (
    <div className="mt-5">
      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-2 text-xl font-bold text-white sm:text-2xl">Payment Method</h2>
            <button
              type="button"
              onClick={() => reloadPaymentMethods(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
              <CreditCard className="h-3 w-3 text-admin-teal" />
              {rows.length} methods
            </span>
          </div>
          <button
            type="button"
            onClick={openAdd}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Method
          </button>
        </div>

        <div className="border-b border-white/10 bg-white/5 px-5 py-4">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Search
              </span>
              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-admin-surface">
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, currency, limits…"
                  className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center bg-admin-teal px-4 text-white transition hover:brightness-110"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {refreshing ? (
            <div className="flex items-center justify-center gap-2 px-4 py-14 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing…
            </div>
          ) : (
            <table className="min-w-[880px] w-full text-left text-[13px]">
              <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-3">Payment Method</th>
                  <th className="px-3 py-3">Currency</th>
                  <th className="px-3 py-3">Minimum Limit</th>
                  <th className="px-3 py-3">Maximum Limit</th>
                  <th className="px-3 py-3">Activate</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]"
                  >
                    <td className="px-3 py-3 font-medium text-white">{row.name}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-slate-200">
                        {row.currency}
                      </span>
                    </td>
                    <td className="px-3 py-3">{formatLimit(row.minLimit)}</td>
                    <td className="px-3 py-3">{formatLimit(row.maxLimit)}</td>
                    <td className="px-3 py-3">
                      <ActiveCheckbox
                        checked={row.active}
                        disabled={togglingId === `active-${row.id}` || saving}
                        title={row.active ? "Active" : "Activate method"}
                        onChange={() => toggleActive(row)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <ActiveCheckbox
                        checked={row.priority}
                        disabled={togglingId === `priority-${row.id}` || saving}
                        title={row.priority ? "Priority method" : "Set as priority"}
                        onChange={() => handleSetPriority(row)}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ActionButtons
                        disabled={busy || togglingId != null}
                        onEdit={() => openEdit(row)}
                        onDelete={() => remove(row.id)}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                      {rows.length === 0
                        ? "No payment methods yet. Click Add Method to create one."
                        : "No Results Found"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>

        {!refreshing ? (
          <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-slate-400">
                Showing {filtered.length === 0 ? 0 : start + 1} to{" "}
                {Math.min(start + perPage, filtered.length)} of {filtered.length} entries
              </p>
              <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                Show
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-xs text-white"
                >
                  {[5, 10, 25, 50].map((n) => (
                    <option key={n} value={n} className="bg-admin-surface">
                      {n}
                    </option>
                  ))}
                </select>
                entries
              </label>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-35"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(0, 5)
                .map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      page === n ? "bg-admin-teal text-white" : "border border-white/10 text-slate-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-35"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </section>

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
                  {currencyOptions.length > 0 ? (
                    currencyOptions.map((c) => (
                      <option key={c.id ?? c.code} value={c.code}>
                        {c.code} - {c.symbol}
                      </option>
                    ))
                  ) : (
                    <option value={modal.currency || "USD"}>{modal.currency || "USD"}</option>
                  )}
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
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="admin-btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? "Saving…" : modal.mode === "edit" ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
