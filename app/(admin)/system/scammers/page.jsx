"use client";

import { useMemo, useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";
import CopyCell, { FilterField, inputCls } from "@/components/admin/queue-ui";
import { SCAMMERS } from "@/lib/mock-data";
import { Plus, Search, Trash2, X } from "lucide-react";

export default function ScammersPage() {
  const [rows, setRows] = useState(SCAMMERS);
  const [platformId, setPlatformId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [applied, setApplied] = useState({ platformId: "", customerName: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    platformId: "",
    name: "",
    userId: "",
    notes: "",
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (applied.platformId && !String(r.platformId).toLowerCase().includes(applied.platformId.toLowerCase())) {
        return false;
      }
      if (applied.customerName && !String(r.name).toLowerCase().includes(applied.customerName.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rows, applied]);

  function runSearch() {
    setApplied({ platformId, customerName });
  }

  function addScammer() {
    if (!form.platformId.trim() || !form.name.trim()) return;
    const nextId = String(Math.max(...rows.map((r) => Number(r.id) || 0), 0) + 1);
    setRows((prev) => [
      {
        id: nextId,
        platformId: form.platformId.trim(),
        name: form.name.trim(),
        userId: form.userId.trim() || "N/A",
        notes: form.notes.trim() || "N/A",
        added: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...prev,
    ]);
    setForm({ platformId: "", name: "", userId: "", notes: "" });
    setAddOpen(false);
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
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Scammer Management</h1>
            <p className="mt-0.5 text-xs text-slate-400">
              {filtered.length} flagged records · block suspicious platform / customer IDs
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Scammer
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
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

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-[13px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Platform ID</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Added Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 text-slate-700 transition hover:bg-admin-teal/[0.05]">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.id}</td>
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
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#E11D48] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                    No Results Found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {addOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-admin-chrome/50 p-4 backdrop-blur-sm"
          onClick={() => setAddOpen(false)}
        >
          <div className="admin-card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Add Scammer</h3>
                <p className="mt-1 text-sm text-slate-500">Flag a platform ID or customer for fraud watch.</p>
              </div>
              <button type="button" onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
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
              <FilterField label="Customer Name *">
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
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addScammer}
                className="rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
