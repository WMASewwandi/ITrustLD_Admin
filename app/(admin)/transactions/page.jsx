"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import RejectModal from "@/components/admin/reject-modal";
import CopyCell, { FilterField, StatusPill, inputCls } from "@/components/admin/queue-ui";
import { DEPOSITS, WITHDRAWALS } from "@/lib/mock-data";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";

const ASSIGNEES = ["sacl", "withdraw.ex", "deposit.ex", "Authorizer", "admin"];

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
  const [refreshing, setRefreshing] = useState(false);
  const [assignOpen, setAssignOpen] = useState(null);

  useEffect(() => {
    setTab(params.get("tab") === "withdrawals" ? "withdrawals" : "deposits");
    setStatus(params.get("status") || "Pending");
    setSelected([]);
  }, [params]);

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
  }, [source, status, q, txId, platformId]);

  const pageSize = Number(perPage) || 10;
  const shown = filtered.slice(0, pageSize);

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

  function approve(id) {
    const setter = tab === "deposits" ? setDeposits : setWithdrawals;
    setter((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Completed" } : r)));
  }

  function reject(reason) {
    const setter = tab === "deposits" ? setDeposits : setWithdrawals;
    setter((prev) =>
      prev.map((r) => (r.id === rejectId ? { ...r, status: "Rejected", rejectReason: reason } : r))
    );
    setRejectId(null);
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
          { label: tab === "deposits" ? "Deposits" : "Withdrawals", href: `/transactions?tab=${tab}` },
          { label: title },
        ]}
      />

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
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-2 text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => selected.length && setAssignOpen(selected[0])}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 transition disabled:opacity-40 ${
                tab === "withdrawals"
                  ? "bg-admin-teal enabled:hover:brightness-110"
                  : "bg-slate-100 enabled:hover:bg-slate-200"
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
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900"
              >
                {["10", "25", "50", "100"].map((n) => (
                  <option key={n} value={n} className="bg-white">
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Search row with teal search button (withdrawals screenshot) */}
        <div className="border-b border-slate-200 px-5 py-3">
          <div className="flex max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
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

        {/* Dense filter row */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <FilterField label="Search in">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                {["All", "Pending", "Completed", "Rejected"].map((s) => (
                  <option key={s} value={s} className="bg-white">
                    {s}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Duration">
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls}>
                {["Today", "Yesterday", "This Week", "This Month", "Custom"].map((d) => (
                  <option key={d} value={d} className="bg-white">
                    {d}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="From">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
            </FilterField>
            <FilterField label="To">
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
            </FilterField>
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

        {/* Table — deposits vs withdrawals columns */}
        <div className="overflow-x-auto">
          {tab === "withdrawals" ? (
            <table className="min-w-[1280px] w-full text-left text-[13px]">
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
                  <tr key={r.id} className="border-t border-slate-100 text-slate-700 transition hover:bg-admin-teal/[0.05]">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="rounded border-slate-300"
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
                      <CopyCell value={r.platformId} />
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium">
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
                      {r.status.includes("Pending") ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setRejectId(r.id)}
                            className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm"
                            title="Reject"
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
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={r.status} />
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
                        className="text-xs font-semibold text-teal-400 underline-offset-2 hover:underline"
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
          ) : (
            <table className="min-w-[1200px] w-full text-left text-[13px]">
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
                  <tr key={r.id} className="border-t border-slate-100 text-slate-700 transition hover:bg-admin-teal/[0.05]">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="rounded border-slate-300"
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
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">{r.method}</span>
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.clientPay || r.amount} />
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">{r.platform || "—"}</td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.deposited || r.amount} />
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.platformId} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setProof(r)}
                        className={`rounded-lg p-1.5 ${r.proof ? "bg-theme-green-action/15 text-theme-green-action" : "bg-white/5 text-slate-400"}`}
                        title="View proof"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      {r.status.includes("Pending") ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setRejectId(r.id)}
                            className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm"
                            title="Reject"
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
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={r.status} />
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
      </section>

      <RejectModal
        open={!!rejectId}
        title={tab === "deposits" ? "Reject deposit" : "Reject withdrawal"}
        onClose={() => setRejectId(null)}
        onConfirm={reject}
      />

      {assignOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-admin-chrome/50 p-4 backdrop-blur-sm"
          onClick={() => setAssignOpen(null)}
        >
          <div className="admin-card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">Assign executive</h3>
            <p className="mt-1 text-sm text-slate-500">Select who handles this deposit queue item.</p>
            <div className="mt-4 space-y-2">
              {ASSIGNEES.filter((a) => a !== "—").map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    const ids = selected.length && selected.includes(assignOpen) ? selected : [assignOpen];
                    const setter = tab === "deposits" ? setDeposits : setWithdrawals;
                    setter((prev) =>
                      prev.map((r) => (ids.includes(r.id) ? { ...r, assigned: name } : r))
                    );
                    setAssignOpen(null);
                    setSelected([]);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition hover:border-admin-teal/40 hover:bg-admin-teal/10"
                >
                  {name}
                  <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAssignOpen(null)}
              className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm text-slate-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {proof ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-admin-chrome/50 p-4 backdrop-blur-sm"
          onClick={() => setProof(null)}
        >
          <div className="admin-card max-h-[85vh] w-full max-w-2xl overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Transaction Proof</h3>
                <p className="text-sm text-slate-500">
                  {proof.id} · {proof.customer}
                </p>
              </div>
              <button type="button" onClick={() => setProof(null)} className="text-slate-400 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
              Payment slip / proof preview
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-slate-400">Client Pay</dt>
                <dd className="font-medium">{proof.clientPay || proof.amount}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-slate-400">Deposited</dt>
                <dd className="font-medium">{proof.deposited || proof.amount}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-slate-400">Platform ID</dt>
                <dd className="font-medium">{proof.platformId}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-slate-400">Account</dt>
                <dd className="font-medium">{proof.account}</dd>
              </div>
            </dl>
            <h4 className="mb-2 mt-5 text-sm font-semibold text-slate-900">Same-day transactions</h4>
            <div className="space-y-2 text-sm">
              {source
                .filter((r) => r.customer === proof.customer)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span>{r.id}</span>
                    <span>{r.amount}</span>
                    <StatusPill status={r.status} />
                  </div>
                ))}
            </div>
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
