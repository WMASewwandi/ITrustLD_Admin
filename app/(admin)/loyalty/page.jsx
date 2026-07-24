"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import RejectModal from "@/components/admin/reject-modal";
import RejectReasonPanel from "@/components/admin/reject-reason-panel";
import CopyCell, { FilterField, StatusPill, inputCls } from "@/components/admin/queue-ui";
import {
  AFFILIATE_BONUS_CONFIG,
  AFFILIATE_LOYALTY_LEVELS,
  AFFILIATE_POINT_COLLECTION,
  BONUS_CLAIMS,
  LOYALTY_BONUS_CONFIG,
  LOYALTY_ORDERS,
  LOYALTY_POINT_COLLECTION,
  LOYALTY_RANKING_USERS,
  VOUCHERS,
} from "@/lib/mock-data";
import { AlertTriangle, Check, Mail, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";

const TABS = [
  { id: "orders", label: "Orders" },
  { id: "bonus", label: "Bonus Claims" },
  { id: "vouchers", label: "Voucher Claims" },
  { id: "management", label: "Loyalty Management" },
];

function DetailField({ label, children }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <dt className="mb-0.5 text-[11px] text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-white">{children}</dd>
    </div>
  );
}

function LoyaltyDetailModal({ open, record, tab, onClose, onApprove, onReject, onReopen }) {
  const [rejectOpen, setRejectOpen] = useState(false);

  useEffect(() => {
    if (!open) setRejectOpen(false);
  }, [open, record?.id]);

  if (!open || !record) return null;

  const title =
    tab === "bonus" ? "Bonus claim details" : tab === "vouchers" ? "Voucher claim details" : "Loyalty order details";
  // Pending: both · Rejected: approve only · Completed/Claimed: reject only
  const canApprove = record.status === "Pending" || record.status === "Rejected";
  const canReject = record.status === "Pending" || record.status === "Completed" || record.status === "Claimed";

  return (
    <div className="admin-modal-overlay z-[80]" onClick={onClose}>
      <div
        className="admin-card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {record.id} · {record.customer}
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
          <dl className="grid gap-2 sm:grid-cols-2">
            <DetailField label="Date">
              <CopyCell value={record.date} />
            </DetailField>
            <DetailField label="User">
              <CopyCell value={`${record.userId} ${record.customer}`} />
            </DetailField>
            {tab === "orders" ? (
              <>
                <DetailField label="Loyalty Points">
                  <span className="text-[#FBBF24]">{record.points}</span>
                </DetailField>
                <DetailField label="Withdraw Amount">
                  <CopyCell value={record.amount} sub={record.amountUsd} />
                </DetailField>
                <DetailField label="Payment Method">
                  <CopyCell value={record.method} />
                </DetailField>
                <DetailField label="Received Amount">
                  <CopyCell value={record.received} />
                </DetailField>
                <DetailField label="Platform">
                  <CopyCell value={record.platform} />
                </DetailField>
                <DetailField label="Account / Detail">
                  <CopyCell value={record.platformDetail || record.email || "—"} />
                </DetailField>
              </>
            ) : null}
            {tab === "bonus" ? (
              <>
                <DetailField label="Amount">
                  <CopyCell value={record.amount} />
                </DetailField>
                <DetailField label="Payment Method">
                  <CopyCell value={record.method} />
                </DetailField>
                <DetailField label="Received Amount">
                  <CopyCell value={record.received} />
                </DetailField>
                <DetailField label="Platform ID">
                  <CopyCell value={record.platformId} />
                </DetailField>
                <DetailField label="Email">
                  <CopyCell value={record.email} />
                </DetailField>
                <DetailField label="Admin">{record.admin || "—"}</DetailField>
              </>
            ) : null}
            {tab === "vouchers" ? (
              <>
                <DetailField label="Platform ID">
                  <CopyCell value={record.platformId || "—"} />
                </DetailField>
                <DetailField label="Amount">
                  <CopyCell value={record.amount} />
                </DetailField>
                <DetailField label="Platform">
                  <CopyCell value={record.platform} />
                </DetailField>
                <DetailField label="Method">
                  <CopyCell value={record.method || "—"} />
                </DetailField>
                <DetailField label="Voucher Token">
                  <CopyCell value={record.token || "—"} />
                </DetailField>
                <DetailField label="Admin">{record.admin || record.claimedBy || "—"}</DetailField>
                {record.claimedDate ? (
                  <DetailField label="Claimed Date">
                    <CopyCell value={record.claimedDate} />
                  </DetailField>
                ) : null}
                {record.rejectedDate ? (
                  <DetailField label="Rejected Date">
                    <CopyCell value={record.rejectedDate} />
                  </DetailField>
                ) : null}
              </>
            ) : null}
          </dl>
          {record.rejectReason ? (
            <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              Rejection reason: <span className="font-semibold">{record.rejectReason}</span>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <StatusPill status={record.status} />
              <p className="text-xs text-slate-500">
                {record.status === "Pending"
                  ? "Review this claim, then approve or reject."
                  : record.status === "Rejected"
                    ? "Rejected — approve again if needed."
                    : "Already processed — you can still reject with a reason."}
              </p>
            </div>
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
                  onClick={() => {
                    onApprove?.(record.id);
                    onClose?.();
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
              ) : null}
            </div>
          </div>
          {rejectOpen ? (
            <RejectReasonPanel
              className="mt-3"
              onCancel={() => setRejectOpen(false)}
              onConfirm={(reason) => {
                setRejectOpen(false);
                onReject?.(record.id, reason);
                onClose?.();
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LoyaltyContent() {
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "orders");
  const [status, setStatus] = useState(params.get("status") || "Pending");
  const [audience, setAudience] = useState("Normal Users");
  const [q, setQ] = useState("");
  const [duration, setDuration] = useState("Today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [orders, setOrders] = useState(LOYALTY_ORDERS);
  const [bonuses, setBonuses] = useState(BONUS_CLAIMS);
  const [vouchers, setVouchers] = useState(VOUCHERS);
  const [rejectId, setRejectId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [pointRows, setPointRows] = useState(LOYALTY_POINT_COLLECTION);
  const [bonusRows, setBonusRows] = useState(LOYALTY_BONUS_CONFIG);
  const [activatePoints, setActivatePoints] = useState(true);
  const [activateBonus, setActivateBonus] = useState(false);
  const [ranking, setRanking] = useState(LOYALTY_RANKING_USERS);
  const [rankSelectAll, setRankSelectAll] = useState(false);
  const [affiliatePoints, setAffiliatePoints] = useState(AFFILIATE_POINT_COLLECTION);
  const [affiliateBonus, setAffiliateBonus] = useState(AFFILIATE_BONUS_CONFIG);
  const [affiliateLevels, setAffiliateLevels] = useState(AFFILIATE_LOYALTY_LEVELS);
  const [activateAffPoints, setActivateAffPoints] = useState(true);
  const [activateAffBonus, setActivateAffBonus] = useState(true);

  const isAffiliate = audience === "Affiliate Partners";

  useEffect(() => {
    if (audience === "Affiliate Partners") {
      setActivateAffPoints(true);
      setActivateAffBonus(true);
    }
  }, [audience]);

  useEffect(() => {
    const nextTab = params.get("tab") || "orders";
    setTab(nextTab);
    setStatus(params.get("status") || (nextTab === "management" ? "All" : "Pending"));
    if (params.get("audience") === "affiliate") {
      setAudience("Affiliate Partners");
    } else if (params.get("audience") === "normal") {
      setAudience("Normal Users");
    }
  }, [params]);

  const list = tab === "bonus" ? bonuses : tab === "vouchers" ? vouchers : orders;

  const filtered = useMemo(() => {
    if (tab === "management") return [];
    return list.filter((r) => {
      if (status !== "All" && r.status !== status && !(status === "Pending" && String(r.status).includes("Pending"))) {
        return false;
      }
      if (!q.trim()) return true;
      return JSON.stringify(r).toLowerCase().includes(q.toLowerCase());
    });
  }, [list, status, q, tab]);

  const pageTitle =
    tab === "orders"
      ? status === "Pending"
        ? "Pending Loyalty Order"
        : status === "Rejected"
          ? "Rejected Loyalty Orders"
          : "Loyalty Orders"
      : tab === "bonus"
        ? status === "Rejected"
          ? "Rejected Bonus Claims"
          : status === "Pending"
            ? "Pending Bonus Claims"
            : status === "Claimed"
              ? "Claimed Bonus Claims"
              : "Bonus Claims"
        : tab === "vouchers"
          ? status === "Pending"
            ? "Pending Voucher Claims"
            : status === "Claimed"
              ? "Claimed Voucher Claims"
              : status === "Rejected"
                ? "Rejected Voucher Claims"
                : "Voucher Claims"
          : "Loyalty Management";

  function approve(id) {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    if (tab === "bonus") {
      setBonuses((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Claimed", admin: "Admin" } : r)));
    } else if (tab === "vouchers") {
      setVouchers((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "Claimed", admin: "System Admin", claimedBy: "System Admin", claimedDate: now }
            : r
        )
      );
    } else {
      setOrders((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Completed" } : r)));
    }
  }

  function rejectRecord(id, reason) {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    if (tab === "bonus") {
      setBonuses((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "Rejected", rejectReason: reason, admin: "Admin" } : r))
      );
    } else if (tab === "vouchers") {
      setVouchers((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "Rejected",
                rejectReason: reason,
                rejectedDate: now,
                admin: "System Admin",
              }
            : r
        )
      );
    } else {
      setOrders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "Rejected", rejectReason: reason } : r))
      );
    }
  }

  function openDetail(r) {
    setDetail(r);
  }

  function reopen(id) {
    if (tab === "bonus") {
      setBonuses((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "Pending", admin: "—", rejectReason: undefined } : r))
      );
    } else if (tab === "vouchers") {
      setVouchers((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "Pending",
                admin: "—",
                rejectReason: undefined,
                rejectedDate: undefined,
                claimedBy: undefined,
                claimedDate: undefined,
              }
            : r
        )
      );
    } else {
      setOrders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "Pending", rejectReason: undefined } : r))
      );
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Loyalty", href: "/loyalty" }, { label: pageTitle }]} />

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-admin-chrome-deep/80 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setStatus(t.id === "management" ? "All" : "Pending");
            }}
            className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-gradient-to-r from-admin-teal to-[#236B6B] text-white shadow-lg shadow-[#236B6B]/15"
                : "text-slate-500 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "management" ? (
        <div className="admin-fade-up space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">Loyalty Management</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                {isAffiliate
                  ? "Affiliate partners · point collection · bonus · loyalty levels"
                  : "Point collection · bonus · user ranking · Normal Users"}
              </p>
            </div>
            <div className="flex gap-2">
              {["Normal Users", "Affiliate Partners"].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    audience === a
                      ? "bg-gradient-to-r from-admin-teal to-admin-teal-deep text-white"
                      : "border border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {isAffiliate ? (
            <>
              {/* Affiliate Point Collection */}
              <section className="admin-card overflow-visible p-0">
                <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-white">Point Collection</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                      <input
                        type="checkbox"
                        checked={activateAffPoints}
                        onChange={(e) => setActivateAffPoints(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Activate Amount
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextId = String(Math.max(...affiliatePoints.map((r) => Number(r.id)), 0) + 1);
                        setAffiliatePoints((prev) => [
                          {
                            id: nextId,
                            adminId: "1",
                            calAmount: "1",
                            changedDate: new Date().toISOString().slice(0, 19).replace("T", " "),
                            active: false,
                          },
                          ...prev,
                        ]);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Amount
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[13px]">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Admin ID</th>
                        <th className="px-4 py-3">Cal Amount</th>
                        <th className="px-4 py-3">Changed Date</th>
                        <th className="px-4 py-3">Set as Active</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliatePoints.map((r) => (
                        <tr key={r.id} className="border-t border-white/10 text-slate-300">
                          <td className="px-4 py-3 font-medium text-white">{r.id}</td>
                          <td className="px-4 py-3">{r.adminId}</td>
                          <td className="px-4 py-3">
                            <input
                              value={r.calAmount}
                              onChange={(e) =>
                                setAffiliatePoints((prev) =>
                                  prev.map((row) => (row.id === r.id ? { ...row, calAmount: e.target.value } : row))
                                )
                              }
                              className="w-20 rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-sm text-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-400">{r.changedDate}</td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={r.active}
                              onChange={(e) =>
                                setAffiliatePoints((prev) =>
                                  prev.map((row) =>
                                    row.id === r.id
                                      ? { ...row, active: e.target.checked }
                                      : e.target.checked
                                        ? { ...row, active: false }
                                        : row
                                  )
                                )
                              }
                              className="rounded border-white/20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button type="button" className="rounded-lg bg-theme-green-action/90 p-1.5 text-white" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setAffiliatePoints((prev) => prev.filter((row) => row.id !== r.id))}
                                className="rounded-lg bg-[#E11D48] p-1.5 text-white"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Affiliate Bonus */}
              <section className="admin-card overflow-visible p-0">
                <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-white">Bonus</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                      <input
                        type="checkbox"
                        checked={activateAffBonus}
                        onChange={(e) => setActivateAffBonus(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Activate Amount
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextId = String(Math.max(...affiliateBonus.map((r) => Number(r.id)), 0) + 1);
                        setAffiliateBonus((prev) => [
                          {
                            id: nextId,
                            adminId: "1",
                            calAmount: "50",
                            changedDate: new Date().toISOString().slice(0, 19).replace("T", " "),
                            active: false,
                          },
                          ...prev,
                        ]);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Amount
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[13px]">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Admin ID</th>
                        <th className="px-4 py-3">Cal Amount</th>
                        <th className="px-4 py-3">Changed Date</th>
                        <th className="px-4 py-3">Set as Active</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliateBonus.map((r) => (
                        <tr key={r.id} className="border-t border-white/10 text-slate-300">
                          <td className="px-4 py-3 font-medium text-white">{r.id}</td>
                          <td className="px-4 py-3">{r.adminId}</td>
                          <td className="px-4 py-3">
                            <input
                              value={r.calAmount}
                              onChange={(e) =>
                                setAffiliateBonus((prev) =>
                                  prev.map((row) => (row.id === r.id ? { ...row, calAmount: e.target.value } : row))
                                )
                              }
                              className="w-24 rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-sm text-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-400">{r.changedDate}</td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={r.active}
                              onChange={(e) =>
                                setAffiliateBonus((prev) =>
                                  prev.map((row) =>
                                    row.id === r.id
                                      ? { ...row, active: e.target.checked }
                                      : e.target.checked
                                        ? { ...row, active: false }
                                        : row
                                  )
                                )
                              }
                              className="rounded border-white/20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button type="button" className="rounded-lg bg-theme-green-action/90 p-1.5 text-white" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setAffiliateBonus((prev) => prev.filter((row) => row.id !== r.id))}
                                className="rounded-lg bg-[#E11D48] p-1.5 text-white"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Loyalty levels — Silver / Gold / Platinum */}
              {affiliateLevels.map((level, levelIdx) => (
                <section key={level.name} className="admin-card overflow-visible p-0">
                  <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-white">Loyalty — {level.name}</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                        <input
                          type="checkbox"
                          checked={level.activate}
                          onChange={(e) =>
                            setAffiliateLevels((prev) =>
                              prev.map((lv, i) => (i === levelIdx ? { ...lv, activate: e.target.checked } : lv))
                            )
                          }
                          className="rounded border-white/20"
                        />
                        Activate Amount
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setAffiliateLevels((prev) =>
                            prev.map((lv, i) => {
                              if (i !== levelIdx) return lv;
                              const nextId = String(Math.max(...lv.rows.map((r) => Number(r.id)), 0) + 1);
                              return {
                                ...lv,
                                rows: [
                                  {
                                    id: nextId,
                                    adminId: "1",
                                    calAmount: "1",
                                    changedDate: new Date().toISOString().slice(0, 19).replace("T", " "),
                                    active: false,
                                  },
                                  ...lv.rows,
                                ],
                              };
                            })
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Amount
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-[13px]">
                      <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Admin ID</th>
                          <th className="px-4 py-3">Cal Amount</th>
                          <th className="px-4 py-3">Changed Date</th>
                          <th className="px-4 py-3">Set as Active</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {level.rows.map((r) => (
                          <tr key={`${level.name}-${r.id}`} className="border-t border-white/10 text-slate-300">
                            <td className="px-4 py-3 font-medium text-white">{r.id}</td>
                            <td className="px-4 py-3">{r.adminId}</td>
                            <td className="px-4 py-3">
                              <input
                                value={r.calAmount}
                                onChange={(e) =>
                                  setAffiliateLevels((prev) =>
                                    prev.map((lv, i) =>
                                      i === levelIdx
                                        ? {
                                            ...lv,
                                            rows: lv.rows.map((row) =>
                                              row.id === r.id ? { ...row, calAmount: e.target.value } : row
                                            ),
                                          }
                                        : lv
                                    )
                                  )
                                }
                                className="w-20 rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-sm text-white"
                              />
                            </td>
                            <td className="px-4 py-3 text-slate-400">{r.changedDate}</td>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={r.active}
                                onChange={(e) =>
                                  setAffiliateLevels((prev) =>
                                    prev.map((lv, i) =>
                                      i === levelIdx
                                        ? {
                                            ...lv,
                                            rows: lv.rows.map((row) =>
                                              row.id === r.id
                                                ? { ...row, active: e.target.checked }
                                                : e.target.checked
                                                  ? { ...row, active: false }
                                                  : row
                                            ),
                                          }
                                        : lv
                                    )
                                  )
                                }
                                className="rounded border-white/20"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                <button type="button" className="rounded-lg bg-theme-green-action/90 p-1.5 text-white" title="Edit">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAffiliateLevels((prev) =>
                                      prev.map((lv, i) =>
                                        i === levelIdx
                                          ? { ...lv, rows: lv.rows.filter((row) => row.id !== r.id) }
                                          : lv
                                      )
                                    )
                                  }
                                  className="rounded-lg bg-[#E11D48] p-1.5 text-white"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </>
          ) : (
            <>
              {/* Normal Users panels keep existing Point Collection / Bonus / Ranking */}
          <section className="admin-card overflow-visible p-0">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">Point Collection</h2>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={activatePoints}
                    onChange={(e) => setActivatePoints(e.target.checked)}
                    className="rounded border-white/20"
                  />
                  Activate Amount
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextId = String(Math.max(...pointRows.map((r) => Number(r.id)), 0) + 1);
                    setPointRows((prev) => [
                      {
                        id: nextId,
                        adminId: "1",
                        calAmount: "1",
                        changedDate: new Date().toISOString().slice(0, 19).replace("T", " "),
                        active: false,
                      },
                      ...prev,
                    ]);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Amount
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Admin ID</th>
                    <th className="px-4 py-3">Cal Amount</th>
                    <th className="px-4 py-3">Changed Date</th>
                    <th className="px-4 py-3">Set as Active</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pointRows.map((r) => (
                    <tr key={r.id} className="border-t border-white/10 text-slate-300">
                      <td className="px-4 py-3 font-medium text-white">{r.id}</td>
                      <td className="px-4 py-3">{r.adminId}</td>
                      <td className="px-4 py-3">
                        <input
                          value={r.calAmount}
                          onChange={(e) =>
                            setPointRows((prev) =>
                              prev.map((row) => (row.id === r.id ? { ...row, calAmount: e.target.value } : row))
                            )
                          }
                          className="w-20 rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-sm text-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-400">{r.changedDate}</td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={r.active}
                          onChange={(e) =>
                            setPointRows((prev) =>
                              prev.map((row) =>
                                row.id === r.id
                                  ? { ...row, active: e.target.checked }
                                  : e.target.checked
                                    ? { ...row, active: false }
                                    : row
                              )
                            )
                          }
                          className="rounded border-white/20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button type="button" className="rounded-lg bg-theme-green-action/90 p-1.5 text-white" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPointRows((prev) => prev.filter((row) => row.id !== r.id))}
                            className="rounded-lg bg-[#E11D48] p-1.5 text-white"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bonus */}
          <section className="admin-card overflow-visible p-0">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">Bonus</h2>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={activateBonus}
                    onChange={(e) => setActivateBonus(e.target.checked)}
                    className="rounded border-white/20"
                  />
                  Activate Amount
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextId = String(Math.max(...bonusRows.map((r) => Number(r.id)), 0) + 1);
                    setBonusRows((prev) => [
                      {
                        id: nextId,
                        adminId: "1",
                        bonusAmount: "5",
                        changedDate: new Date().toISOString().slice(0, 19).replace("T", " "),
                        active: false,
                      },
                      ...prev,
                    ]);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Amount
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Admin ID</th>
                    <th className="px-4 py-3">Bonus Amount</th>
                    <th className="px-4 py-3">Changed Date</th>
                    <th className="px-4 py-3">Set as Active</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bonusRows.map((r) => (
                    <tr key={r.id} className="border-t border-white/10 text-slate-300">
                      <td className="px-4 py-3 font-medium text-white">{r.id}</td>
                      <td className="px-4 py-3">{r.adminId}</td>
                      <td className="px-4 py-3">
                        <input
                          value={r.bonusAmount}
                          onChange={(e) =>
                            setBonusRows((prev) =>
                              prev.map((row) => (row.id === r.id ? { ...row, bonusAmount: e.target.value } : row))
                            )
                          }
                          className="w-24 rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-sm text-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-400">{r.changedDate}</td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={r.active}
                          onChange={(e) =>
                            setBonusRows((prev) =>
                              prev.map((row) =>
                                row.id === r.id
                                  ? { ...row, active: e.target.checked }
                                  : e.target.checked
                                    ? { ...row, active: false }
                                    : row
                              )
                            )
                          }
                          className="rounded border-white/20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button type="button" className="rounded-lg bg-theme-green-action/90 p-1.5 text-white" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setBonusRows((prev) => prev.filter((row) => row.id !== r.id))}
                            className="rounded-lg bg-[#E11D48] p-1.5 text-white"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* User Ranking */}
          <section className="admin-card overflow-visible p-0">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">User Ranking</h2>
                <p className="mt-0.5 text-xs text-slate-400">12-month evaluation · {audience}</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
              >
                <Mail className="h-3.5 w-3.5" />
                Send Email
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={rankSelectAll}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRankSelectAll(checked);
                          setRanking((prev) => prev.map((u) => ({ ...u, selected: checked })));
                        }}
                        className="rounded border-white/20"
                      />
                    </th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Points</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((u) => (
                    <tr key={u.id} className="border-t border-white/10 text-slate-300 hover:bg-admin-teal/[0.05]">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={!!u.selected}
                          onChange={(e) =>
                            setRanking((prev) =>
                              prev.map((row) => (row.id === u.id ? { ...row, selected: e.target.checked } : row))
                            )
                          }
                          className="rounded border-white/20"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{u.id}</td>
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3 font-semibold text-[#FBBF24]">{u.points}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            u.tier === "VVIP"
                              ? "bg-[#236B6B]/20 text-[#C084FC]"
                              : u.tier === "VIP"
                                ? "bg-admin-teal/20 text-admin-teal"
                                : "bg-white/10 text-slate-400"
                          }`}
                        >
                          {u.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
            </>
          )}
        </div>
      ) : (
        <section className="admin-card overflow-visible p-0">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-white sm:text-2xl">{pageTitle}</h1>
                <p className="mt-0.5 text-xs text-slate-400">
                  {filtered.length} records
                  {tab === "bonus" && status === "Rejected"
                    ? " · reopen or re-approve rejected claims"
                    : tab === "vouchers"
                      ? " · approve gift vouchers · reject with reason"
                      : " · approve / reject with reason"}
                </p>
              </div>
              {tab === "vouchers" ? (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["Pending", "Pending"],
                    ["Claimed", "Claimed"],
                    ["Rejected", "Rejected"],
                  ].map(([label, value]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatus(value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        status === value
                          ? "bg-teal-600 text-white"
                          : "border border-white/10 text-slate-500 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-b border-white/10 bg-white/5 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              {/* Separate search bar — left */}
              <div className="min-w-0 flex-1">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Search
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={
                      tab === "vouchers"
                        ? "Search voucher token or amount…"
                        : "Search…"
                    }
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              {/* Horizontal filters — right */}
              <div className="min-w-0 flex-1">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Filter
                </span>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                  {tab === "vouchers" && (status === "Claimed" || status === "Rejected") ? null : (
                    <FilterField label="Status" className="min-w-[140px] flex-1">
                      <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                        {(tab === "bonus" || tab === "vouchers"
                          ? ["All", "Pending", "Claimed", "Rejected"]
                          : ["All", "Pending", "Completed", "Rejected"]
                        ).map((s) => (
                          <option key={s} value={s} className="bg-admin-surface">
                            {s === "All" ? "All Statuses" : s}
                          </option>
                        ))}
                      </select>
                    </FilterField>
                  )}
                  <FilterField label="From" className="min-w-[140px] flex-1">
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => {
                        setFrom(e.target.value);
                        setDuration("Custom");
                      }}
                      className={inputCls}
                    />
                  </FilterField>
                  <FilterField label="To" className="min-w-[140px] flex-1">
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => {
                        setTo(e.target.value);
                        setDuration("Custom");
                      }}
                      className={inputCls}
                    />
                  </FilterField>
                  <div className="flex shrink-0 gap-2 pb-0.5">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        setFrom("");
                        setTo("");
                        setDuration("Today");
                        if (!(tab === "vouchers" && (status === "Claimed" || status === "Rejected"))) {
                          setStatus("All");
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Showing {filtered.length} results</p>
          </div>

          <div className="overflow-x-auto">
            {tab === "orders" ? (
              <table className="min-w-[1100px] w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Trans ID</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">ID & Name</th>
                    <th className="px-3 py-3">Loyalty Points</th>
                    <th className="px-3 py-3">Withdraw Amt.</th>
                    <th className="px-3 py-3">Pay. Method</th>
                    <th className="px-3 py-3">Received Amt.</th>
                    <th className="px-3 py-3">Plat. ID / Email</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-white/10 text-slate-300 hover:bg-admin-teal/[0.05]">
                      <td className="px-3 py-3">
                        <CopyCell value={r.id} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.date} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={`${r.userId} ${r.customer}`} />
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#FBBF24]">{r.points}</td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.amount} sub={r.amountUsd} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.method} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.received} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.platform} sub={r.platformDetail || r.email} />
                      </td>
                      <td className="px-3 py-3">
                        {r.status === "Pending" ? (
                          <div className="flex gap-1">
                            <button type="button" onClick={() => setRejectId(r.id)} className="rounded-lg bg-[#E11D48] p-1.5 text-white" title="Reject">
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => approve(r.id)} className="rounded-lg bg-theme-green-action p-1.5 text-white" title="Approve">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : r.status === "Rejected" ? (
                          <div className="flex gap-1">
                            <button type="button" onClick={() => approve(r.id)} className="rounded-lg bg-theme-green-action p-1.5 text-white" title="Approve">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => reopen(r.id)} className="rounded-lg bg-amber-500/150 p-1.5 text-white" title="Reopen">
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill
                          status={r.status}
                          onClick={() => openDetail(r)}
                          title="View details and approve / reject"
                        />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-14 text-center text-slate-400">
                        No Results Found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : tab === "bonus" ? (
              <table className="min-w-[1150px] w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Trans ID</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">ID & Name</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Pay. Method</th>
                    <th className="px-3 py-3">Received Amt.</th>
                    <th className="px-3 py-3">Plat. ID / Email</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-white/10 text-slate-300 hover:bg-admin-teal/[0.05]">
                      <td className="px-3 py-3">
                        <CopyCell value={r.id} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.date} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={`${r.userId} ${r.customer}`} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.amount} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.method} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.received} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.platformId} sub={r.email} />
                      </td>
                      <td className="px-3 py-3">
                        {r.status === "Pending" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setRejectId(r.id)}
                              className="rounded-lg bg-[#E11D48] p-1.5 text-white"
                              title="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => approve(r.id)}
                              className="rounded-lg bg-theme-green-action p-1.5 text-white"
                              title="Approve"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : r.status === "Rejected" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => approve(r.id)}
                              className="rounded-lg bg-theme-green-action p-1.5 text-white"
                              title="Approve / claim"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => reopen(r.id)}
                              className="rounded-lg bg-amber-500/150 p-1.5 text-white"
                              title="Reopen as pending"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill
                          status={r.status}
                          onClick={() => openDetail(r)}
                          title="View details and approve / reject"
                        />
                        {r.rejectReason ? (
                          <p className="mt-1 max-w-[140px] truncate text-[10px] text-rose-300" title={r.rejectReason}>
                            {r.rejectReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{r.admin || "—"}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-14 text-center text-slate-400">
                        No Results Found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : tab === "vouchers" && status === "Rejected" ? (
              <table className="min-w-[1200px] w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Voucher ID</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">ID & Name</th>
                    <th className="px-3 py-3">Platform ID</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Payment Method</th>
                    <th className="px-3 py-3">Voucher Token</th>
                    <th className="px-3 py-3">Rejection Reason</th>
                    <th className="px-3 py-3">Rejected Date</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-white/10 text-slate-300 hover:bg-admin-teal/[0.05]">
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(r)}
                          className="text-left"
                          title="View details"
                        >
                          <CopyCell value={r.id} />
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.date} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={`${r.userId} ${r.customer}`} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.platformId || "—"} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.amount} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.method || r.platform} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.token || "—"} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.rejectReason || "N/A"} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.rejectedDate || "N/A"} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => approve(r.id)}
                            className="rounded-lg bg-theme-green-action p-1.5 text-white"
                            title="Approve / claim"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => reopen(r.id)}
                            className="rounded-lg bg-amber-500/150 p-1.5 text-white"
                            title="Reopen as pending"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-14 text-center text-slate-400">
                        No Results Found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : tab === "vouchers" && status === "Claimed" ? (
              <table className="min-w-[1200px] w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Voucher ID</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">ID & Name</th>
                    <th className="px-3 py-3">Platform ID</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Payment Method</th>
                    <th className="px-3 py-3">Voucher Token</th>
                    <th className="px-3 py-3">Claimed Date</th>
                    <th className="px-3 py-3">Claimed By</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-white/10 text-slate-300 hover:bg-admin-teal/[0.05]">
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(r)}
                          className="text-left"
                          title="View details"
                        >
                          <CopyCell value={r.id} />
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.date} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={`${r.userId} ${r.customer}`} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.platformId || "—"} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.amount} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.method || r.platform} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.token || "—"} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.claimedDate || r.date} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.claimedBy || r.admin || "—"} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-slate-400">
                        No Results Found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : tab === "vouchers" ? (
              <table className="min-w-[1100px] w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">ID & Name</th>
                    <th className="px-3 py-3">Plat. ID</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Platform</th>
                    <th className="px-3 py-3">Voucher / Token</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-white/10 text-slate-300 hover:bg-admin-teal/[0.05]">
                      <td className="px-3 py-3 font-medium text-slate-500">{r.id}</td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.date} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={`${r.userId} ${r.customer}`} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.platformId || "—"} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.amount} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.platform} />
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.token || "—"} />
                      </td>
                      <td className="px-3 py-3">
                        {r.status === "Pending" ? (
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
                              title="Approve / claim"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : r.status === "Rejected" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => approve(r.id)}
                              className="rounded-lg bg-theme-green-action p-1.5 text-white"
                              title="Approve"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => reopen(r.id)}
                              className="rounded-lg bg-amber-500/150 p-1.5 text-white"
                              title="Reopen"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill
                          status={r.status}
                          onClick={() => openDetail(r)}
                          title="View details and approve / reject"
                        />
                        {r.rejectReason ? (
                          <p className="mt-1 max-w-[120px] truncate text-[10px] text-rose-300">{r.rejectReason}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{r.admin || r.claimedBy || "—"}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-14 text-center text-slate-400">
                        No Results Found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : null}
          </div>
        </section>
      )}

      <RejectModal
        open={!!rejectId}
        title={
          tab === "bonus" ? "Reject bonus claim" : tab === "vouchers" ? "Reject voucher claim" : "Reject loyalty claim"
        }
        onClose={() => setRejectId(null)}
        onConfirm={(reason) => {
          rejectRecord(rejectId, reason);
          setRejectId(null);
        }}
      />

      <LoyaltyDetailModal
        open={!!detail}
        record={detail ? list.find((r) => r.id === detail.id) || detail : null}
        tab={tab === "management" ? "orders" : tab}
        onClose={() => setDetail(null)}
        onApprove={approve}
        onReject={rejectRecord}
        onReopen={reopen}
      />
    </div>
  );
}

export default function LoyaltyPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">Loading loyalty…</div>}>
      <LoyaltyContent />
    </Suspense>
  );
}
