"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocationSearchParams } from "@/lib/location-search";
import Breadcrumb from "@/components/admin/breadcrumb";
import RejectModal from "@/components/admin/reject-modal";
import DepositStatusConfirmModal from "@/components/admin/deposit-status-confirm-modal";
import RejectReasonPanel from "@/components/admin/reject-reason-panel";
import CopyCell, { FilterField, IdNameCell, PlatformIdCell, StatusPill, inputCls } from "@/components/admin/queue-ui";
import { fetchLoyaltyOrders, updateLoyaltyOrderStatus } from "@/lib/loyalty-orders";
import { fetchBonusClaims, updateBonusClaimStatus } from "@/lib/loyalty-bonus-claims";
import {
  completeVoucherClaim,
  fetchVoucherClaims,
  rejectVoucherClaim,
} from "@/lib/loyalty-voucher-claims";
import { notifyAdminNavCountsRefresh } from "@/lib/notifications";
import { useAdminPermissions } from "@/contexts/admin-permissions";
import { hasLoyaltyTabRead, hasLoyaltyTabUpdate, hasLoyaltyGiftsCatalogUpdate } from "@/lib/loyalty-permissions";
import LoyaltyManagementPanel from "@/components/admin/loyalty-management-panel";
import LoyaltyGiftPanel from "@/components/admin/loyalty-gift-panel";
import { VOUCHER_CLAIM_REJECT_REASONS } from "@/lib/voucher-reject-reasons";
import { Check, RefreshCw, Search, X } from "lucide-react";

const TABS = [
  { id: "orders", label: "Orders" },
  { id: "bonus", label: "Bonus Claims" },
  { id: "vouchers", label: "Voucher Claims" },
  { id: "management", label: "Loyalty Management" },
  { id: "gifts", label: "Gift" },
];

function DetailField({ label, children }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <dt className="mb-0.5 text-[11px] text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-white">{children}</dd>
    </div>
  );
}

function LoyaltyDetailModal({
  open,
  record,
  tab,
  onClose,
  onApprove,
  onReject,
  onReopen,
  onRequestReject,
  onRequestApprove,
  onRequestReopen,
  canMutate = true,
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const usesOrderConfirmFlow = tab === "orders" || tab === "bonus" || tab === "vouchers";

  useEffect(() => {
    if (!open) setRejectOpen(false);
  }, [open, record?.id]);

  if (!open || !record) return null;

  const title =
    tab === "bonus" ? "Bonus claim details" : tab === "vouchers" ? "Voucher claim details" : "Loyalty order details";
  // Pending: approve + reject · Rejected: approve + reopen · Claimed/Completed: reject + reopen
  const canApprove =
    canMutate &&
    (tab === "vouchers" ? record.status === "Pending" : record.status === "Pending" || record.status === "Rejected");
  const canReject =
    canMutate &&
    (tab === "vouchers"
      ? record.status === "Pending"
      : record.status === "Pending" || record.status === "Completed" || record.status === "Claimed");
  const canReopen =
    canMutate &&
    (tab === "vouchers"
      ? false
      : record.status === "Rejected" || record.status === "Completed" || record.status === "Claimed");

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
              <IdNameCell id={record.userId} name={record.customer} />
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
                <DetailField label="Plat. ID / Email">
                  <PlatformIdCell
                    method={record.method}
                    platformId={record.platformId}
                    platformName={record.platformName}
                    platform={record.platform}
                    platformDetail={record.platformDetail}
                  />
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
          {record.rejectReason && tab !== "orders" ? (
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
                    ? "Rejected — approve again or reopen as pending."
                    : record.status === "Completed" || record.status === "Claimed"
                      ? "Claimed — reject or reopen as pending if needed."
                      : "Already processed."}
              </p>
            </div>
            <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
              {canReject ? (
                <button
                  type="button"
                  onClick={() => {
                    if (usesOrderConfirmFlow) {
                      onRequestReject?.(record.id);
                      onClose?.();
                      return;
                    }
                    setRejectOpen((v) => !v);
                  }}
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
                    if (usesOrderConfirmFlow) {
                      onRequestApprove?.(record.id);
                      onClose?.();
                      return;
                    }
                    onApprove?.(record.id);
                    onClose?.();
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
              ) : null}
              {canReopen ? (
                <button
                  type="button"
                  onClick={() => {
                    if (usesOrderConfirmFlow) {
                      onRequestReopen?.(record.id);
                      onClose?.();
                      return;
                    }
                    onReopen?.(record.id);
                    onClose?.();
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reopen
                </button>
              ) : null}
            </div>
          </div>
          {rejectOpen && !usesOrderConfirmFlow ? (
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
  const params = useLocationSearchParams();
  const permissions = useAdminPermissions();
  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasLoyaltyTabRead(permissions, t.id)),
    [permissions],
  );
  const [tab, setTab] = useState(params.get("tab") || "orders");
  const [status, setStatus] = useState(params.get("status") || "Pending");
  const [q, setQ] = useState("");
  const [duration, setDuration] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState("20");
  const [ordersPagination, setOrdersPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
    per_page: 20,
  });
  const [orderStatusBusy, setOrderStatusBusy] = useState(false);
  const [orderActionError, setOrderActionError] = useState("");
  const [appliedOrderFilters, setAppliedOrderFilters] = useState({
    status: params.get("status") || "Pending",
    keyword: "",
    duration: "",
    from: "",
    to: "",
  });
  const [bonuses, setBonuses] = useState([]);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusError, setBonusError] = useState("");
  const [bonusPage, setBonusPage] = useState(1);
  const [bonusPerPage, setBonusPerPage] = useState("20");
  const [bonusPagination, setBonusPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
    per_page: 20,
  });
  const [bonusStatusBusy, setBonusStatusBusy] = useState(false);
  const [bonusActionError, setBonusActionError] = useState("");
  const [appliedBonusFilters, setAppliedBonusFilters] = useState({
    status: params.get("status") || "Pending",
    keyword: "",
    duration: "",
    from: "",
    to: "",
  });
  const [vouchers, setVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [voucherPage, setVoucherPage] = useState(1);
  const [voucherPerPage, setVoucherPerPage] = useState("20");
  const [voucherPagination, setVoucherPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
    per_page: 20,
  });
  const [voucherStatusBusy, setVoucherStatusBusy] = useState(false);
  const [voucherActionError, setVoucherActionError] = useState("");
  const [appliedVoucherFilters, setAppliedVoucherFilters] = useState({
    status: params.get("status") || "Pending",
    keyword: "",
    duration: "",
    from: "",
    to: "",
  });
  const [rejectId, setRejectId] = useState(null);
  const [approveConfirmId, setApproveConfirmId] = useState(null);
  const [reopenConfirmId, setReopenConfirmId] = useState(null);
  const [detail, setDetail] = useState(null);
  const canUpdateTab = hasLoyaltyTabUpdate(permissions, tab);

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!hasLoyaltyTabRead(permissions, tab)) {
      setTab(visibleTabs[0].id);
      setStatus(visibleTabs[0].id === "management" || visibleTabs[0].id === "gifts" ? "All" : "Pending");
    }
  }, [permissions, tab, visibleTabs]);

  useEffect(() => {
    const nextTab = params.get("tab") || "orders";
    setTab(nextTab);
    setStatus(params.get("status") || (nextTab === "management" || nextTab === "gifts" ? "All" : "Pending"));
  }, [params]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const data = await fetchLoyaltyOrders({
        status: appliedOrderFilters.status,
        page: ordersPage,
        perPage: Number(ordersPerPage) || 20,
        keyword: appliedOrderFilters.keyword,
        duration: appliedOrderFilters.duration,
        from: appliedOrderFilters.from,
        to: appliedOrderFilters.to,
      });
      setOrders(data.orders || []);
      setOrdersPagination(
        data.pagination || {
          page: 1,
          total_pages: 1,
          total: 0,
          per_page: 20,
        },
      );
    } catch (err) {
      setOrdersError(err.message || "Failed to load loyalty orders.");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [appliedOrderFilters, ordersPage, ordersPerPage]);

  const loadBonusClaims = useCallback(async () => {
    setBonusLoading(true);
    setBonusError("");
    try {
      const data = await fetchBonusClaims({
        status: appliedBonusFilters.status,
        page: bonusPage,
        perPage: Number(bonusPerPage) || 20,
        keyword: appliedBonusFilters.keyword,
        duration: appliedBonusFilters.duration,
        from: appliedBonusFilters.from,
        to: appliedBonusFilters.to,
      });
      setBonuses(data.claims || []);
      setBonusPagination(
        data.pagination || {
          page: 1,
          total_pages: 1,
          total: 0,
          per_page: 20,
        },
      );
    } catch (err) {
      setBonusError(err.message || "Failed to load bonus claims.");
      setBonuses([]);
    } finally {
      setBonusLoading(false);
    }
  }, [appliedBonusFilters, bonusPage, bonusPerPage]);

  const loadVoucherClaims = useCallback(async () => {
    setVoucherLoading(true);
    setVoucherError("");
    try {
      const data = await fetchVoucherClaims({
        status: appliedVoucherFilters.status,
        page: voucherPage,
        perPage: Number(voucherPerPage) || 20,
        keyword: appliedVoucherFilters.keyword,
        duration: appliedVoucherFilters.duration,
        from: appliedVoucherFilters.from,
        to: appliedVoucherFilters.to,
      });
      setVouchers(data.claims || []);
      setVoucherPagination(
        data.pagination || {
          page: 1,
          total_pages: 1,
          total: 0,
          per_page: 20,
        },
      );
    } catch (err) {
      setVoucherError(err.message || "Failed to load voucher claims.");
      setVouchers([]);
    } finally {
      setVoucherLoading(false);
    }
  }, [appliedVoucherFilters, voucherPage, voucherPerPage]);

  const ordersRangeStart =
    ordersPagination.total === 0 ? 0 : (ordersPagination.page - 1) * ordersPagination.per_page + 1;
  const ordersRangeEnd = Math.min(ordersPagination.page * ordersPagination.per_page, ordersPagination.total);
  const bonusRangeStart =
    bonusPagination.total === 0 ? 0 : (bonusPagination.page - 1) * bonusPagination.per_page + 1;
  const bonusRangeEnd = Math.min(bonusPagination.page * bonusPagination.per_page, bonusPagination.total);
  const voucherRangeStart =
    voucherPagination.total === 0 ? 0 : (voucherPagination.page - 1) * voucherPagination.per_page + 1;
  const voucherRangeEnd = Math.min(voucherPagination.page * voucherPagination.per_page, voucherPagination.total);
  const rejectOrderRecord = useMemo(() => {
    if (!rejectId || tab !== "orders") return null;
    return orders.find((r) => r.id === rejectId) ?? null;
  }, [rejectId, tab, orders]);
  const rejectBonusRecord = useMemo(() => {
    if (!rejectId || tab !== "bonus") return null;
    return bonuses.find((r) => r.id === rejectId) ?? null;
  }, [rejectId, tab, bonuses]);
  const approveOrderRecord = useMemo(() => {
    if (!approveConfirmId || tab !== "orders") return null;
    return orders.find((r) => r.id === approveConfirmId) ?? null;
  }, [approveConfirmId, tab, orders]);
  const approveBonusRecord = useMemo(() => {
    if (!approveConfirmId || tab !== "bonus") return null;
    return bonuses.find((r) => r.id === approveConfirmId) ?? null;
  }, [approveConfirmId, tab, bonuses]);
  const reopenOrderRecord = useMemo(() => {
    if (!reopenConfirmId || tab !== "orders") return null;
    return orders.find((r) => r.id === reopenConfirmId) ?? null;
  }, [reopenConfirmId, tab, orders]);
  const reopenBonusRecord = useMemo(() => {
    if (!reopenConfirmId || tab !== "bonus") return null;
    return bonuses.find((r) => r.id === reopenConfirmId) ?? null;
  }, [reopenConfirmId, tab, bonuses]);
  const approveVoucherRecord = useMemo(() => {
    if (!approveConfirmId || tab !== "vouchers") return null;
    return vouchers.find((r) => r.id === approveConfirmId) ?? null;
  }, [approveConfirmId, tab, vouchers]);
  const rejectVoucherRecord = useMemo(() => {
    if (!rejectId || tab !== "vouchers") return null;
    return vouchers.find((r) => r.id === rejectId) ?? null;
  }, [rejectId, tab, vouchers]);

  useEffect(() => {
    if (tab !== "orders") return undefined;
    loadOrders();
    return undefined;
  }, [tab, loadOrders]);

  useEffect(() => {
    if (tab !== "bonus") return undefined;
    loadBonusClaims();
    return undefined;
  }, [tab, loadBonusClaims]);

  useEffect(() => {
    if (tab !== "vouchers") return undefined;
    loadVoucherClaims();
    return undefined;
  }, [tab, loadVoucherClaims]);

  useEffect(() => {
    if (tab !== "orders") return undefined;
    setOrdersPage(1);
    setAppliedOrderFilters((prev) => {
      if (prev.status === status) return prev;
      return { ...prev, status };
    });
    return undefined;
  }, [status, tab]);

  useEffect(() => {
    if (tab !== "bonus") return undefined;
    setBonusPage(1);
    setAppliedBonusFilters((prev) => {
      if (prev.status === status) return prev;
      return { ...prev, status };
    });
    return undefined;
  }, [status, tab]);

  useEffect(() => {
    if (tab !== "vouchers") return undefined;
    setVoucherPage(1);
    setAppliedVoucherFilters((prev) => {
      if (prev.status === status) return prev;
      return { ...prev, status };
    });
    return undefined;
  }, [status, tab]);

  const list = tab === "bonus" ? bonuses : tab === "vouchers" ? vouchers : orders;

  const filtered = useMemo(() => {
    if (tab === "management") return [];
    if (tab === "gifts") return [];
    if (tab === "orders" || tab === "bonus" || tab === "vouchers") return list;
    return list.filter((r) => {
      if (status !== "All" && r.status !== status && !(status === "Pending" && String(r.status).includes("Pending"))) {
        return false;
      }
      if (!q.trim()) return true;
      return JSON.stringify(r).toLowerCase().includes(q.toLowerCase());
    });
  }, [list, status, q, tab, orders]);

  const ordersRecordCount =
    tab === "orders"
      ? ordersPagination.total
      : tab === "bonus"
        ? bonusPagination.total
        : tab === "vouchers"
          ? voucherPagination.total
          : filtered.length;

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
          : tab === "gifts"
            ? "Gift Management"
          : "Loyalty Management";

  async function handleOrderStatusUpdate(id, nextStatus) {
    setOrderStatusBusy(true);
    setOrderActionError("");
    try {
      await updateLoyaltyOrderStatus({ transactionId: id, status: nextStatus });
      await loadOrders();
      if (detail?.id === id) {
        setDetail(null);
      }
      setApproveConfirmId(null);
      setReopenConfirmId(null);
      setRejectId(null);
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setOrderActionError(err.message || "Failed to update loyalty order status.");
    } finally {
      setOrderStatusBusy(false);
    }
  }

  async function handleBonusStatusUpdate(id, nextStatus) {
    setBonusStatusBusy(true);
    setBonusActionError("");
    try {
      await updateBonusClaimStatus({ transactionId: id, status: nextStatus });
      await loadBonusClaims();
      if (detail?.id === id) {
        setDetail(null);
      }
      setApproveConfirmId(null);
      setReopenConfirmId(null);
      setRejectId(null);
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setBonusActionError(err.message || "Failed to update bonus claim status.");
    } finally {
      setBonusStatusBusy(false);
    }
  }

  async function handleVoucherComplete(id) {
    setVoucherStatusBusy(true);
    setVoucherActionError("");
    try {
      await completeVoucherClaim({ voucherId: id });
      await loadVoucherClaims();
      if (detail?.id === id) {
        setDetail(null);
      }
      setApproveConfirmId(null);
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setVoucherActionError(err.message || "Failed to complete voucher claim.");
    } finally {
      setVoucherStatusBusy(false);
    }
  }

  async function handleVoucherReject(id, reason) {
    setVoucherStatusBusy(true);
    setVoucherActionError("");
    try {
      await rejectVoucherClaim({ voucherId: id, rejectionReason: reason });
      await loadVoucherClaims();
      if (detail?.id === id) {
        setDetail(null);
      }
      setRejectId(null);
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setVoucherActionError(err.message || "Failed to reject voucher claim.");
    } finally {
      setVoucherStatusBusy(false);
    }
  }

  function approve(id) {
    if (tab === "orders") {
      handleOrderStatusUpdate(id, "Completed");
      return;
    }
    if (tab === "bonus") {
      handleBonusStatusUpdate(id, "Claimed");
      return;
    }
    if (tab === "vouchers") {
      handleVoucherComplete(id);
    }
  }

  function rejectRecord(id, reason) {
    if (tab === "orders") {
      handleOrderStatusUpdate(id, "Rejected");
      return;
    }
    if (tab === "bonus") {
      handleBonusStatusUpdate(id, "Rejected");
      return;
    }
    if (tab === "vouchers") {
      handleVoucherReject(id, reason);
    }
  }

  function openDetail(r) {
    setDetail(r);
  }

  function reopen(id) {
    if (tab === "orders") {
      handleOrderStatusUpdate(id, "Pending");
      return;
    }
    if (tab === "bonus") {
      handleBonusStatusUpdate(id, "Pending");
    }
  }

  function applyOrderFilters() {
    setOrdersPage(1);
    setAppliedOrderFilters({
      status,
      keyword: q,
      duration,
      from,
      to,
    });
  }

  function applyBonusFilters() {
    setBonusPage(1);
    setAppliedBonusFilters({
      status,
      keyword: q,
      duration,
      from,
      to,
    });
  }

  function applyVoucherFilters() {
    setVoucherPage(1);
    setAppliedVoucherFilters({
      status,
      keyword: q,
      duration,
      from,
      to,
    });
  }

  function handleOrderFilterKeyDown(event) {
    if (event.key !== "Enter") return;
    if (event.target instanceof HTMLButtonElement) return;
    if (tab === "orders") {
      event.preventDefault();
      applyOrderFilters();
      return;
    }
    if (tab === "bonus") {
      event.preventDefault();
      applyBonusFilters();
      return;
    }
    if (tab === "vouchers") {
      event.preventDefault();
      applyVoucherFilters();
    }
  }

  function resetOrderFilters() {
    setQ("");
    setFrom("");
    setTo("");
    setDuration("");
    setStatus("Pending");
    setOrdersPage(1);
    setAppliedOrderFilters({
                status: "Pending",
      keyword: "",
      duration: "",
      from: "",
      to: "",
    });
  }

  function resetBonusFilters() {
    setQ("");
    setFrom("");
    setTo("");
    setDuration("");
    setStatus("Pending");
    setBonusPage(1);
    setAppliedBonusFilters({
      status: "Pending",
      keyword: "",
      duration: "",
      from: "",
      to: "",
    });
  }

  function resetVoucherFilters() {
    setQ("");
    setFrom("");
    setTo("");
    setDuration("");
    setStatus("Pending");
    setVoucherPage(1);
    setAppliedVoucherFilters({
      status: "Pending",
      keyword: "",
      duration: "",
      from: "",
      to: "",
    });
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Loyalty", href: "/loyalty" }, { label: pageTitle }]} />

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-admin-chrome-deep/80 p-1">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setStatus(t.id === "management" || t.id === "gifts" ? "All" : "Pending");
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
        <LoyaltyManagementPanel canMutate={canUpdateTab} />
      ) : tab === "gifts" ? (
        <LoyaltyGiftPanel
          canMutateClaims={canUpdateTab}
          canMutateCatalog={hasLoyaltyGiftsCatalogUpdate(permissions)}
        />
      ) : (
        <section className="admin-card overflow-visible p-0">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-white sm:text-2xl">{pageTitle}</h1>
                <p className="mt-0.5 text-xs text-slate-400">
                  {ordersRecordCount} records
                  {tab === "bonus" && status === "Rejected"
                    ? " · reopen or re-approve rejected claims"
                    : tab === "bonus" && status === "Claimed"
                      ? " · reject or reopen claimed bonuses"
                    : tab === "vouchers"
                      ? " · approve gift vouchers · reject with reason"
                      : " · approve / reject"}
                </p>
              </div>
              {(tab === "orders" || tab === "bonus" || tab === "vouchers") ? (
                <div className="flex flex-wrap gap-1.5">
                  {(tab === "orders"
                    ? [
                        ["Pending", "Pending"],
                        ["Completed", "Completed"],
                        ["Rejected", "Rejected"],
                      ]
                    : [
                    ["Pending", "Pending"],
                    ["Claimed", "Claimed"],
                    ["Rejected", "Rejected"],
                      ]
                  ).map(([label, value]) => (
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

          <div className="border-b border-white/10 bg-white/5 px-5 py-4" onKeyDown={handleOrderFilterKeyDown}>
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
                        ? "Search platform ID, token, account…"
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
                      onClick={() => {
                        if (tab === "orders") {
                          applyOrderFilters();
                          return;
                        }
                        if (tab === "bonus") {
                          applyBonusFilters();
                          return;
                        }
                        if (tab === "vouchers") {
                          applyVoucherFilters();
                        }
                      }}
                      disabled={
                        (tab === "orders" && ordersLoading) ||
                        (tab === "bonus" && bonusLoading) ||
                        (tab === "vouchers" && voucherLoading)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (tab === "orders") {
                          resetOrderFilters();
                          return;
                        }
                        if (tab === "bonus") {
                          resetBonusFilters();
                          return;
                        }
                        if (tab === "vouchers") {
                          resetVoucherFilters();
                          return;
                        }
                        setQ("");
                        setFrom("");
                        setTo("");
                        setDuration("");
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
            <p className="mt-3 text-xs text-slate-500">
              {tab === "orders"
                ? ordersPagination.total === 0
                  ? "Showing 0 results"
                  : `Showing ${ordersRangeStart}–${ordersRangeEnd} of ${ordersPagination.total} results`
                : tab === "bonus"
                  ? bonusPagination.total === 0
                    ? "Showing 0 results"
                    : `Showing ${bonusRangeStart}–${bonusRangeEnd} of ${bonusPagination.total} results`
                  : tab === "vouchers"
                    ? voucherPagination.total === 0
                      ? "Showing 0 results"
                      : `Showing ${voucherRangeStart}–${voucherRangeEnd} of ${voucherPagination.total} results`
                  : `Showing ${filtered.length} results`}
            </p>
            {tab === "orders" && ordersError ? (
              <p className="mt-2 text-xs text-rose-400">{ordersError}</p>
            ) : null}
            {tab === "orders" && orderActionError && !approveConfirmId && !reopenConfirmId && !rejectId ? (
              <p className="mt-2 text-xs text-rose-400">{orderActionError}</p>
            ) : null}
            {tab === "bonus" && bonusError ? (
              <p className="mt-2 text-xs text-rose-400">{bonusError}</p>
            ) : null}
            {tab === "bonus" && bonusActionError && !approveConfirmId && !reopenConfirmId && !rejectId ? (
              <p className="mt-2 text-xs text-rose-400">{bonusActionError}</p>
            ) : null}
            {tab === "vouchers" && voucherError ? (
              <p className="mt-2 text-xs text-rose-400">{voucherError}</p>
            ) : null}
            {tab === "vouchers" && voucherActionError && !approveConfirmId && !rejectId ? (
              <p className="mt-2 text-xs text-rose-400">{voucherActionError}</p>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            {tab === "vouchers" && voucherLoading ? (
              <div className="px-4 py-14 text-center text-slate-400">Loading voucher claims…</div>
            ) : tab === "orders" && ordersLoading ? (
              <div className="px-4 py-14 text-center text-slate-400">Loading loyalty orders…</div>
            ) : tab === "orders" ? (
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
                        <IdNameCell id={r.userId} name={r.customer} />
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
                        <PlatformIdCell
                          method={r.method}
                          platformId={r.platformId}
                          platformName={r.platformName}
                          platform={r.platform}
                          platformDetail={r.platformDetail}
                        />
                      </td>
                      <td className="px-3 py-3">
                        {r.status === "Pending" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={orderStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setRejectId(r.id);
                              }}
                              className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={orderStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setApproveConfirmId(r.id);
                              }}
                              className="rounded-lg bg-theme-green-action p-1.5 text-white disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : r.status === "Rejected" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={orderStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setApproveConfirmId(r.id);
                              }}
                              className="rounded-lg bg-theme-green-action p-1.5 text-white disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={orderStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setReopenConfirmId(r.id);
                              }}
                              className="rounded-lg bg-[#D1900F] p-1.5 text-white disabled:opacity-50"
                              title="Reopen"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : r.status === "Completed" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={orderStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setRejectId(r.id);
                              }}
                              className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={orderStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setReopenConfirmId(r.id);
                              }}
                              className="rounded-lg bg-[#D1900F] p-1.5 text-white disabled:opacity-50"
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
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-14 text-center text-slate-400">
                        No Results Found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : tab === "bonus" && bonusLoading ? (
              <div className="px-4 py-14 text-center text-slate-400">Loading bonus claims…</div>
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
                        <IdNameCell id={r.userId} name={r.customer} />
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
                        <PlatformIdCell
                          method={r.method}
                          platformId={r.platformId}
                          platformName={r.platformName}
                          platform={r.platform}
                          platformDetail={r.platformDetail}
                        />
                      </td>
                      <td className="px-3 py-3">
                        {r.status === "Pending" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={bonusStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setRejectId(r.id);
                              }}
                              className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={bonusStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setApproveConfirmId(r.id);
                              }}
                              className="rounded-lg bg-theme-green-action p-1.5 text-white disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : r.status === "Rejected" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={bonusStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setApproveConfirmId(r.id);
                              }}
                              className="rounded-lg bg-theme-green-action p-1.5 text-white disabled:opacity-50"
                              title="Approve / claim"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={bonusStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setReopenConfirmId(r.id);
                              }}
                              className="rounded-lg bg-[#D1900F] p-1.5 text-white disabled:opacity-50"
                              title="Reopen as pending"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : r.status === "Claimed" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={bonusStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setRejectId(r.id);
                              }}
                              className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={bonusStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setReopenConfirmId(r.id);
                              }}
                              className="rounded-lg bg-[#D1900F] p-1.5 text-white disabled:opacity-50"
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
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{r.admin || "—"}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-14 text-center text-slate-400">
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
                    <th className="px-3 py-3">Rejected By</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-white/10 text-slate-300 hover:bg-admin-teal/[0.05]">
                      <td className="px-3 py-3">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => openDetail(r)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openDetail(r);
                            }
                          }}
                          className="cursor-pointer text-left"
                          title="View details"
                        >
                          <CopyCell value={r.id} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.date} />
                      </td>
                      <td className="px-3 py-3">
                        <IdNameCell id={r.userId} name={r.customer} />
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
                      <td className="px-3 py-3 text-xs text-slate-400">{r.admin || "—"}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-14 text-center text-slate-400">
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
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => openDetail(r)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openDetail(r);
                            }
                          }}
                          className="cursor-pointer text-left"
                          title="View details"
                        >
                          <CopyCell value={r.id} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <CopyCell value={r.date} />
                      </td>
                      <td className="px-3 py-3">
                        <IdNameCell id={r.userId} name={r.customer} />
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
              <table className="min-w-[1200px] w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">ID & Name</th>
                    <th className="px-3 py-3">Plat. ID</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Platform</th>
                    <th className="px-3 py-3">Voucher / Token</th>
                    <th className="px-3 py-3">Duplicates</th>
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
                        <IdNameCell id={r.userId} name={r.customer} />
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
                        {r.duplicates?.is_daily_duplicate || r.duplicates?.is_monthly_duplicate ? (
                          <span
                            className="inline-flex rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300"
                            title={
                              r.duplicates?.is_daily_duplicate
                                ? `${r.duplicates.daily_count} duplicates today`
                                : `${r.duplicates.monthly_count} duplicates in 30 days`
                            }
                          >
                            {r.duplicates?.is_daily_duplicate
                              ? `${r.duplicates.daily_count} today`
                              : `${r.duplicates.monthly_count} / 30d`}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {r.status === "Pending" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={voucherStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setRejectId(r.id);
                              }}
                              className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={voucherStatusBusy || !canUpdateTab}
                              onClick={() => {
                                if (!canUpdateTab) return;
                                setApproveConfirmId(r.id);
                              }}
                              className="rounded-lg bg-theme-green-action p-1.5 text-white shadow-sm disabled:opacity-50"
                              title="Approve / claim"
                            >
                              <Check className="h-3.5 w-3.5" />
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
                      <td colSpan={11} className="px-4 py-14 text-center text-slate-400">
                        No Results Found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : null}
          </div>

          {tab === "orders" ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
              <p className="text-xs text-slate-500">
                {ordersPagination.total === 0
                  ? "No records"
                  : `Showing ${ordersRangeStart}–${ordersRangeEnd} of ${ordersPagination.total}`}
                {ordersPagination.total_pages > 1
                  ? ` · Page ${ordersPagination.page} of ${ordersPagination.total_pages}`
                  : null}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                  Per page
                  <select
                    value={ordersPerPage}
                    onChange={(e) => {
                      setOrdersPerPage(e.target.value);
                      setOrdersPage(1);
                    }}
                    disabled={ordersLoading}
                    className="rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-xs text-white disabled:opacity-50"
                  >
                    {["10", "20", "25", "50"].map((n) => (
                      <option key={n} value={n} className="bg-admin-surface">
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                {ordersPagination.total_pages > 1 ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={ordersPagination.page <= 1 || ordersLoading}
                      onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                      className="admin-btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={ordersPagination.page >= ordersPagination.total_pages || ordersLoading}
                      onClick={() => setOrdersPage((p) => p + 1)}
                      className="admin-btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : tab === "bonus" ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
              <p className="text-xs text-slate-500">
                {bonusPagination.total === 0
                  ? "No records"
                  : `Showing ${bonusRangeStart}–${bonusRangeEnd} of ${bonusPagination.total}`}
                {bonusPagination.total_pages > 1
                  ? ` · Page ${bonusPagination.page} of ${bonusPagination.total_pages}`
                  : null}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                  Per page
                  <select
                    value={bonusPerPage}
                    onChange={(e) => {
                      setBonusPerPage(e.target.value);
                      setBonusPage(1);
                    }}
                    disabled={bonusLoading}
                    className="rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-xs text-white disabled:opacity-50"
                  >
                    {["10", "20", "25", "50"].map((n) => (
                      <option key={n} value={n} className="bg-admin-surface">
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                {bonusPagination.total_pages > 1 ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={bonusPagination.page <= 1 || bonusLoading}
                      onClick={() => setBonusPage((p) => Math.max(1, p - 1))}
                      className="admin-btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={bonusPagination.page >= bonusPagination.total_pages || bonusLoading}
                      onClick={() => setBonusPage((p) => p + 1)}
                      className="admin-btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : tab === "vouchers" ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
              <p className="text-xs text-slate-500">
                {voucherPagination.total === 0
                  ? "No records"
                  : `Showing ${voucherRangeStart}–${voucherRangeEnd} of ${voucherPagination.total}`}
                {voucherPagination.total_pages > 1
                  ? ` · Page ${voucherPagination.page} of ${voucherPagination.total_pages}`
                  : null}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                  Per page
                  <select
                    value={voucherPerPage}
                    onChange={(e) => {
                      setVoucherPerPage(e.target.value);
                      setVoucherPage(1);
                    }}
                    disabled={voucherLoading}
                    className="rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-xs text-white disabled:opacity-50"
                  >
                    {["10", "20", "25", "50"].map((n) => (
                      <option key={n} value={n} className="bg-admin-surface">
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                {voucherPagination.total_pages > 1 ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={voucherPagination.page <= 1 || voucherLoading}
                      onClick={() => setVoucherPage((p) => Math.max(1, p - 1))}
                      className="admin-btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={voucherPagination.page >= voucherPagination.total_pages || voucherLoading}
                      onClick={() => setVoucherPage((p) => p + 1)}
                      className="admin-btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <DepositStatusConfirmModal
        open={Boolean(approveConfirmId) && (tab === "orders" || tab === "bonus" || tab === "vouchers")}
        title="Set as Approved?"
        message={
          approveOrderRecord
            ? `${approveOrderRecord.id} · ${approveOrderRecord.customer}`
            : approveBonusRecord
              ? `${approveBonusRecord.id} · ${approveBonusRecord.customer}`
              : approveVoucherRecord
                ? `${approveVoucherRecord.id} · ${approveVoucherRecord.customer}`
                : undefined
        }
        confirmLabel="Yes"
        confirmClassName="bg-theme-green-action"
        busy={
          tab === "orders" ? orderStatusBusy : tab === "bonus" ? bonusStatusBusy : voucherStatusBusy
        }
        error={
          tab === "orders" ? orderActionError : tab === "bonus" ? bonusActionError : voucherActionError
        }
        onCancel={() => {
          setApproveConfirmId(null);
          setOrderActionError("");
          setBonusActionError("");
          setVoucherActionError("");
        }}
        onConfirm={() => approve(approveConfirmId)}
      />

      <DepositStatusConfirmModal
        open={Boolean(reopenConfirmId) && (tab === "orders" || tab === "bonus")}
        title="Set as Pending?"
        message={
          reopenOrderRecord
            ? `${reopenOrderRecord.id} · ${reopenOrderRecord.customer}`
            : reopenBonusRecord
              ? `${reopenBonusRecord.id} · ${reopenBonusRecord.customer}`
              : undefined
        }
        confirmLabel="Yes"
        confirmClassName="bg-[#D1900F]"
        busy={tab === "orders" ? orderStatusBusy : bonusStatusBusy}
        error={tab === "orders" ? orderActionError : bonusActionError}
        onCancel={() => {
          setReopenConfirmId(null);
          setOrderActionError("");
          setBonusActionError("");
        }}
        onConfirm={() => reopen(reopenConfirmId)}
      />

      <DepositStatusConfirmModal
        open={Boolean(rejectId) && (tab === "orders" || tab === "bonus")}
        title="Set as Rejected?"
        message={
          rejectOrderRecord
            ? `${rejectOrderRecord.id} · ${rejectOrderRecord.customer}`
            : rejectBonusRecord
              ? `${rejectBonusRecord.id} · ${rejectBonusRecord.customer}`
              : undefined
        }
        confirmLabel="Yes"
        confirmClassName="bg-[#E11D48]"
        busy={tab === "orders" ? orderStatusBusy : bonusStatusBusy}
        error={tab === "orders" ? orderActionError : bonusActionError}
        onCancel={() => {
          setRejectId(null);
          setOrderActionError("");
          setBonusActionError("");
        }}
        onConfirm={() => rejectRecord(rejectId)}
      />

      <RejectModal
        open={Boolean(rejectId) && tab === "vouchers"}
        title="Reject voucher claim"
        reasons={VOUCHER_CLAIM_REJECT_REASONS}
        error={voucherActionError}
        busy={voucherStatusBusy}
        onClose={() => {
          setRejectId(null);
          setVoucherActionError("");
        }}
        onConfirm={(reason) => rejectRecord(rejectId, reason)}
      />

      <LoyaltyDetailModal
        open={!!detail}
        record={detail ? list.find((r) => r.id === detail.id) || detail : null}
        tab={tab === "management" ? "orders" : tab}
        onClose={() => setDetail(null)}
        onApprove={approve}
        onReject={rejectRecord}
        onReopen={reopen}
        onRequestReject={setRejectId}
        onRequestApprove={setApproveConfirmId}
        onRequestReopen={setReopenConfirmId}
        canMutate={canUpdateTab}
      />
    </div>
  );
}

export default function LoyaltyPage() {
  return <LoyaltyContent />;
}
