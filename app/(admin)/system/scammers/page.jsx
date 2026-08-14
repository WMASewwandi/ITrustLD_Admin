"use client";

import { useCallback, useEffect, useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";
import DepositStatusConfirmModal from "@/components/admin/deposit-status-confirm-modal";
import CopyCell, { FilterField, FormError, inputCls } from "@/components/admin/queue-ui";
import { useCan } from "@/contexts/admin-permissions";
import {
  addScammer,
  deleteScammer,
  fetchScammers,
  searchScammerUser,
} from "@/lib/scammers";
import { Loader2, Plus, Search, Trash2, X } from "lucide-react";

export default function ScammersPage() {
  const canMutate = useCan(["change_scammer_status", "change_customer_account_status"]);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [platformId, setPlatformId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [applied, setApplied] = useState({ platformId: "", customerName: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [searchPlatformId, setSearchPlatformId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [form, setForm] = useState({
    platformId: "",
    name: "",
    userId: "",
    notes: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadScammers = useCallback(
    async (page = 1) => {
      setLoading(true);
      setPageError("");
      try {
        const data = await fetchScammers({
          platformId: applied.platformId,
          customerName: applied.customerName,
          page,
        });
        setRows(data.scammers || []);
        setPagination(data.pagination || { page: 1, total_pages: 1, total: 0 });
      } catch (err) {
        setPageError(err.message || "Failed to load scammers.");
      } finally {
        setLoading(false);
      }
    },
    [applied],
  );

  useEffect(() => {
    loadScammers(1);
  }, [loadScammers]);

  function runSearch() {
    setApplied({ platformId, customerName });
  }

  async function handleSearchUser() {
    const value = searchPlatformId.trim();
    if (!value) return;
    setBusy(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const data = await searchScammerUser(value);
      if (!data.success) {
        setSearchError(data.message || "No user found.");
        return;
      }
      setSearchResult(data.user);
      setForm((prev) => ({
        ...prev,
        platformId: data.user.platform_id || value,
        name: data.user.full_name || prev.name,
        userId: data.user.user_id != null ? String(data.user.user_id) : prev.userId,
      }));
    } catch (err) {
      setSearchError(err.message || "Search failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddScammer() {
    if (!form.platformId.trim()) return;
    setBusy(true);
    setActionMessage("");
    setPageError("");
    try {
      await addScammer({
        platform_id: form.platformId.trim(),
        customer_name: form.name.trim() || null,
        user_id: form.userId.trim() || null,
        notes: form.notes.trim() || null,
      });
      setAddOpen(false);
      setForm({ platformId: "", name: "", userId: "", notes: "" });
      setSearchPlatformId("");
      setSearchResult(null);
      setSearchError("");
      setActionMessage("Scammer added successfully.");
      await loadScammers(1);
    } catch (err) {
      setPageError(err.message || "Failed to add scammer.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteScammer() {
    if (!deleteConfirm) return;
    setBusy(true);
    setActionMessage("");
    setPageError("");
    try {
      await deleteScammer(deleteConfirm.id);
      setDeleteConfirm(null);
      setActionMessage("Scammer removed successfully.");
      await loadScammers(pagination.page);
    } catch (err) {
      setPageError(err.message || "Failed to delete scammer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "System & Scammer", href: "/system/scammers" },
          { label: "Scammer Management" },
        ]}
      />

      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Scammer Management</h1>
            <p className="mt-0.5 text-xs text-slate-400">
              {pagination.total || rows.length} flagged records · block suspicious platform IDs
            </p>
          </div>
          {canMutate ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Add Scammer
            </button>
          ) : null}
        </div>

        <div className="border-b border-white/10 bg-white/5 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterField label="Platform ID" className="lg:col-span-2">
              <input
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
                placeholder="Platform ID"
                className={inputCls}
              />
            </FilterField>
            <FilterField label="Customer Name" className="lg:col-span-2">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className={inputCls}
              />
            </FilterField>
            <div className="flex items-end">
              <button
                type="button"
                onClick={runSearch}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white"
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
            </div>
          </div>
        </div>

        {pageError && !addOpen && !deleteConfirm ? (
          <div className="border-b border-white/10 px-5 py-3 text-sm text-rose-300">{pageError}</div>
        ) : null}
        {actionMessage ? (
          <div className="border-b border-white/10 px-5 py-3 text-sm text-admin-teal">{actionMessage}</div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Platform ID</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Added Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]"
                  >
                    <td className="px-4 py-3">
                      <CopyCell value={r.platformId} />
                    </td>
                    <td className="px-4 py-3">
                      <CopyCell value={r.name} />
                    </td>
                    <td className="px-4 py-3">
                      <CopyCell value={r.userId} />
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <CopyCell value={r.notes} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.added}</td>
                    <td className="px-4 py-3 text-right">
                      {canMutate ? (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ id: r.id, platformId: r.platformId })}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#E11D48] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                    No Results Found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {pagination.total_pages > 1 ? (
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
            <p className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => loadScammers(pagination.page - 1)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.total_pages || loading}
                onClick={() => loadScammers(pagination.page + 1)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {addOpen ? (
        <div className="admin-modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="admin-card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Add New Scammer</h3>
                <p className="mt-1 text-sm text-slate-500">Search by platform ID or enter details manually.</p>
              </div>
              <button type="button" onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-sm font-medium text-white">Search User to Add (Optional)</p>
              <div className="flex gap-2">
                <input
                  value={searchPlatformId}
                  onChange={(e) => setSearchPlatformId(e.target.value)}
                  className={inputCls}
                  placeholder="Enter User Platform ID"
                />
                <button
                  type="button"
                  onClick={handleSearchUser}
                  disabled={busy}
                  className="shrink-0 rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Search
                </button>
              </div>
              {searchError ? <p className="mt-2 text-xs text-rose-300">{searchError}</p> : null}
              {searchResult ? (
                <div className="mt-3 rounded-lg border border-admin-teal/20 bg-admin-teal/10 p-3 text-xs text-slate-300">
                  <p>
                    Found via <span className="text-white">{searchResult.found_via}</span>
                  </p>
                  <p className="mt-1 text-white">{searchResult.full_name || "—"}</p>
                  <p className="text-slate-400">
                    Account {searchResult.account_number} · User ID {searchResult.user_id}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <FilterField label="Platform ID *">
                <input
                  value={form.platformId}
                  onChange={(e) => setForm((f) => ({ ...f, platformId: e.target.value }))}
                  className={inputCls}
                  placeholder="Platform ID"
                />
              </FilterField>
              <FilterField label="Customer Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                  placeholder="Customer Name"
                />
              </FilterField>
              <FilterField label="User ID">
                <input
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className={inputCls}
                  placeholder="Optional"
                />
              </FilterField>
              <FilterField label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className={inputCls}
                  placeholder="Reason / notes"
                />
              </FilterField>
            </div>
            <FormError message={pageError} className="mt-4" />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddScammer}
                disabled={busy || !form.platformId.trim()}
                className="rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Saving…" : "Add Scammer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <DepositStatusConfirmModal
        open={Boolean(deleteConfirm)}
        title="Remove scammer flag?"
        message={
          deleteConfirm
            ? `This will remove the scammer flag for platform ID ${deleteConfirm.platformId}. Deposit rows will no longer be highlighted for this ID.`
            : ""
        }
        confirmLabel="Delete"
        confirmClassName="bg-[#E11D48]"
        busy={busy}
        error={pageError}
        onCancel={() => {
          setDeleteConfirm(null);
          setPageError("");
        }}
        onConfirm={confirmDeleteScammer}
      />
    </div>
  );
}
