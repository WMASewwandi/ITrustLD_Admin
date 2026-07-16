"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import RejectModal from "@/components/admin/reject-modal";
import CopyCell, { FilterField, inputCls } from "@/components/admin/queue-ui";
import { USERS } from "@/lib/mock-data";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  X,
} from "lucide-react";

const FILTERS = [
  { value: "all", label: "All Users" },
  { value: "pending", label: "All Pending Users" },
  { value: "address-pending", label: "Address Pending" },
  { value: "self-verified", label: "Self-verification Done" },
  { value: "not-confirmed", label: "Not Confirmed" },
  { value: "only-address", label: "Only Address Verified" },
  { value: "only-nic", label: "Only NIC Verified" },
  { value: "banned", label: "Banned Customers" },
];

function KycBadge({ value }) {
  const v = String(value || "");
  if (v === "Verified") {
    return (
      <span className="inline-flex rounded-full bg-theme-green-action/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
        Verified
      </span>
    );
  }
  if (v === "Rejected") {
    return (
      <span className="inline-flex rounded-full bg-[#E11D48] px-2.5 py-0.5 text-[11px] font-semibold text-white">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
      Pending
    </span>
  );
}

function PartnerBadge({ value }) {
  const yes = String(value).toLowerCase() === "yes" || value === "Affiliate";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
        yes
          ? "border-theme-green-action/40 bg-theme-green-action/10 text-theme-green-action"
          : "border-[#E11D48]/40 bg-[#E11D48]/10 text-[#FB7185]"
      }`}
    >
      {yes ? "Yes" : "No"}
    </span>
  );
}

function UsersContent() {
  const params = useSearchParams();
  const [filter, setFilter] = useState(params.get("filter") || "pending");
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [accountId, setAccountId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [applied, setApplied] = useState({ email: "", accountId: "", firstName: "", lastName: "" });
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [rows, setRows] = useState(USERS);
  const [banOpen, setBanOpen] = useState(null);

  useEffect(() => {
    setFilter(params.get("filter") || "pending");
    setPage(1);
  }, [params]);

  const title = FILTERS.find((f) => f.value === filter)?.label || "Users";

  const filtered = useMemo(() => {
    return rows
      .filter((u) => {
        if (filter === "pending") {
          return (
            !u.banned &&
            (u.status === "Pending" ||
              u.status === "Address Pending" ||
              u.status === "Not Confirmed" ||
              u.nic === "Pending" ||
              u.address === "Pending")
          );
        }
        if (filter === "address-pending") return u.status === "Address Pending" || (u.address === "Pending" && u.nic === "Verified");
        if (filter === "self-verified") return u.status === "Self Verified";
        if (filter === "not-confirmed") return u.status === "Not Confirmed";
        if (filter === "only-address") return u.status === "Only Address Verified";
        if (filter === "only-nic") return u.status === "Only NIC Verified";
        if (filter === "banned") return u.banned;
        return true;
      })
      .filter((u) => {
        if (applied.email && !u.email.toLowerCase().includes(applied.email.toLowerCase())) return false;
        if (applied.accountId && !String(u.accountId).includes(applied.accountId)) return false;
        if (applied.firstName && !(u.firstName || u.name).toLowerCase().includes(applied.firstName.toLowerCase())) return false;
        if (applied.lastName && !(u.lastName || "").toLowerCase().includes(applied.lastName.toLowerCase())) return false;
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return [u.id, u.accountId, u.name, u.firstName, u.lastName, u.email, u.mobile].join(" ").toLowerCase().includes(s);
      });
  }, [rows, filter, q, applied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const shown = filtered.slice(start, start + perPage);

  function runSearch() {
    setApplied({ email, accountId, firstName, lastName });
    setPage(1);
  }

  function toggleAll(checked) {
    setSelected(checked ? shown.map((u) => u.id) : []);
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function approveKyc(id, field) {
    setRows((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const next = { ...u, [field]: "Verified" };
        if (next.nic === "Verified" && next.address === "Verified") {
          next.status = "Self Verified";
        }
        return next;
      })
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "User Management", href: "/users?filter=pending" }, { label: title }]} />

      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                KYC queue · NIC / Address verification · ban requires reason
              </p>
            </div>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className={`${inputCls} w-full sm:w-56`}
            >
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value} className="bg-white">
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Field filters like screenshot */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterField label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={inputCls}
              />
            </FilterField>
            <FilterField label="Account Id">
              <input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Account Id"
                className={inputCls}
              />
            </FilterField>
            <FilterField label="First Name">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className={inputCls}
              />
            </FilterField>
            <FilterField label="Last Name">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className={inputCls}
              />
            </FilterField>
            <div className="flex items-end">
              <button
                type="button"
                onClick={runSearch}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110"
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Table controls */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-xs text-slate-500">
            Show
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n} className="bg-white">
                  {n}
                </option>
              ))}
            </select>
            entries
          </label>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search…"
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-[13px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={shown.length > 0 && selected.length === shown.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-3 py-3">Account ID</th>
                <th className="px-3 py-3">Full Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Mobile No.</th>
                <th className="px-3 py-3">Is Partner</th>
                <th className="px-3 py-3">NIC</th>
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 text-slate-700 transition hover:bg-admin-teal/[0.05]">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(u.id)}
                      onChange={() => toggleOne(u.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <CopyCell value={u.accountId} sub={u.id} />
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-3 py-3">
                    <CopyCell value={u.email} />
                  </td>
                  <td className="px-3 py-3">{u.mobile}</td>
                  <td className="px-3 py-3">
                    <PartnerBadge value={u.partner} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <KycBadge value={u.nic} />
                      {u.nic === "Pending" && !u.banned ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => approveKyc(u.id, "nic")}
                            className="rounded bg-theme-green-action/20 p-0.5 text-theme-green-action"
                            title="Approve NIC"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="rounded bg-[#E11D48]/20 p-0.5 text-[#FB7185]"
                            title="Reject NIC"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <KycBadge value={u.address} />
                      {u.address === "Pending" && !u.banned ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => approveKyc(u.id, "address")}
                            className="rounded bg-theme-green-action/20 p-0.5 text-theme-green-action"
                            title="Approve Address"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="rounded bg-[#E11D48]/20 p-0.5 text-[#FB7185]"
                            title="Reject Address"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-admin-teal/40 hover:text-slate-900"
                        title="View profile"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {!u.banned ? (
                        <button
                          type="button"
                          onClick={() => setBanOpen(u.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-2 py-1 text-xs text-rose-300 transition hover:bg-rose-500/10"
                          title="Ban user — requires reason"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Ban
                        </button>
                      ) : (
                        <span className="text-[11px] text-rose-300" title={u.banReason}>
                          Banned
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-slate-400">
                    No Results Found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Showing {filtered.length === 0 ? 0 : start + 1} to {Math.min(start + perPage, filtered.length)} of{" "}
            {filtered.length} entries
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-35"
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
                    page === n ? "bg-admin-teal text-white" : "border border-slate-200 text-slate-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-35"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      <RejectModal
        open={!!banOpen}
        title="Ban customer"
        onClose={() => setBanOpen(null)}
        onConfirm={(reason) => {
          setRows((prev) =>
            prev.map((u) =>
              u.id === banOpen ? { ...u, banned: true, status: "Banned", banReason: reason } : u
            )
          );
          setBanOpen(null);
        }}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">Loading users…</div>}>
      <UsersContent />
    </Suspense>
  );
}
