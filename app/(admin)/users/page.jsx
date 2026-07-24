"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import RejectModal from "@/components/admin/reject-modal";
import RejectReasonPanel from "@/components/admin/reject-reason-panel";
import CopyCell, { FilterField, inputCls } from "@/components/admin/queue-ui";
import { getKycDocuments, USERS } from "@/lib/mock-data";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileImage,
  FileText,
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

function isPartnerValue(value) {
  return String(value).toLowerCase() === "yes" || value === "Affiliate";
}

function KycBadge({ value, onClick, title }) {
  const v = String(value || "");
  let label = "Pending";
  let cls = "bg-amber-500/90 text-white";
  if (v === "Verified") {
    label = "Verified";
    cls = "bg-theme-green-action/90 text-white";
  } else if (v === "Rejected") {
    label = "Rejected";
    cls = "bg-[#E11D48] text-white";
  }

  const base =
    "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title || `View ${label.toLowerCase()} documents`}
        className={`${base} ${cls} hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/30`}
      >
        {label}
      </button>
    );
  }

  return <span className={`${base} ${cls}`}>{label}</span>;
}

function PartnerBadge({ value, onClick, disabled }) {
  const yes = isPartnerValue(value);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={yes ? "Change partner status to No" : "Change partner status to Yes"}
      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${
        yes
          ? "border-theme-green-action/40 bg-theme-green-action/10 text-theme-green-action"
          : "border-[#E11D48]/40 bg-[#E11D48]/10 text-[#FB7185]"
      }`}
    >
      {yes ? "Yes" : "No"}
    </button>
  );
}

function ConfirmModal({ open, title, message, confirmLabel = "Confirm", onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="admin-card w-full max-w-md rounded-t-2xl rounded-b-none p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex justify-center sm:hidden">
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 flex justify-end gap-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="admin-btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function KycDocsModal({ open, user, field, onClose, onApprove, onReject }) {
  const docs = open && user ? getKycDocuments(user, field) : [];
  const [activeId, setActiveId] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const active = docs.find((d) => d.id === activeId) || docs[0];
  const label = field === "nic" ? "NIC" : "Address";
  const status = user?.[field];
  // Pending: both · Rejected: approve only · Verified: reject only
  const canApprove = status === "Pending" || status === "Rejected";
  const canReject = status === "Pending" || status === "Verified";
  const canAct = canApprove || canReject;

  useEffect(() => {
    if (!open || !user) {
      setActiveId(null);
      setRejectOpen(false);
      return;
    }
    const first = getKycDocuments(user, field)[0];
    setActiveId(first?.id ?? null);
    setRejectOpen(false);
  }, [open, user, field]);

  if (!open || !user) return null;

  return (
    <div className="admin-modal-overlay z-[70]" onClick={onClose}>
      <div
        className="admin-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{label} documents</h3>
            <p className="mt-1 text-sm text-slate-400">
              {user.name} · {user.accountId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {docs.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-slate-400">
              <FileText className="mb-2 h-8 w-8 opacity-50" />
              No documents uploaded
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c0f1a]">
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="truncate text-sm font-medium text-white">{active?.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {active?.kind} · Uploaded {active?.uploadedAt}
                  </p>
                </div>
                <div className="flex min-h-[200px] items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent p-6">
                  <div className="flex w-full max-w-xs flex-col items-center rounded-lg border border-slate-300/30 bg-[#f8fafc] p-6 text-center text-slate-800 shadow-lg">
                    <FileImage className="mb-2 h-10 w-10 text-slate-400" />
                    <p className="text-sm font-bold text-slate-900">{active?.kind}</p>
                    <p className="mt-1 text-xs text-slate-500">{active?.name}</p>
                    <p className="mt-3 rounded bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                      Customer upload — read only
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Uploaded files ({docs.length})
                </p>
                <ul className="space-y-1.5">
                  {docs.map((doc) => {
                    const selected = doc.id === active?.id;
                    return (
                      <li key={doc.id}>
                        <button
                          type="button"
                          onClick={() => setActiveId(doc.id)}
                          className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                            selected ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <FileImage
                            className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-white" : "text-slate-500"}`}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[12px] font-medium">{doc.name}</span>
                            <span className="block text-[10px] text-slate-500">
                              {doc.kind} · {doc.size}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <KycBadge value={status} />
              <p className="text-xs text-slate-500">
                {status === "Verified"
                  ? "Already verified — you can still reject with a reason."
                  : status === "Rejected"
                    ? "Rejected — approve again if documents are valid."
                    : `Review uploaded ${label.toLowerCase()} documents, then approve or reject.`}
              </p>
            </div>
            {canAct ? (
              <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
                {canReject ? (
                  <button
                    type="button"
                    onClick={() => setRejectOpen((v) => !v)}
                    className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      rejectOpen
                        ? "border-rose-400/60 bg-rose-500/25 text-rose-200"
                        : "border-rose-400/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    }`}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                ) : null}
                {canApprove ? (
                  <button
                    type="button"
                    onClick={onApprove}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                ) : null}
              </div>
            ) : (
              <button type="button" onClick={onClose} className="admin-btn-secondary shrink-0">
                Close
              </button>
            )}
          </div>
          {rejectOpen && canReject ? (
            <RejectReasonPanel
              className="mt-3"
              onCancel={() => setRejectOpen(false)}
              onConfirm={(reason) => {
                setRejectOpen(false);
                onReject?.(reason);
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
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
  const [partnerConfirm, setPartnerConfirm] = useState(null);
  const [kycDocs, setKycDocs] = useState(null);

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
        } else if (field === "nic" && next.address !== "Verified") {
          next.status = "Only NIC Verified";
        } else if (field === "address" && next.nic !== "Verified") {
          next.status = "Only Address Verified";
        }
        return next;
      })
    );
  }

  function rejectKyc(id, field, reason) {
    setRows((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const next = {
          ...u,
          [field]: "Rejected",
          [`${field}RejectReason`]: reason,
        };
        if (next.nic === "Verified" && next.address !== "Verified") {
          next.status = "Only NIC Verified";
        } else if (next.address === "Verified" && next.nic !== "Verified") {
          next.status = "Only Address Verified";
        } else if (next.nic !== "Verified" && next.address !== "Verified") {
          next.status = "Pending";
        }
        return next;
      })
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "User Management", href: "/users?filter=pending" }, { label: title }]} />

      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                KYC queue · NIC / Address verification · ban requires reason
              </p>
            </div>
            <label className="block w-full sm:w-64">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Filter Pending Users
              </span>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
                className={inputCls}
              >
                {FILTERS.map((f) => (
                  <option key={f.value} value={f.value} className="bg-admin-surface">
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="border-b border-white/10 bg-white/5 px-5 py-4">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
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
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n} className="bg-admin-surface">
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

        <div className="overflow-x-auto overflow-y-visible">
          <table className="min-w-[1100px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={shown.length > 0 && selected.length === shown.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded border-white/20"
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
                <tr key={u.id} className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(u.id)}
                      onChange={() => toggleOne(u.id)}
                      className="rounded border-white/20"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <CopyCell value={u.accountId} sub={u.id} />
                  </td>
                  <td className="px-3 py-3 font-medium text-white">{u.name}</td>
                  <td className="px-3 py-3">
                    <CopyCell value={u.email} />
                  </td>
                  <td className="px-3 py-3">{u.mobile}</td>
                  <td className="px-3 py-3">
                    <PartnerBadge
                      value={u.partner}
                      disabled={u.banned}
                      onClick={() => {
                        if (u.banned) return;
                        const currentlyYes = isPartnerValue(u.partner);
                        setPartnerConfirm({
                          id: u.id,
                          name: u.name,
                          next: currentlyYes ? "No" : "Yes",
                        });
                      }}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <KycBadge
                      value={u.nic}
                      onClick={() => setKycDocs({ user: u, field: "nic" })}
                      title="View NIC documents"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <KycBadge
                      value={u.address}
                      onClick={() => setKycDocs({ user: u, field: "address" })}
                      title="View Address documents"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 p-1.5 text-slate-500 transition hover:border-admin-teal/40 hover:text-white"
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

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Showing {filtered.length === 0 ? 0 : start + 1} to {Math.min(start + perPage, filtered.length)} of{" "}
            {filtered.length} entries
          </p>
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
      </section>

      <ConfirmModal
        open={!!partnerConfirm}
        title="Confirm partner status"
        message={
          partnerConfirm
            ? `Set ${partnerConfirm.name} as partner: ${partnerConfirm.next}?`
            : ""
        }
        confirmLabel={`Set to ${partnerConfirm?.next || "Yes"}`}
        onClose={() => setPartnerConfirm(null)}
        onConfirm={() => {
          setRows((prev) =>
            prev.map((u) =>
              u.id === partnerConfirm.id ? { ...u, partner: partnerConfirm.next } : u
            )
          );
          setPartnerConfirm(null);
        }}
      />

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

      <KycDocsModal
        open={!!kycDocs}
        user={kycDocs?.user ? rows.find((u) => u.id === kycDocs.user.id) || kycDocs.user : null}
        field={kycDocs?.field}
        onClose={() => setKycDocs(null)}
        onApprove={() => {
          approveKyc(kycDocs.user.id, kycDocs.field);
          setKycDocs(null);
        }}
        onReject={(reason) => {
          rejectKyc(kycDocs.user.id, kycDocs.field, reason);
          setKycDocs(null);
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
