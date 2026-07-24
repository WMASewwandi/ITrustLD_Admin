"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import RejectReasonPanel from "@/components/admin/reject-reason-panel";
import CopyCell, { FilterField, StatusPill, inputCls } from "@/components/admin/queue-ui";
import { DEPOSITS, WITHDRAWALS } from "@/lib/mock-data";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock3,
  Eye,
  FileImage,
  FileText,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";

const ASSIGNEES = ["sacl", "withdraw.ex", "deposit.ex", "Authorizer", "admin"];
/** Demo session admin — used for queue lock ownership */
const CURRENT_ADMIN = "sacl";
const PREVIEW_LIMIT = 10;

/** Build the proofs the customer already submitted for a transaction (demo). */
function getSubmittedProofs(record) {
  if (!record?.proof) return [];
  const amount = record.clientPay || record.cashoutAmt || record.amount;
  const base = {
    uploadedAt: record.date,
    method: record.method,
    amount,
    account: record.account,
    customer: record.customer,
  };
  const proofs = [
    {
      id: `${record.id}-slip`,
      name: `payment_slip_${String(record.id).slice(-6)}.jpg`,
      kind: "Bank / wallet slip",
      size: "248 KB",
      ...base,
    },
  ];
  if (String(record.method || "").toLowerCase().includes("bank") || record.clientPayLkr >= 10000) {
    proofs.push({
      id: `${record.id}-receipt`,
      name: `transfer_receipt_${String(record.id).slice(-6)}.png`,
      kind: "Transfer receipt",
      size: "186 KB",
      ...base,
    });
  }
  return proofs;
}

function ProofSummaryFields({ proof }) {
  return (
    <dl className="grid gap-2 text-sm">
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <dt className="text-slate-400">Platform</dt>
        <dd className="font-medium text-white">{proof.platform || "—"}</dd>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <dt className="text-slate-400">Method</dt>
        <dd className="font-medium text-white">{proof.method || "—"}</dd>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <dt className="text-slate-400">Client Pay</dt>
        <dd className="font-medium text-white">{proof.clientPay || "—"}</dd>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <dt className="text-slate-400">Cashout</dt>
        <dd className="font-medium text-white">{proof.cashoutAmt || "—"}</dd>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <dt className="text-slate-400">Receiving Amount</dt>
        <dd className="font-medium text-white">{proof.receiving || proof.deposited || proof.amount || "—"}</dd>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <dt className="mb-0.5 text-slate-400">Account</dt>
        <dd>
          <CopyCell value={proof.account} />
        </dd>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <dt className="mb-0.5 text-slate-400">Platform ID</dt>
        <dd>
          <CopyCell value={proof.platformId} />
        </dd>
      </div>
    </dl>
  );
}

function ProofImageCard({ proof, file }) {
  const amount = file?.amount || proof.clientPay || proof.cashoutAmt || proof.amount;
  const method = file?.method || proof.method;
  const account = file?.account || proof.account;
  const uploadedAt = file?.uploadedAt || proof.date;
  const name = file?.name || `payment_slip_${String(proof.id).slice(-6)}.jpg`;

  return (
    <div className="w-full max-w-sm rounded-lg border border-slate-300/30 bg-[#f8fafc] p-4 text-slate-800 shadow-lg">
      <div className="mb-3 flex items-start justify-between border-b border-slate-200 pb-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Payment proof</p>
          <p className="text-sm font-bold text-slate-900">{method}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{name}</p>
        </div>
        <FileImage className="h-5 w-5 text-slate-400" />
      </div>
      <dl className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Reference</dt>
          <dd className="font-semibold tabular-nums text-slate-900">{proof.id}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Amount</dt>
          <dd className="font-semibold text-slate-900">{amount}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Account</dt>
          <dd className="max-w-[160px] truncate font-medium text-slate-800">{account}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Date</dt>
          <dd className="font-medium text-slate-800">{String(uploadedAt).slice(0, 10)}</dd>
        </div>
      </dl>
      <p className="mt-3 rounded bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
        Uploaded by customer — read only
      </p>
    </div>
  );
}

/** Full-screen image popup — click anywhere to close */
function ProofImageLightbox({ open, proof, file, onClose }) {
  if (!open || !proof) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <p className="pointer-events-none absolute bottom-6 left-0 right-0 text-center text-xs text-white/60">
        Tap anywhere to close
      </p>
      <div className="pointer-events-none max-h-[85vh] w-full max-w-md overflow-auto">
        <ProofImageCard proof={proof} file={file} />
      </div>
    </div>
  );
}

function SubmittedFilesList({ proofs, activeId, onSelect, onViewImage }) {
  const active = proofs.find((p) => p.id === activeId) || proofs[0];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Submitted files ({proofs.length})
      </p>
      {proofs.length === 0 ? (
        <p className="px-2 py-3 text-xs text-slate-500">No files submitted</p>
      ) : (
        <ul className="space-y-1.5">
          {proofs.map((p) => {
            const selected = p.id === active?.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(p.id);
                    onViewImage?.(p);
                  }}
                  className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                    selected ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <FileImage className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-white" : "text-slate-500"}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium">{p.name}</span>
                    <span className="block text-[10px] text-slate-500">
                      {p.kind} · {p.size}
                    </span>
                  </span>
                  <Eye className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-300/80" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SubmittedProofViewer({ proof, proofs, activeId, onOpenImage }) {
  const active = proofs.find((p) => p.id === activeId) || proofs[0];
  if (!active) {
    return (
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-slate-400">
          <FileText className="mb-2 h-8 w-8 opacity-50" />
          No proof submitted by the customer
        </div>
        <ProofSummaryFields proof={proof} />
      </div>
    );
  }

  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c0f1a]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{active.name}</p>
            <p className="text-[11px] text-slate-500">
              Submitted by {active.customer} · {active.uploadedAt}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-theme-green-action/15 px-2 py-0.5 text-[10px] font-semibold text-theme-green-action">
            Customer proof
          </span>
        </div>
        <button
          type="button"
          onClick={() => onOpenImage?.(active)}
          className="flex min-h-[220px] w-full items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent p-4 transition hover:from-white/[0.07] sm:min-h-[280px] sm:p-6"
          title="View full image"
        >
          <ProofImageCard proof={proof} file={active} />
        </button>
      </div>

      <ProofSummaryFields proof={proof} />
    </div>
  );
}

function TransactionsContent() {
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") === "withdrawals" ? "withdrawals" : "deposits");
  const [status, setStatus] = useState(params.get("status") || "Pending");
  const [q, setQ] = useState("");
  const [duration, setDuration] = useState("Today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [txId, setTxId] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [perPage, setPerPage] = useState("10");
  const [selected, setSelected] = useState([]);
  const [deposits, setDeposits] = useState(DEPOSITS);
  const [withdrawals, setWithdrawals] = useState(WITHDRAWALS);
  const [rejectId, setRejectId] = useState(null);
  const [proof, setProof] = useState(null);
  const [activeProofId, setActiveProofId] = useState(null);
  const [proofRejectOpen, setProofRejectOpen] = useState(false);
  const [imageLightbox, setImageLightbox] = useState(null);
  const proofBodyRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [assignOpen, setAssignOpen] = useState(null);
  const [viewAll, setViewAll] = useState(false);
  const [livePulse, setLivePulse] = useState(0);

  useEffect(() => {
    setTab(params.get("tab") === "withdrawals" ? "withdrawals" : "deposits");
    setStatus(params.get("status") || "Pending");
    setSelected([]);
    setViewAll(false);
  }, [params]);

  /** Near real-time refresh pulse (concept 3.5) */
  useEffect(() => {
    const id = setInterval(() => {
      setLivePulse((n) => n + 1);
    }, 12000);
    return () => clearInterval(id);
  }, []);

  const source = tab === "deposits" ? deposits : withdrawals;

  const filtered = useMemo(() => {
    return source.filter((r) => {
      if (status !== "All" && !r.status.toLowerCase().includes(status.toLowerCase())) return false;
      if (txId && !r.id.toLowerCase().includes(txId.toLowerCase())) return false;
      if (platformId && !String(r.platformId).toLowerCase().includes(platformId.toLowerCase())) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return [r.id, r.customer, r.userId, r.platformId, r.method, r.account, r.assigned]
        .join(" ")
        .toLowerCase()
        .includes(s);
    });
  }, [source, status, q, txId, platformId, livePulse]);

  const pageSize = Number(perPage) || 10;
  const previewCap = viewAll ? pageSize : Math.min(PREVIEW_LIMIT, pageSize);
  const shown = filtered.slice(0, previewCap);
  const hasMore = !viewAll && filtered.length > PREVIEW_LIMIT;

  function isLockedByOther(r) {
    return !!r.lockedBy && r.lockedBy !== CURRENT_ADMIN;
  }

  function claimRequest(id) {
    const setter = tab === "deposits" ? setDeposits : setWithdrawals;
    setter((prev) =>
      prev.map((r) =>
        r.id === id && !r.lockedBy
          ? { ...r, assigned: CURRENT_ADMIN, lockedBy: CURRENT_ADMIN }
          : r
      )
    );
  }

  const pendingRows = source.filter((r) => r.status.includes("Pending"));
  const clientPayLkr = pendingRows.reduce(
    (sum, r) => sum + (Number(r.clientPayLkr) || Number(r.clientPayUsd || 0) * 300),
    0
  );
  const topUpTotal =
    tab === "withdrawals"
      ? pendingRows.reduce((sum, r) => sum + (Number(r.clientPayUsd) || 0), 0)
      : pendingRows.reduce(
          (sum, r) => sum + Number(String(r.deposited || r.amount).replace(/[^\d.]/g, "") || 0),
          0
        );

  const title =
    status === "Pending" || status.includes("Pending")
      ? tab === "deposits"
        ? "Pending Deposits"
        : "Pending Withdrawals"
      : status === "Completed"
        ? tab === "deposits"
          ? "Completed Deposits"
          : "Completed Withdrawals"
        : status === "Rejected"
          ? tab === "deposits"
            ? "Rejected Deposits"
            : "Rejected Withdrawals"
          : tab === "deposits"
            ? "Deposits"
            : "Withdrawals";

  function openProof(r) {
    setProof(r);
    setActiveProofId(null);
    setProofRejectOpen(false);
    setRejectId(null);
    // Show submitted proof at top (same-day "View submitted" is below the fold)
    requestAnimationFrame(() => {
      proofBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function openSubmittedImage(record, file) {
    const proofs = getSubmittedProofs(record);
    const active = file || proofs[0] || null;
    setImageLightbox({ proof: record, file: active });
  }

  function closeProof() {
    setProof(null);
    setActiveProofId(null);
    setProofRejectOpen(false);
    setImageLightbox(null);
  }

  function approve(id) {
    const row = source.find((r) => r.id === id);
    if (row && isLockedByOther(row)) return;
    const setter = tab === "deposits" ? setDeposits : setWithdrawals;
    setter((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "Completed", lockedBy: null, assigned: r.assigned || CURRENT_ADMIN }
          : r
      )
    );
    if (proof?.id === id) closeProof();
  }

  function reject(reason, id) {
    const targetId = id ?? rejectId;
    if (!targetId) return;
    const row = source.find((r) => r.id === targetId);
    if (row && isLockedByOther(row)) return;
    const setter = tab === "deposits" ? setDeposits : setWithdrawals;
    setter((prev) =>
      prev.map((r) =>
        r.id === targetId
          ? { ...r, status: "Rejected", rejectReason: reason, lockedBy: null }
          : r
      )
    );
    if (proof?.id === targetId) closeProof();
    setRejectId(null);
    setProofRejectOpen(false);
  }

  function toggleRowReject(id) {
    setRejectId((prev) => (prev === id ? null : id));
  }

  function toggleAll(checked) {
    setSelected(checked ? shown.map((r) => r.id) : []);
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function refresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Transactions", href: "/transactions?tab=deposits&status=Pending" },
          { label: tab === "deposits" ? "Deposits" : "Withdrawals", href: `/transactions?tab=${tab}&status=${status}` },
          { label: title },
        ]}
      />

      {/* Concept 3.1.5 — main tabs + status dropdown (not separate pages) */}
      <div className="admin-fade-up mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-white/10 bg-admin-chrome-deep/80 p-1">
          {[
            { id: "deposits", label: "Deposits", count: deposits.filter((d) => d.status.includes("Pending")).length },
            { id: "withdrawals", label: "Withdrawals", count: withdrawals.filter((w) => w.status.includes("Pending")).length },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSelected([]);
                setViewAll(false);
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-admin-teal text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === t.id ? "bg-white/20" : "bg-white/10"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-slate-400">
            Status filter
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setViewAll(false);
              }}
              className={`${inputCls} w-40`}
            >
              {["Pending", "Completed", "Rejected", "All"].map((s) => (
                <option key={s} value={s} className="bg-admin-surface">
                  {s}
                </option>
              ))}
            </select>
          </label>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
            <span className="admin-live-dot h-1.5 w-1.5 rounded-full bg-theme-green-action" />
            Live
          </span>
        </div>
      </div>

      {/* Summary strips like screenshot */}
      <div className="admin-fade-up mb-4 grid gap-3 sm:grid-cols-2">
        <div className="admin-metric-card relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#129E38] to-[#0D9F1B] px-5 py-4">
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-white/90">
                {tab === "deposits" ? "Client Pay" : "Client Receive"}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                Rs. {clientPayLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
              <FileText className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="admin-metric-card admin-metric-card--teal relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#2DD4BF] px-5 py-4">
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-white/90">
                {tab === "deposits" ? "Top Up" : "Cash Out"}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                USD {topUpTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-lg font-bold text-white">
              $
            </span>
          </div>
        </div>
      </div>

      <section className="admin-card admin-fade-up overflow-visible p-0">
        {/* Header actions — screenshot layout */}
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-2 text-xl font-bold text-white sm:text-2xl">{title}</h1>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => selected.length && setAssignOpen(selected[0])}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition disabled:opacity-40 ${
                tab === "withdrawals"
                  ? "bg-admin-teal enabled:hover:brightness-110"
                  : "bg-white/10 enabled:hover:bg-white/20"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Assign {selected.length ? `(${selected.length})` : ""}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-3.5 py-2 text-xs font-semibold text-white"
            >
              Export
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <label className="inline-flex items-center gap-2 text-xs text-slate-500">
              Per page
              <select
                value={perPage}
                onChange={(e) => setPerPage(e.target.value)}
                className="rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-xs text-white"
              >
                {["10", "25", "50", "100"].map((n) => (
                  <option key={n} value={n} className="bg-admin-surface">
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Search (left) + Filter (right) side by side */}
        <div className="border-b border-white/10 bg-white/5 px-5 py-4">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Search
              </span>
              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-admin-surface">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
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

            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Filter
              </span>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <FilterField label="Search in">
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                    {["All", "Pending", "Completed", "Rejected"].map((s) => (
                      <option key={s} value={s} className="bg-admin-surface">
                        {s}
                      </option>
                    ))}
                  </select>
                </FilterField>
                <FilterField label="Duration">
                  <select
                    value={duration}
                    onChange={(e) => {
                      const next = e.target.value;
                      setDuration(next);
                      if (next !== "Custom") {
                        setFrom("");
                        setTo("");
                      }
                    }}
                    className={inputCls}
                  >
                    {["Today", "Yesterday", "This Week", "This Month", "Custom"].map((d) => (
                      <option key={d} value={d} className="bg-admin-surface">
                        {d}
                      </option>
                    ))}
                  </select>
                </FilterField>
                {duration === "Custom" ? (
                  <>
                    <FilterField label="From">
                      <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
                    </FilterField>
                    <FilterField label="To">
                      <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
                    </FilterField>
                  </>
                ) : null}
                <FilterField label="Transaction Id">
                  <input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="1640…" className={inputCls} />
                </FilterField>
                <FilterField label="Platform Id">
                  <input
                    value={platformId}
                    onChange={(e) => setPlatformId(e.target.value)}
                    placeholder="Plat. ID"
                    className={inputCls}
                  />
                </FilterField>
              </div>
            </div>
          </div>
        </div>

        {/* Table — deposits vs withdrawals columns */}
        <div className="overflow-x-auto">
          {tab === "withdrawals" ? (
            <table className="min-w-[1280px] w-full text-left text-[13px]">
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
                  <th className="px-3 py-3">Tran. ID</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">ID & Name</th>
                  <th className="px-3 py-3">Platform</th>
                  <th className="px-3 py-3">Cashout Amt.</th>
                  <th className="px-3 py-3">Plat. ID</th>
                  <th className="px-3 py-3">Cashout M.</th>
                  <th className="px-3 py-3">Receiving Amount</th>
                  <th className="px-3 py-3">Acc</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Assign</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="rounded border-white/20"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.id} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-1.5">
                        <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <CopyCell value={r.date} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={`${r.userId} ${r.customer}`} />
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.platform} />
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.cashoutAmt || r.amount} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => openProof(r)}
                        className="inline-flex items-center gap-1.5 text-left"
                        title="Today's transaction count for this platform user"
                      >
                        <CopyCell value={r.platformId} />
                        {r.todayTxCount ? (
                          <span className="admin-badge-glow h-5 min-w-5 px-1.5 text-[10px]">{r.todayTxCount}</span>
                        ) : null}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium">
                        {r.method}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.receiving || r.payout} />
                    </td>
                    <td className="px-3 py-3 max-w-[140px]">
                      <CopyCell value={r.account} />
                    </td>
                    <td className="px-3 py-3">
                      {isLockedByOther(r) ? (
                        <span
                          className="cursor-not-allowed text-[11px] text-amber-300/90"
                          title={`This request is locked by ${r.lockedBy}.`}
                        >
                          Locked
                        </span>
                      ) : (
                        <div className="relative flex gap-1">
                          <button
                            type="button"
                            onClick={() => toggleRowReject(r.id)}
                            className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm"
                            title="Reject — reason required"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => approve(r.id)}
                            className="rounded-lg bg-theme-green-action p-1.5 text-white shadow-sm"
                            title="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          {rejectId === r.id ? (
                            <div className="absolute right-0 top-full z-50 mt-1 w-72">
                              <RejectReasonPanel
                                onCancel={() => setRejectId(null)}
                                onConfirm={(reason) => reject(reason, r.id)}
                              />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill
                        status={r.status}
                        onClick={() => openProof(r)}
                        title="View proof and approve / reject"
                      />
                      {r.rejectReason ? (
                        <p className="mt-1 max-w-[140px] text-[10px] leading-snug text-rose-300" title={r.rejectReason}>
                          {r.rejectReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      {isLockedByOther(r) ? (
                        <span className="text-[11px] text-amber-300" title={`Locked by ${r.lockedBy}`}>
                          {r.lockedBy}
                        </span>
                      ) : !r.lockedBy && r.status.includes("Pending") ? (
                        <button
                          type="button"
                          onClick={() => claimRequest(r.id)}
                          className="text-xs font-semibold text-teal-300 underline-offset-2 hover:underline"
                          title="Pick from queue — locks this request to you"
                        >
                          Pick
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAssignOpen(r.id)}
                          className="text-xs font-semibold text-teal-400 underline-offset-2 hover:underline"
                        >
                          {r.assigned && r.assigned !== "—" ? r.assigned : "Assign"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-14 text-center text-slate-400">
                      No results found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : (
            <table className="min-w-[1200px] w-full text-left text-[13px]">
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
                  <th className="px-3 py-3">Tran. ID</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">ID & Name</th>
                  <th className="px-3 py-3">Payment Option</th>
                  <th className="px-3 py-3">Client Pay Amt.</th>
                  <th className="px-3 py-3">Platform</th>
                  <th className="px-3 py-3">Deposited Amt.</th>
                  <th className="px-3 py-3">Plat. ID</th>
                  <th className="px-3 py-3">Proof</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Assign</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="rounded border-white/20"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.id} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-1.5">
                        <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <CopyCell value={r.date} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={`${r.userId} ${r.customer}`} />
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">{r.method}</span>
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.clientPay || r.amount} />
                    </td>
                    <td className="px-3 py-3 font-medium text-white">{r.platform || "—"}</td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.deposited || r.amount} />
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.platformId} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => openProof(r)}
                        className={`rounded-lg p-1.5 ${r.proof ? "bg-theme-green-action/15 text-theme-green-action" : "bg-white/5 text-slate-400"}`}
                        title="View proof"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      {isLockedByOther(r) ? (
                        <span
                          className="cursor-not-allowed text-[11px] text-amber-300/90"
                          title={`This request is locked by ${r.lockedBy}.`}
                        >
                          Locked
                        </span>
                      ) : (
                        <div className="relative flex gap-1">
                          <button
                            type="button"
                            onClick={() => toggleRowReject(r.id)}
                            className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm"
                            title="Reject — reason required"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => approve(r.id)}
                            className="rounded-lg bg-theme-green-action p-1.5 text-white shadow-sm"
                            title="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          {rejectId === r.id ? (
                            <div className="absolute right-0 top-full z-50 mt-1 w-72">
                              <RejectReasonPanel
                                onCancel={() => setRejectId(null)}
                                onConfirm={(reason) => reject(reason, r.id)}
                              />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill
                        status={r.status}
                        onClick={() => openProof(r)}
                        title="View proof and approve / reject"
                      />
                      {r.rejectReason ? (
                        <p className="mt-1 max-w-[120px] truncate text-[10px] text-rose-300" title={r.rejectReason}>
                          {r.rejectReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setAssignOpen(r.id)}
                        className="text-xs font-semibold text-admin-teal underline-offset-2 hover:underline"
                      >
                        {r.assigned && r.assigned !== "—" ? r.assigned : "Assign"}
                      </button>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-14 text-center text-slate-400">
                      No Results Found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>

        {/* Progressive disclosure — concept 3.3 */}
        {hasMore ? (
          <div className="border-t border-white/10 px-5 py-4 text-center">
            <p className="mb-2 text-xs text-slate-500">
              Showing latest {shown.length} of {filtered.length} {title.toLowerCase()}
            </p>
            <button
              type="button"
              onClick={() => setViewAll(true)}
              className="rounded-xl border border-teal-300/30 bg-teal-400/10 px-4 py-2 text-sm font-semibold text-teal-200 transition hover:bg-teal-400/20"
            >
              View all {title}
            </button>
          </div>
        ) : null}
      </section>

      {assignOpen ? (
        <div
          className="admin-modal-overlay"
          onClick={() => setAssignOpen(null)}
        >
          <div className="admin-card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white">Assign & lock</h3>
            <p className="mt-1 text-sm text-slate-400">
              Assigning locks the request so other admins cannot process it.
            </p>
            <div className="mt-4 space-y-2">
              {ASSIGNEES.filter((a) => a !== "—").map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    const ids = selected.length && selected.includes(assignOpen) ? selected : [assignOpen];
                    const setter = tab === "deposits" ? setDeposits : setWithdrawals;
                    setter((prev) =>
                      prev.map((r) =>
                        ids.includes(r.id) ? { ...r, assigned: name, lockedBy: name } : r
                      )
                    );
                    setAssignOpen(null);
                    setSelected([]);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:border-admin-teal/40 hover:bg-admin-teal/10"
                >
                  {name}
                  <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAssignOpen(null)}
              className="mt-4 w-full rounded-xl border border-white/10 py-2 text-sm text-slate-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {proof ? (
        <div className="admin-modal-overlay" onClick={closeProof}>
          <div
            className="admin-card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Transaction Proof</h3>
                <p className="text-sm text-slate-400">
                  {proof.id} · {proof.customer}
                  {proof.todayTxCount ? ` · ${proof.todayTxCount} tx today` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeProof}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={proofBodyRef} className="min-h-0 flex-1 overflow-auto px-5 py-4">
              <div id="proof-submitted-top">
                <SubmittedProofViewer
                  proof={proof}
                  proofs={getSubmittedProofs(proof)}
                  activeId={activeProofId || getSubmittedProofs(proof)[0]?.id}
                  onOpenImage={(file) => openSubmittedImage(proof, file)}
                />
              </div>

              {proof.rejectReason ? (
                <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  Rejection reason (customer-facing): <span className="font-semibold">{proof.rejectReason}</span>
                </div>
              ) : null}
              <h4 className="mb-2 mt-5 text-sm font-semibold text-white">
                Same-day transactions grid
              </h4>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-[640px] w-full text-left text-sm">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Tran. ID</th>
                      <th className="px-3 py-2">Platform ID</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Method</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {source
                      .filter((r) => r.userId === proof.userId || r.customer === proof.customer)
                      .map((r) => (
                        <tr key={r.id} className="border-t border-white/10 text-slate-300">
                          <td className="px-3 py-2">
                            <CopyCell value={r.id} />
                          </td>
                          <td className="px-3 py-2">
                            <CopyCell value={r.platformId} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">{r.cashoutAmt || r.amount}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.method}</td>
                          <td className="px-3 py-2">
                            <StatusPill status={r.status} />
                          </td>
                          <td className="px-3 py-2">
                            {r.proof ? (
                              <button
                                type="button"
                                onClick={() => openSubmittedImage(r)}
                                className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-teal-300 hover:underline"
                              >
                                <Eye className="h-3 w-3" />
                                View submitted
                              </button>
                            ) : (
                              <span className="text-slate-500">Not submitted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <SubmittedFilesList
                  proofs={getSubmittedProofs(proof)}
                  activeId={activeProofId || getSubmittedProofs(proof)[0]?.id}
                  onSelect={setActiveProofId}
                  onViewImage={(file) => openSubmittedImage(proof, file)}
                />
              </div>
            </div>

            <ProofImageLightbox
              open={!!imageLightbox}
              proof={imageLightbox?.proof}
              file={imageLightbox?.file}
              onClose={() => setImageLightbox(null)}
            />

            {isLockedByOther(proof) ? (
              <div className="border-t border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-200">
                Locked by {proof.lockedBy} — claim or wait before approving or rejecting.
              </div>
            ) : proof.status === "Rejected" ? (
              <div className="flex flex-col-reverse gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <StatusPill status={proof.status} />
                  <p className="text-xs text-slate-500">Rejected — you can approve again if needed.</p>
                </div>
                <button
                  type="button"
                  onClick={() => approve(proof.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
              </div>
            ) : (
              <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <StatusPill status={proof.status} />
                    <p className="text-xs text-slate-500">
                      {proof.status === "Completed"
                        ? "Already approved — you can still reject with a reason."
                        : "Review submitted proof, then approve or reject with a customer-facing reason."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProofRejectOpen((v) => !v)}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                        proofRejectOpen
                          ? "border-rose-400/60 bg-rose-500/25 text-rose-200"
                          : "border-rose-400/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      }`}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    {String(proof.status || "").includes("Pending") ? (
                      <button
                        type="button"
                        onClick={() => approve(proof.id)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 sm:flex-none"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                    ) : null}
                  </div>
                </div>
                {proofRejectOpen ? (
                  <RejectReasonPanel
                    className="mt-3"
                    onCancel={() => setProofRejectOpen(false)}
                    onConfirm={(reason) => reject(reason, proof.id)}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">Loading transactions…</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
