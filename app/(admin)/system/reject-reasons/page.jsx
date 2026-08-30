"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import AdminPagination from "@/components/admin/admin-pagination";
import { FormError, inputCls } from "@/components/admin/queue-ui";
import { useAppDialog } from "@/components/admin/app-dialog";
import { useCan } from "@/contexts/admin-permissions";
import { formatDateSl } from "@/lib/sl-time";
import {
  createRejectReason,
  deleteRejectReason,
  fetchRejectReasons,
  moveRejectReason,
  REJECT_REASON_CATEGORIES,
  updateRejectReason,
} from "@/lib/reject-reasons";

export default function RejectReasonsPage() {
  const canManage = useCan("manage_reject_reasons");
  const { alert, confirm } = useAppDialog();
  const [category, setCategory] = useState(REJECT_REASON_CATEGORIES[0].id);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modal, setModal] = useState(null);
  const [formError, setFormError] = useState("");

  const activeCategory = REJECT_REASON_CATEGORIES.find((item) => item.id === category) || REJECT_REASON_CATEGORIES[0];

  const loadReasons = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setPageError("");
      try {
        const data = await fetchRejectReasons(category);
        setRows(data?.reasons || []);
      } catch (err) {
        setRows([]);
        setPageError(err.message || "Failed to load reject reasons.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category],
  );

  useEffect(() => {
    loadReasons();
  }, [loadReasons]);

  useEffect(() => {
    setPage(1);
    setQ("");
  }, [category]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const search = q.toLowerCase();
    return rows.filter((row) => String(row.message || "").toLowerCase().includes(search));
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage) || 1);
  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openAdd() {
    setFormError("");
    setModal({ mode: "add", message: "" });
  }

  function openEdit(row) {
    setFormError("");
    setModal({ mode: "edit", id: row.id, message: row.message || "" });
  }

  async function saveReason() {
    if (!modal || busy) return;
    const message = String(modal.message || "").trim();
    if (!message) {
      setFormError("Reason is required.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      if (modal.mode === "edit") {
        await updateRejectReason(modal.id, { message });
      } else {
        await createRejectReason({ category, message });
      }
      setModal(null);
      await loadReasons(true);
    } catch (err) {
      setFormError(err.message || "Failed to save reason.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row) {
    if (!canManage) return;
    const ok = await confirm(`Delete this ${activeCategory.label.toLowerCase()} reason?`, {
      title: "Delete reject reason",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    setBusy(true);
    setPageError("");
    try {
      await deleteRejectReason(row.id);
      await loadReasons(true);
    } catch (err) {
      await alert(err.message || "Failed to delete reason.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(row, direction) {
    if (!canManage || busy) return;
    setBusy(true);
    setPageError("");
    try {
      await moveRejectReason(row.id, direction);
      await loadReasons(true);
    } catch (err) {
      setPageError(err.message || "Failed to reorder reason.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Master", href: "/system/reject-reasons" },
          { label: "Reject Reasons" },
        ]}
      />

      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Reject Reasons</h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Add customer-facing reasons for each reject screen. Lists start empty until you add them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadReasons(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {canManage ? (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                Add Reason
              </button>
            ) : null}
          </div>
        </div>

        <div className="border-b border-white/10 bg-white/5 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {REJECT_REASON_CATEGORIES.map((item) => {
              const active = item.id === category;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-admin-teal text-white"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">{activeCategory.description}</p>
          <div className="mt-4 max-w-xl">
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
                placeholder={`Search ${activeCategory.label.toLowerCase()} reasons…`}
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <span className="inline-flex items-center justify-center bg-admin-teal px-4 text-white">
                <Search className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>

        {pageError ? (
          <div className="border-b border-white/10 px-5 py-3 text-sm text-rose-300">{pageError}</div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 w-16">#</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 w-48">Updated</th>
                {canManage ? <th className="px-4 py-3 text-right">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="px-4 py-14 text-center text-slate-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="px-4 py-14 text-center text-slate-400">
                    No reasons yet for {activeCategory.label}. Add one to show it on that reject screen.
                  </td>
                </tr>
              ) : (
                paginated.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]"
                  >
                    <td className="px-4 py-3 text-slate-500">{start + index + 1}</td>
                    <td className="px-4 py-3 text-white">{row.message}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateSl(row.updatedAt || row.createdAt)}</td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMove(row, "up")}
                            disabled={busy || rows[0]?.id === row.id}
                            className="rounded-lg bg-white/10 p-1.5 text-white transition hover:bg-white/20 disabled:opacity-40"
                            title="Move up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(row, "down")}
                            disabled={busy || rows[rows.length - 1]?.id === row.id}
                            className="rounded-lg bg-white/10 p-1.5 text-white transition hover:bg-white/20 disabled:opacity-40"
                            title="Move down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            disabled={busy}
                            className="rounded-lg bg-theme-green-action/90 p-1.5 text-white transition hover:brightness-110 disabled:opacity-60"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            disabled={busy}
                            className="rounded-lg bg-[#E11D48] p-1.5 text-white transition hover:brightness-110 disabled:opacity-60"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-nowrap items-center justify-between gap-3 overflow-x-auto border-t border-white/10 px-5 py-4">
          <p className="shrink-0 text-xs text-slate-500">
            Page {page} of {totalPages} · {filtered.length} total
          </p>
          <div className="flex flex-nowrap items-center gap-3">
            <select
              value={String(perPage)}
              onChange={(e) => {
                setPerPage(Number(e.target.value) || 10);
                setPage(1);
              }}
              className="w-auto shrink-0 rounded-lg border border-white/10 bg-admin-chrome-deep px-2 py-1.5 text-xs text-slate-100 outline-none"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
            <AdminPagination
              page={page}
              totalPages={totalPages}
              disabled={loading}
              onPageChange={setPage}
              className="flex-nowrap shrink-0"
            />
          </div>
        </div>
      </section>

      {modal ? (
        <div className="admin-modal-overlay z-[85]" onClick={() => !busy && setModal(null)}>
          <div className="admin-card w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {modal.mode === "edit" ? "Edit reason" : "Add reason"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {activeCategory.label} · shown to the customer on reject.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Reason</label>
            <textarea
              value={modal.message}
              onChange={(e) => setModal((prev) => ({ ...prev, message: e.target.value }))}
              rows={4}
              maxLength={500}
              placeholder="Enter the rejection reason…"
              className={inputCls}
            />
            <FormError message={formError} className="mt-3" />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="admin-btn-secondary" disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                onClick={saveReason}
                disabled={busy || !String(modal.message || "").trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {modal.mode === "edit" ? "Save" : "Add Reason"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
