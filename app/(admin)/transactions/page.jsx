"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import RejectReasonPanel from "@/components/admin/reject-reason-panel";
import DepositProofStatusPanel from "@/components/admin/deposit-proof-status-panel";
import DepositStatusConfirmModal from "@/components/admin/deposit-status-confirm-modal";
import CopyCell, { FilterField, StatusPill, inputCls } from "@/components/admin/queue-ui";
import AssignDepositsModal from "@/components/admin/assign-deposits-modal";
import AssignWithdrawalsModal from "@/components/admin/assign-withdrawals-modal";
import { EmailSendModal, SmsSendModal } from "@/components/admin/customer-message-modals";
import { formatDateTimeParts } from "@/lib/sl-time";
import { sendCustomerEmail, sendCustomerSms } from "@/lib/customers";
import { notifyAdminNavCountsRefresh } from "@/lib/notifications";
import {
  buildDepositQueryParams,
  downloadDepositsExport,
  fetchDepositProofBlob,
  fetchDeposits,
  getDefaultAdvancedSearchIn,
  hasAdvancedDepositFilters,
  mapDurationToFilter,
  resolveStatusFromUrl,
  resolveTransactionListStatus,
  updateDepositStatus,
  validateDepositCustomDate,
} from "@/lib/deposits";
import {
  buildWithdrawalQueryParams,
  downloadWithdrawalsExport,
  fetchWithdrawalProofBlob,
  fetchWithdrawals,
  fetchSimilarWithdrawals,
  hasAdvancedWithdrawalFilters,
  updateWithdrawalStatus,
  validateWithdrawalCustomDate,
} from "@/lib/withdrawals";
import { getAdminUser } from "@/lib/auth";
import { useCan } from "@/contexts/admin-permissions";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Clock3,
  Eye,
  FileImage,
  FileText,
  Info,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";

const ASSIGNEES = ["sacl", "withdraw.ex", "deposit.ex", "Authorizer", "admin"];
const DURATION_OPTIONS = [
  "Today",
  "Yesterday",
  "This Week",
  "This Month",
  "Last 6 Months",
  "Current Year",
  "Last Year",
  "Custom",
];

function mapFilterToDuration(filter) {
  const map = {
    today: "Today",
    yesterday: "Yesterday",
    last7days: "This Week",
    lastmonth: "This Month",
    last6months: "Last 6 Months",
    currentyear: "Current Year",
    lastyear: "Last Year",
    customdate: "Custom",
  };
  return map[filter] || "Today";
}

const PREVIEW_LIMIT = 10;

function normalizeQueryString(qs) {
  const parsed = new URLSearchParams(qs);
  return [...parsed.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function createDefaultTabFilters() {
  return {
    status: "Pending",
    q: "",
    duration: "Today",
    from: "",
    to: "",
    txId: "",
    platformId: "",
    userAccount: "",
    advancedSearchIn: "Completed",
  };
}

function parseTabFiltersFromSearchParams(urlParams) {
  const urlStatus = urlParams.get("status") || "Pending";
  const urlSearchIn = urlParams.get("search_in");
  const duration = mapFilterToDuration(urlParams.get("filter") || "today");
  const from = urlParams.get("from_date") || "";
  const to = urlParams.get("to_date") || "";
  const txId = urlParams.get("t_id") || "";
  const platformId = urlParams.get("p_acc") || "";
  const userAccount = urlParams.get("u_acc") || "";
  const filterValues = {
    duration,
    from,
    to,
    transactionId: txId,
    platformId,
    userAccount,
  };
  const advancedSearchIn = getDefaultAdvancedSearchIn(urlStatus, urlSearchIn);
  const status = resolveStatusFromUrl(urlStatus, urlSearchIn, filterValues);
  const promotedFromUrl = status !== urlStatus;
  const q = promotedFromUrl && urlStatus === "Pending" ? "" : urlParams.get("keyword") || "";
  return { status, q, duration, from, to, txId, platformId, userAccount, advancedSearchIn };
}

function formatDateParts(value) {
  const { date, time } = formatDateTimeParts(value);
  return { date, time };
}

function DateTimeCell({ value }) {
  const { date, time } = formatDateParts(value);
  return (
    <div className="flex items-start gap-1.5">
      <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0 space-y-0.5">
        <CopyCell value={date} />
        {time ? <CopyCell value={time} /> : null}
      </div>
    </div>
  );
}

function IdNameCell({ id, name }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <CopyCell value={id || "—"} />
      {name ? <CopyCell value={name} /> : null}
    </div>
  );
}

function formatDepositRejectedReason(record) {
  const message = record?.rejectReasonMessage?.trim() || "Custom reason Not Added";
  const category = record?.rejectReasonCategory?.trim() || "Reason Not Added";
  return `${message} | ${category}`;
}

function transactionRowClassName(record) {
  return record?.isScammer
    ? "border-t border-rose-500/25 bg-rose-500/10 text-slate-200 transition hover:bg-rose-500/15"
    : "border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]";
}

function PlatformIdCell({ value, isScammer }) {
  return (
    <div className="min-w-0">
      <CopyCell value={value} />
      {isScammer ? (
        <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-rose-300">
          <Info className="h-3 w-3" />
          Scammer
        </p>
      ) : null}
    </div>
  );
}

function getSubmittedProofs(record) {
  if (!record?.proof && !record?.proofUrl) return [];
  const amount = record.clientPay || record.cashoutAmt || record.amount;
  const base = {
    uploadedAt: record.date,
    method: record.method,
    amount,
    account: record.account,
    customer: record.customer,
  };
  if (record.proofUrl) {
    return [
      {
        id: `${record.id}-proof`,
        name: record.proofFileName || `payment_proof_${String(record.id).slice(-6)}`,
        kind: "Payment proof",
        size: "—",
        url: record.proofUrl,
        proofKey: record.proofFileName || null,
        ...base,
      },
    ];
  }
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

function ProofImageCard({ proof, file, fetchProofBlob }) {
  const amount = file?.amount || proof.clientPay || proof.cashoutAmt || proof.amount;
  const method = file?.method || proof.method;
  const account = file?.account || proof.account;
  const uploadedAt = file?.uploadedAt || proof.date;
  const name = file?.name || `payment_slip_${String(proof.id).slice(-6)}.jpg`;
  const proofKey = file?.proofKey || proof.proofFileName || null;
  const directUrl = !proofKey ? file?.url || proof.proofUrl : null;
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(Boolean(proofKey));
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!proofKey) {
      setPreviewUrl(directUrl || "");
      setLoading(false);
      setLoadError(false);
      return undefined;
    }

    let cancelled = false;
    let objectUrl = "";

    setLoading(true);
    setLoadError(false);
    setPreviewUrl("");

    (fetchProofBlob || fetchDepositProofBlob)(proofKey)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setPreviewUrl("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proofKey, directUrl, fetchProofBlob]);

  if (loading) {
    return (
      <div className="flex h-48 w-full max-w-sm items-center justify-center rounded-lg border border-slate-300/30 bg-[#f8fafc] text-sm text-slate-500">
        Loading proof image…
      </div>
    );
  }

  if (previewUrl && !loadError) {
    return (
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-slate-300/30 bg-[#f8fafc] text-slate-800 shadow-lg">
        <img src={previewUrl} alt={name} className="max-h-[420px] w-full object-contain bg-black/5" />
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">{method}</p>
          <p className="mt-1">{amount}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-slate-300/30 bg-[#f8fafc] p-4 text-slate-800 shadow-lg">
      {loadError ? (
        <p className="mb-3 rounded bg-amber-50 px-2 py-1.5 text-[11px] font-medium text-amber-800">
          Could not load the proof image. Check that deposit files are available on storage or Laravel/S3.
        </p>
      ) : null}
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
function ProofImageLightbox({ open, proof, file, onClose, fetchProofBlob }) {
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
        <ProofImageCard proof={proof} file={file} fetchProofBlob={fetchProofBlob} />
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

function SubmittedProofViewer({ proof, proofs, activeId, onOpenImage, fetchProofBlob }) {
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
          <ProofImageCard proof={proof} file={active} fetchProofBlob={fetchProofBlob} />
        </button>
      </div>

      <ProofSummaryFields proof={proof} />
    </div>
  );
}

function TransactionsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canUpdateDeposits = useCan("status_update_deposit_data");
  const canUpdateWithdrawals = useCan("status_update_withdrawal_data");
  const [currentAdminKey, setCurrentAdminKey] = useState("admin");
  const [tab, setTab] = useState(params.get("tab") === "withdrawals" ? "withdrawals" : "deposits");
  const [depositFilters, setDepositFilters] = useState(() =>
    params.get("tab") === "withdrawals"
      ? createDefaultTabFilters()
      : parseTabFiltersFromSearchParams(params),
  );
  const [withdrawalFilters, setWithdrawalFilters] = useState(() =>
    params.get("tab") === "withdrawals"
      ? parseTabFiltersFromSearchParams(params)
      : createDefaultTabFilters(),
  );
  const [filterError, setFilterError] = useState("");
  const [perPage, setPerPage] = useState(params.get("per_page") || "10");
  const [selected, setSelected] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [depositsError, setDepositsError] = useState("");
  const [withdrawalsError, setWithdrawalsError] = useState("");
  const [depositTotals, setDepositTotals] = useState({ totalDepositAmount: 0, totalPaymentAmount: 0 });
  const [withdrawalTotals, setWithdrawalTotals] = useState({
    totalCashoutAmount: 0,
    totalReceivingAmount: 0,
  });
  const [depositPagination, setDepositPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 10,
    has_prev: false,
    has_next: false,
  });
  const [withdrawalPagination, setWithdrawalPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 10,
    has_prev: false,
    has_next: false,
  });
  const [depositPage, setDepositPage] = useState(Math.max(1, Number(params.get("page")) || 1));
  const [withdrawalPage, setWithdrawalPage] = useState(Math.max(1, Number(params.get("page")) || 1));
  const [rejectId, setRejectId] = useState(null);
  const [pendingConfirmId, setPendingConfirmId] = useState(null);
  const [approveConfirmId, setApproveConfirmId] = useState(null);
  const [statusActionBusy, setStatusActionBusy] = useState(false);
  const [proofSaving, setProofSaving] = useState(false);
  const [proof, setProof] = useState(null);
  const [similarWithdrawals, setSimilarWithdrawals] = useState([]);
  const [similarWithdrawalsLoading, setSimilarWithdrawalsLoading] = useState(false);
  const [activeProofId, setActiveProofId] = useState(null);
  const [imageLightbox, setImageLightbox] = useState(null);
  const proofBodyRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [depositIsAdmin, setDepositIsAdmin] = useState(false);
  const [withdrawalIsAdmin, setWithdrawalIsAdmin] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [emailCompose, setEmailCompose] = useState({ receivers: "", subject: "", body: "", attachment: null, templateId: null });
  const [smsCompose, setSmsCompose] = useState({ receivers: "", message: "", templateId: null });
  const [contactTemplateVariables, setContactTemplateVariables] = useState({});
  const [emailSending, setEmailSending] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [emailSendError, setEmailSendError] = useState("");
  const [smsSendError, setSmsSendError] = useState("");
  const [actionError, setActionError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [livePulse, setLivePulse] = useState(0);
  const skipUrlHydrationRef = useRef(false);
  const skipAutoLoadRef = useRef(false);
  const skipInitialAutoLoadRef = useRef(true);
  const loadDepositsRef = useRef(null);
  const loadWithdrawalsRef = useRef(null);
  const buildDepositUrlQueryRef = useRef(null);
  const buildWithdrawalUrlQueryRef = useRef(null);
  const routerRef = useRef(null);
  const pathnameRef = useRef(null);
  const tabRef = useRef(tab);
  const searchParamsString = params.toString();
  tabRef.current = tab;

  const filters = tab === "deposits" ? depositFilters : withdrawalFilters;
  const {
    status,
    q,
    duration,
    from,
    to,
    txId,
    platformId,
    userAccount,
    advancedSearchIn,
  } = filters;

  const patchActiveFilters = useCallback(
    (patch) => {
      if (tab === "deposits") {
        setDepositFilters((prev) => ({ ...prev, ...patch }));
      } else {
        setWithdrawalFilters((prev) => ({ ...prev, ...patch }));
      }
    },
    [tab],
  );

  const setStatus = (value) => {
    if (tab === "deposits") {
      setDepositFilters((prev) => ({
        ...prev,
        status: typeof value === "function" ? value(prev.status) : value,
      }));
    } else {
      setWithdrawalFilters((prev) => ({
        ...prev,
        status: typeof value === "function" ? value(prev.status) : value,
      }));
    }
  };
  const setQ = (value) => patchActiveFilters({ q: value });
  const setDuration = (value) => patchActiveFilters({ duration: value });
  const setFrom = (value) => patchActiveFilters({ from: value });
  const setTo = (value) => patchActiveFilters({ to: value });
  const setTxId = (value) => patchActiveFilters({ txId: value });
  const setPlatformId = (value) => patchActiveFilters({ platformId: value });
  const setUserAccount = (value) => patchActiveFilters({ userAccount: value });
  const setAdvancedSearchIn = (value) => patchActiveFilters({ advancedSearchIn: value });

  const advancedFiltersActive =
    tab === "withdrawals"
      ? hasAdvancedWithdrawalFilters({
          duration,
          from,
          to,
          transactionId: txId,
          platformId,
          userAccount,
        })
      : hasAdvancedDepositFilters({
          duration,
          from,
          to,
          transactionId: txId,
          platformId,
          userAccount,
        });

  const activeListPage = tab === "deposits" ? depositPage : withdrawalPage;
  const setActiveListPage = tab === "deposits" ? setDepositPage : setWithdrawalPage;

  const resolvedDepositStatus = useMemo(() => {
    return status === "All" ? "All" : status;
  }, [status]);

  const buildDepositUrlQuery = useCallback(
    (overrides = {}) => {
      const pageStatus = overrides.status ?? depositFilters.status;
      const nextKeyword = overrides.keyword ?? depositFilters.q;
      const nextPage = String(overrides.page ?? depositPage);
      const nextPerPage = String(overrides.perPage ?? perPage);
      const nextDuration = overrides.duration ?? depositFilters.duration;
      const nextFrom = overrides.from ?? depositFilters.from;
      const nextTo = overrides.to ?? depositFilters.to;
      const nextTxId = overrides.txId ?? depositFilters.txId;
      const nextPlatformId = overrides.platformId ?? depositFilters.platformId;
      const nextUserAccount = overrides.userAccount ?? depositFilters.userAccount;
      const nextAdvancedSearchIn = overrides.advancedSearchIn ?? depositFilters.advancedSearchIn;

      const advancedActive = hasAdvancedDepositFilters({
        duration: nextDuration,
        from: nextFrom,
        to: nextTo,
        transactionId: nextTxId,
        platformId: nextPlatformId,
        userAccount: nextUserAccount,
      });

      const resolvedStatus = resolveTransactionListStatus({
        status: pageStatus,
        advancedSearchIn: nextAdvancedSearchIn,
        duration: nextDuration,
        from: nextFrom,
        to: nextTo,
        transactionId: nextTxId,
        platformId: nextPlatformId,
        userAccount: nextUserAccount,
      });

      const next = new URLSearchParams();
      next.set("tab", "deposits");
      next.set("status", resolvedStatus);
      next.set("page", nextPage);
      next.set("per_page", nextPerPage);

      if (nextKeyword.trim()) next.set("keyword", nextKeyword.trim());

      const keywordOnlyWithinStatus =
        nextKeyword.trim() &&
        !advancedActive &&
        (resolvedStatus === "Pending" ||
          resolvedStatus === "Completed" ||
          resolvedStatus === "Rejected");

      const defaultScopedList =
        !nextKeyword.trim() &&
        !advancedActive &&
        (resolvedStatus === "Completed" || resolvedStatus === "Rejected");

      if (advancedActive) {
        const filterValue =
          mapDurationToFilter(nextDuration) || (nextDuration === "Today" ? "today" : "");
        if (filterValue) next.set("filter", filterValue);
        if (nextDuration === "Custom" && nextFrom) next.set("from_date", nextFrom);
        if (nextDuration === "Custom" && nextTo) next.set("to_date", nextTo);
        if (nextTxId.trim()) next.set("t_id", nextTxId.trim());
        if (nextPlatformId.trim()) next.set("p_acc", nextPlatformId.trim());
        if (nextUserAccount.trim()) next.set("u_acc", nextUserAccount.trim());
      } else if (defaultScopedList) {
        const filterValue =
          mapDurationToFilter(nextDuration) || (nextDuration === "Today" ? "today" : "");
        if (filterValue) next.set("filter", filterValue);
        if (nextDuration === "Custom" && nextFrom) next.set("from_date", nextFrom);
        if (nextDuration === "Custom" && nextTo) next.set("to_date", nextTo);
      } else if (!keywordOnlyWithinStatus && resolvedStatus === "Pending" && !advancedActive) {
        // Pending default list — no extra query params.
      }

      return next.toString();
    },
    [depositFilters, depositPage, perPage],
  );

  const syncDepositUrl = useCallback(
    (overrides = {}) => {
      if (tab !== "deposits") return;
      const qs = buildDepositUrlQuery(overrides);
      if (normalizeQueryString(qs) === normalizeQueryString(searchParamsString)) return;
      skipUrlHydrationRef.current = true;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [tab, buildDepositUrlQuery, searchParamsString, router, pathname],
  );

  const buildWithdrawalUrlQuery = useCallback(
    (overrides = {}) => {
      const pageStatus = overrides.status ?? withdrawalFilters.status;
      const nextKeyword = overrides.keyword ?? withdrawalFilters.q;
      const nextPage = String(overrides.page ?? withdrawalPage);
      const nextPerPage = String(overrides.perPage ?? perPage);
      const nextDuration = overrides.duration ?? withdrawalFilters.duration;
      const nextFrom = overrides.from ?? withdrawalFilters.from;
      const nextTo = overrides.to ?? withdrawalFilters.to;
      const nextTxId = overrides.txId ?? withdrawalFilters.txId;
      const nextPlatformId = overrides.platformId ?? withdrawalFilters.platformId;
      const nextUserAccount = overrides.userAccount ?? withdrawalFilters.userAccount;
      const nextAdvancedSearchIn = overrides.advancedSearchIn ?? withdrawalFilters.advancedSearchIn;

      const advancedActive = hasAdvancedWithdrawalFilters({
        duration: nextDuration,
        from: nextFrom,
        to: nextTo,
        transactionId: nextTxId,
        platformId: nextPlatformId,
        userAccount: nextUserAccount,
      });

      const resolvedStatus = resolveTransactionListStatus({
        status: pageStatus,
        advancedSearchIn: nextAdvancedSearchIn,
        duration: nextDuration,
        from: nextFrom,
        to: nextTo,
        transactionId: nextTxId,
        platformId: nextPlatformId,
        userAccount: nextUserAccount,
      });

      const next = new URLSearchParams();
      next.set("tab", "withdrawals");
      next.set("status", resolvedStatus);
      next.set("page", nextPage);
      next.set("per_page", nextPerPage);

      if (nextKeyword.trim()) next.set("keyword", nextKeyword.trim());

      const keywordOnlyWithinStatus =
        nextKeyword.trim() &&
        !advancedActive &&
        (resolvedStatus === "Pending" ||
          resolvedStatus === "Completed" ||
          resolvedStatus === "Rejected");

      const defaultScopedList =
        !nextKeyword.trim() &&
        !advancedActive &&
        (resolvedStatus === "Completed" || resolvedStatus === "Rejected");

      if (advancedActive) {
        const filterValue =
          mapDurationToFilter(nextDuration) || (nextDuration === "Today" ? "today" : "");
        if (filterValue) next.set("filter", filterValue);
        if (nextDuration === "Custom" && nextFrom) next.set("from_date", nextFrom);
        if (nextDuration === "Custom" && nextTo) next.set("to_date", nextTo);
        if (nextTxId.trim()) next.set("t_id", nextTxId.trim());
        if (nextPlatformId.trim()) next.set("p_acc", nextPlatformId.trim());
        if (nextUserAccount.trim()) next.set("u_acc", nextUserAccount.trim());
      } else if (defaultScopedList) {
        const filterValue =
          mapDurationToFilter(nextDuration) || (nextDuration === "Today" ? "today" : "");
        if (filterValue) next.set("filter", filterValue);
        if (nextDuration === "Custom" && nextFrom) next.set("from_date", nextFrom);
        if (nextDuration === "Custom" && nextTo) next.set("to_date", nextTo);
      }

      return next.toString();
    },
    [withdrawalFilters, withdrawalPage, perPage],
  );

  const syncWithdrawalUrl = useCallback(
    (overrides = {}) => {
      if (tab !== "withdrawals") return;
      const qs = buildWithdrawalUrlQuery(overrides);
      if (normalizeQueryString(qs) === normalizeQueryString(searchParamsString)) return;
      skipUrlHydrationRef.current = true;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [tab, buildWithdrawalUrlQuery, searchParamsString, router, pathname],
  );

  const loadDeposits = useCallback(async (overrides = {}) => {
    if (tabRef.current !== "deposits") return;
    const nextDuration = overrides.duration ?? depositFilters.duration;
    const nextFrom = overrides.from ?? depositFilters.from;
    const nextTo = overrides.to ?? depositFilters.to;
    const nextStatus = overrides.status ?? depositFilters.status;
    const nextPage = overrides.page ?? depositPage;
    const customDateError = validateDepositCustomDate(nextDuration, nextFrom, nextTo);
    if (customDateError) {
      setFilterError(customDateError);
      return;
    }
    setFilterError("");
    setDepositsLoading(true);
    setDepositsError("");
    try {
      const queryParams = buildDepositQueryParams({
        status: nextStatus,
        page: nextPage,
        perPage: overrides.perPage ?? perPage,
        keyword: overrides.keyword ?? depositFilters.q,
        duration: nextDuration,
        from: nextFrom,
        to: nextTo,
        transactionId: overrides.transactionId ?? depositFilters.txId,
        platformId: overrides.platformId ?? depositFilters.platformId,
        userAccount: overrides.userAccount ?? depositFilters.userAccount,
        advancedSearchIn: overrides.advancedSearchIn ?? depositFilters.advancedSearchIn,
      });
      const data = await fetchDeposits(queryParams);
      setDeposits(data.deposits || []);
      setDepositTotals(data.totals || { totalDepositAmount: 0, totalPaymentAmount: 0 });
      setDepositPagination(data.pagination || depositPagination);
      setDepositIsAdmin(Boolean(data.isAdmin));
    } catch (err) {
      setDepositsError(err.message || "Failed to load deposits.");
      setDeposits([]);
    } finally {
      setDepositsLoading(false);
    }
  }, [depositFilters, resolvedDepositStatus, depositPage, perPage]);

  const loadWithdrawals = useCallback(async (overrides = {}) => {
    if (tabRef.current !== "withdrawals") return;
    const nextDuration = overrides.duration ?? withdrawalFilters.duration;
    const nextFrom = overrides.from ?? withdrawalFilters.from;
    const nextTo = overrides.to ?? withdrawalFilters.to;
    const nextStatus = overrides.status ?? withdrawalFilters.status;
    const nextPage = overrides.page ?? withdrawalPage;
    const customDateError = validateWithdrawalCustomDate(nextDuration, nextFrom, nextTo);
    if (customDateError) {
      setFilterError(customDateError);
      return;
    }
    setFilterError("");
    setWithdrawalsLoading(true);
    setWithdrawalsError("");
    try {
      const queryParams = buildWithdrawalQueryParams({
        status: nextStatus,
        page: nextPage,
        perPage: overrides.perPage ?? perPage,
        keyword: overrides.keyword ?? withdrawalFilters.q,
        duration: nextDuration,
        from: nextFrom,
        to: nextTo,
        transactionId: overrides.transactionId ?? withdrawalFilters.txId,
        platformId: overrides.platformId ?? withdrawalFilters.platformId,
        userAccount: overrides.userAccount ?? withdrawalFilters.userAccount,
        advancedSearchIn: overrides.advancedSearchIn ?? withdrawalFilters.advancedSearchIn,
      });
      const data = await fetchWithdrawals(queryParams);
      setWithdrawals(data.withdrawals || []);
      setWithdrawalTotals(
        data.totals || { totalCashoutAmount: 0, totalReceivingAmount: 0 },
      );
      setWithdrawalPagination(data.pagination || withdrawalPagination);
      setWithdrawalIsAdmin(Boolean(data.isAdmin));
    } catch (err) {
      setWithdrawalsError(err.message || "Failed to load withdrawals.");
      setWithdrawals([]);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [withdrawalFilters, resolvedDepositStatus, withdrawalPage, perPage]);

  loadDepositsRef.current = loadDeposits;
  loadWithdrawalsRef.current = loadWithdrawals;
  buildDepositUrlQueryRef.current = buildDepositUrlQuery;
  buildWithdrawalUrlQueryRef.current = buildWithdrawalUrlQuery;
  routerRef.current = router;
  pathnameRef.current = pathname;

  useEffect(() => {
    const user = getAdminUser();
    setCurrentAdminKey(user?.name || user?.email || String(user?.id || "admin"));
  }, []);

  useEffect(() => {
    if (tab !== "deposits" || skipAutoLoadRef.current) return undefined;
    if (skipInitialAutoLoadRef.current) return undefined;
    const filterValues = {
      duration: depositFilters.duration,
      from: depositFilters.from,
      to: depositFilters.to,
      transactionId: depositFilters.txId,
      platformId: depositFilters.platformId,
      userAccount: depositFilters.userAccount,
    };
    const advancedActive = hasAdvancedDepositFilters(filterValues);
    const debounceMs = depositFilters.q.trim() || advancedActive ? 450 : 0;
    const timer = setTimeout(() => {
      const nextStatus = resolveTransactionListStatus({
        status: depositFilters.status,
        advancedSearchIn: depositFilters.advancedSearchIn,
        ...filterValues,
      });
      const promoted = nextStatus !== depositFilters.status;
      if (promoted) {
        setDepositFilters((prev) => ({
          ...prev,
          status: nextStatus,
          q: prev.q.trim() ? "" : prev.q,
        }));
        setDepositPage(1);
        skipUrlHydrationRef.current = true;
        const qs = buildDepositUrlQuery({
          status: nextStatus,
          keyword: "",
          page: 1,
          duration: depositFilters.duration,
          from: depositFilters.from,
          to: depositFilters.to,
          txId: depositFilters.txId,
          platformId: depositFilters.platformId,
          userAccount: depositFilters.userAccount,
          advancedSearchIn: depositFilters.advancedSearchIn,
        });
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
      loadDeposits({
        status: nextStatus,
        page: promoted ? 1 : depositPage,
        keyword: promoted ? "" : undefined,
      });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [
    tab,
    loadDeposits,
    depositFilters,
    depositPage,
    perPage,
    buildDepositUrlQuery,
    router,
    pathname,
  ]);

  useEffect(() => {
    if (tab !== "withdrawals" || skipAutoLoadRef.current) return undefined;
    if (skipInitialAutoLoadRef.current) return undefined;
    const filterValues = {
      duration: withdrawalFilters.duration,
      from: withdrawalFilters.from,
      to: withdrawalFilters.to,
      transactionId: withdrawalFilters.txId,
      platformId: withdrawalFilters.platformId,
      userAccount: withdrawalFilters.userAccount,
    };
    const advancedActive = hasAdvancedWithdrawalFilters(filterValues);
    const debounceMs = withdrawalFilters.q.trim() || advancedActive ? 450 : 0;
    const timer = setTimeout(() => {
      const nextStatus = resolveTransactionListStatus({
        status: withdrawalFilters.status,
        advancedSearchIn: withdrawalFilters.advancedSearchIn,
        ...filterValues,
      });
      const promoted = nextStatus !== withdrawalFilters.status;
      if (promoted) {
        setWithdrawalFilters((prev) => ({
          ...prev,
          status: nextStatus,
          q: prev.q.trim() ? "" : prev.q,
        }));
        setWithdrawalPage(1);
        skipUrlHydrationRef.current = true;
        const qs = buildWithdrawalUrlQuery({
          status: nextStatus,
          keyword: "",
          page: 1,
          duration: withdrawalFilters.duration,
          from: withdrawalFilters.from,
          to: withdrawalFilters.to,
          txId: withdrawalFilters.txId,
          platformId: withdrawalFilters.platformId,
          userAccount: withdrawalFilters.userAccount,
          advancedSearchIn: withdrawalFilters.advancedSearchIn,
        });
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
      loadWithdrawals({
        status: nextStatus,
        page: promoted ? 1 : withdrawalPage,
        keyword: promoted ? "" : undefined,
      });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [
    tab,
    loadWithdrawals,
    withdrawalFilters,
    withdrawalPage,
    perPage,
    buildWithdrawalUrlQuery,
    router,
    pathname,
  ]);

  useEffect(() => {
    if (tab !== "deposits") return undefined;
    const timer = setTimeout(() => {
      syncDepositUrl();
    }, depositFilters.q.trim() ? 450 : 0);
    return () => clearTimeout(timer);
  }, [tab, syncDepositUrl, depositFilters, depositPage, perPage, resolvedDepositStatus]);

  useEffect(() => {
    if (tab !== "withdrawals") return undefined;
    const timer = setTimeout(() => {
      syncWithdrawalUrl();
    }, withdrawalFilters.q.trim() ? 450 : 0);
    return () => clearTimeout(timer);
  }, [tab, syncWithdrawalUrl, withdrawalFilters, withdrawalPage, perPage, resolvedDepositStatus]);

  const runTransactionSearch = useCallback(
    (event) => {
      event?.preventDefault?.();
      const filterValues = {
        duration,
        from,
        to,
        transactionId: txId,
        platformId,
        userAccount,
      };
      const advancedActive =
        tab === "withdrawals"
          ? hasAdvancedWithdrawalFilters(filterValues)
          : hasAdvancedDepositFilters(filterValues);
      const fromAdvancedRow =
        event?.fromAdvancedRow === true ||
        event?.submitter?.dataset?.searchType === "advanced";
      const nextStatus =
        status === "Pending" && (fromAdvancedRow || advancedActive)
          ? advancedSearchIn
          : status;
      const clearKeyword = status === "Pending" && nextStatus !== "Pending";
      const nextKeyword = clearKeyword ? "" : q;

      const searchOverrides = {
        page: 1,
        status: nextStatus,
        keyword: nextKeyword || undefined,
        duration,
        from,
        to,
        transactionId: txId,
        platformId,
        userAccount,
        advancedSearchIn,
      };
      const syncOverrides = {
        page: 1,
        status: nextStatus,
        keyword: nextKeyword,
        duration,
        from,
        to,
        txId,
        platformId,
        userAccount,
        advancedSearchIn,
      };

      skipAutoLoadRef.current = true;

      if (tab === "deposits") {
        const customDateError = validateDepositCustomDate(duration, from, to);
        if (customDateError) {
          setFilterError(customDateError);
          skipAutoLoadRef.current = false;
          return;
        }
        setFilterError("");
        setDepositPage(1);
        if (clearKeyword) setQ("");
        setStatus(nextStatus);
        loadDeposits(searchOverrides).finally(() => {
          skipAutoLoadRef.current = false;
        });
        skipUrlHydrationRef.current = true;
        const qs = buildDepositUrlQuery(syncOverrides);
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        return;
      }

      if (tab === "withdrawals") {
        const customDateError = validateWithdrawalCustomDate(duration, from, to);
        if (customDateError) {
          setFilterError(customDateError);
          skipAutoLoadRef.current = false;
          return;
        }
        setFilterError("");
        setWithdrawalPage(1);
        if (clearKeyword) setQ("");
        setStatus(nextStatus);
        loadWithdrawals(searchOverrides).finally(() => {
          skipAutoLoadRef.current = false;
        });
        skipUrlHydrationRef.current = true;
        const qs = buildWithdrawalUrlQuery(syncOverrides);
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    },
    [
      tab,
      status,
      advancedSearchIn,
      duration,
      from,
      to,
      txId,
      platformId,
      userAccount,
      q,
      loadDeposits,
      loadWithdrawals,
      buildDepositUrlQuery,
      buildWithdrawalUrlQuery,
      router,
      pathname,
    ],
  );

  function handleAdvancedFilterKeyDown(event) {
    if (event.key !== "Enter") return;
    if (event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    runTransactionSearch({ preventDefault: () => {}, fromAdvancedRow: true });
  }

  useEffect(() => {
    if (skipUrlHydrationRef.current) {
      skipUrlHydrationRef.current = false;
      return;
    }

    const urlParams = new URLSearchParams(searchParamsString);
    const nextTab = urlParams.get("tab") === "withdrawals" ? "withdrawals" : "deposits";
    const parsedFilters = parseTabFiltersFromSearchParams(urlParams);
    const urlStatus = urlParams.get("status") || "Pending";
    const urlSearchIn = urlParams.get("search_in");
    const promotedFromUrl = parsedFilters.status !== urlStatus;
    const nextPerPage = urlParams.get("per_page") || "10";
    const nextPage = Math.max(1, Number(urlParams.get("page")) || 1);

    setTab(nextTab);
    if (nextTab === "deposits") {
      setDepositFilters(parsedFilters);
      setDepositPage(nextPage);
    } else {
      setWithdrawalFilters(parsedFilters);
      setWithdrawalPage(nextPage);
    }
    setPerPage(nextPerPage);
    setSelected([]);
    setViewAll(false);

    const loadOverrides = {
      status: parsedFilters.status,
      page: nextPage,
      perPage: nextPerPage,
      keyword: parsedFilters.q,
      duration: parsedFilters.duration,
      from: parsedFilters.from,
      to: parsedFilters.to,
      transactionId: parsedFilters.txId,
      platformId: parsedFilters.platformId,
      userAccount: parsedFilters.userAccount,
      advancedSearchIn: parsedFilters.advancedSearchIn,
    };

    if (promotedFromUrl || urlSearchIn) {
      skipUrlHydrationRef.current = true;
      const urlOverrides = {
        status: parsedFilters.status,
        keyword: parsedFilters.q,
        page: nextPage,
        perPage: nextPerPage,
        duration: parsedFilters.duration,
        from: parsedFilters.from,
        to: parsedFilters.to,
        txId: parsedFilters.txId,
        platformId: parsedFilters.platformId,
        userAccount: parsedFilters.userAccount,
        advancedSearchIn: parsedFilters.advancedSearchIn,
      };
      const qs =
        nextTab === "deposits"
          ? buildDepositUrlQueryRef.current(urlOverrides)
          : buildWithdrawalUrlQueryRef.current(urlOverrides);
      if (normalizeQueryString(qs) !== normalizeQueryString(searchParamsString)) {
        routerRef.current.replace(
          qs ? `${pathnameRef.current}?${qs}` : pathnameRef.current,
          { scroll: false },
        );
      }
    }

    skipAutoLoadRef.current = true;
    const loader =
      nextTab === "deposits"
        ? loadDepositsRef.current(loadOverrides)
        : loadWithdrawalsRef.current(loadOverrides);
    loader.finally(() => {
      skipAutoLoadRef.current = false;
      skipInitialAutoLoadRef.current = false;
    });
  }, [searchParamsString]);

  useEffect(() => {
    const id = setInterval(() => {
      setLivePulse((n) => n + 1);
    }, 12000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    if (tab === "deposits") return deposits;
    return withdrawals;
  }, [tab, deposits, withdrawals]);

  const pageSize = Number(perPage) || 10;
  const shown = filtered;
  const activePagination = tab === "deposits" ? depositPagination : withdrawalPagination;
  const listLoading = tab === "deposits" ? depositsLoading : withdrawalsLoading;
  const listError = tab === "deposits" ? depositsError : withdrawalsError;
  const activeProofFetcher = tab === "withdrawals" ? fetchWithdrawalProofBlob : fetchDepositProofBlob;

  const rejectRecord = useMemo(() => {
    if (!rejectId) return null;
    const rows = tab === "deposits" ? deposits : withdrawals;
    return rows.find((r) => r.id === rejectId) ?? null;
  }, [rejectId, tab, deposits, withdrawals]);

  const pendingConfirmRecord = useMemo(() => {
    if (!pendingConfirmId) return null;
    const rows = tab === "deposits" ? deposits : withdrawals;
    return rows.find((r) => r.id === pendingConfirmId) ?? null;
  }, [pendingConfirmId, tab, deposits, withdrawals]);

  const approveConfirmRecord = useMemo(() => {
    if (!approveConfirmId) return null;
    const rows = tab === "deposits" ? deposits : withdrawals;
    return rows.find((r) => r.id === approveConfirmId) ?? null;
  }, [approveConfirmId, tab, deposits, withdrawals]);

  function getRowActionMode(rowStatus) {
    if (resolvedDepositStatus === "All") return rowStatus;
    return resolvedDepositStatus;
  }

  function isLockedByOther(r) {
    return !!r.lockedBy && r.lockedBy !== currentAdminKey;
  }

  function claimRequest(id) {
    const setter = tab === "deposits" ? setDeposits : setWithdrawals;
    setter((prev) =>
      prev.map((r) =>
        r.id === id && !r.lockedBy
          ? { ...r, assigned: currentAdminKey, lockedBy: currentAdminKey }
          : r
      )
    );
  }

  const canMutateCurrentTab = tab === "deposits" ? canUpdateDeposits : canUpdateWithdrawals;

  const pendingRows =
    tab === "deposits"
      ? deposits.filter((r) => r.status === "Pending")
      : withdrawals.filter((r) => r.status === "Pending");
  const clientPayLkr =
    tab === "deposits" && resolvedDepositStatus === "Pending"
      ? depositTotals.totalPaymentAmount
      : tab === "withdrawals" && resolvedDepositStatus === "Pending"
        ? withdrawalTotals.totalReceivingAmount
        : pendingRows.reduce(
            (sum, r) => sum + (Number(r.clientPayLkr) || Number(r.clientPayUsd || 0) * 300),
            0,
          );
  const topUpTotal =
    tab === "deposits" && resolvedDepositStatus === "Pending"
      ? depositTotals.totalDepositAmount
      : tab === "withdrawals" && resolvedDepositStatus === "Pending"
        ? withdrawalTotals.totalCashoutAmount
        : tab === "withdrawals"
          ? pendingRows.reduce((sum, r) => sum + (Number(r.clientPayUsd) || 0), 0)
          : pendingRows.reduce(
              (sum, r) => sum + Number(String(r.deposited || r.amount).replace(/[^\d.]/g, "") || 0),
              0,
            );

  const title =
    resolvedDepositStatus === "Pending" || resolvedDepositStatus.includes("Pending")
      ? tab === "deposits"
        ? "Pending Deposits"
        : "Pending Withdrawals"
      : resolvedDepositStatus === "Completed"
        ? tab === "deposits"
          ? "Completed Deposits"
          : "Completed Withdrawals"
        : resolvedDepositStatus === "Rejected"
          ? tab === "deposits"
            ? "Rejected Deposits"
            : "Rejected Withdrawals"
          : tab === "deposits"
            ? "Deposits"
            : "Withdrawals";

  function openProof(r) {
    setProof(r);
    setActiveProofId(null);
    setRejectId(null);
    requestAnimationFrame(() => {
      proofBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
    if (tabRef.current === "withdrawals") {
      setSimilarWithdrawalsLoading(true);
      setSimilarWithdrawals([]);
      fetchSimilarWithdrawals({ transactionId: r.id, withdrawalId: r.withdrawalId })
        .then((data) => setSimilarWithdrawals(data.withdrawals || []))
        .catch(() => setSimilarWithdrawals([]))
        .finally(() => setSimilarWithdrawalsLoading(false));
    } else {
      setSimilarWithdrawals([]);
      setSimilarWithdrawalsLoading(false);
    }
  }

  function openSubmittedImage(record, file) {
    const proofs = getSubmittedProofs(record);
    const active = file || proofs[0] || null;
    setImageLightbox({ proof: record, file: active });
  }

  function closeProof() {
    setProof(null);
    setSimilarWithdrawals([]);
    setSimilarWithdrawalsLoading(false);
    setActiveProofId(null);
    setImageLightbox(null);
  }

  const selectedDepositRows = useMemo(
    () => deposits.filter((row) => selected.includes(row.id)),
    [deposits, selected],
  );
  const selectedDepositDbIds = useMemo(
    () => selectedDepositRows.map((row) => row.depositId).filter(Boolean),
    [selectedDepositRows],
  );
  const selectedWithdrawalRows = useMemo(
    () => withdrawals.filter((row) => selected.includes(row.id)),
    [withdrawals, selected],
  );
  const selectedWithdrawalDbIds = useMemo(
    () => selectedWithdrawalRows.map((row) => row.withdrawalId).filter(Boolean),
    [selectedWithdrawalRows],
  );

  function openEmailModal() {
    const rows = tab === "deposits" ? selectedDepositRows : selectedWithdrawalRows;
    const label = tab === "deposits" ? "deposits" : "withdrawals";
    const emails = [...new Set(rows.map((r) => r.customerEmail).filter(Boolean))];
    if (!emails.length) {
      setActionError(`Select ${label} with customer email addresses.`);
      return;
    }
    const first = rows[0];
    setActionError("");
    setEmailCompose({ receivers: emails.join(","), subject: "", body: "", attachment: null, templateId: null });
    setContactTemplateVariables({
      username: first?.customerName || "",
      first_name: first?.customerName?.split(" ")[0] || "",
      transaction_id: first?.transactionId || first?.id || "",
      amount: first?.amount || first?.paymentAmount || "",
      status: first?.status || "",
      platform: first?.platform || first?.method || "",
      account: first?.account || "",
    });
    setEmailSendError("");
    setEmailModalOpen(true);
  }

  function openSmsModal() {
    const rows = tab === "deposits" ? selectedDepositRows : selectedWithdrawalRows;
    const label = tab === "deposits" ? "deposits" : "withdrawals";
    const mobiles = [...new Set(rows.map((r) => r.customerMobile).filter(Boolean))];
    if (!mobiles.length) {
      setActionError(`Select ${label} with customer mobile numbers.`);
      return;
    }
    const first = rows[0];
    setActionError("");
    setSmsCompose({ receivers: mobiles.join(","), message: "", templateId: null });
    setContactTemplateVariables({
      username: first?.customerName || "",
      first_name: first?.customerName?.split(" ")[0] || "",
      transaction_id: first?.transactionId || first?.id || "",
      amount: first?.amount || first?.paymentAmount || "",
      status: first?.status || "",
      platform: first?.platform || first?.method || "",
      account: first?.account || "",
    });
    setSmsSendError("");
    setSmsModalOpen(true);
  }

  async function handleSendEmail() {
    setEmailSending(true);
    setEmailSendError("");
    try {
      await sendCustomerEmail({
        receivers: emailCompose.receivers,
        subject: emailCompose.subject,
        body: emailCompose.body,
        attachment: emailCompose.attachment,
        templateId: emailCompose.templateId,
        variables: contactTemplateVariables,
      });
      setEmailModalOpen(false);
    } catch (err) {
      setEmailSendError(err.message || "Failed to send email.");
    } finally {
      setEmailSending(false);
    }
  }

  async function handleSendSms() {
    setSmsSending(true);
    setSmsSendError("");
    try {
      await sendCustomerSms({
        mobileNumbers: smsCompose.receivers,
        message: smsCompose.message,
        templateId: smsCompose.templateId,
        variables: contactTemplateVariables,
      });
      setSmsModalOpen(false);
    } catch (err) {
      setSmsSendError(err.message || "Failed to send SMS.");
    } finally {
      setSmsSending(false);
    }
  }

  async function handleExportTransactions() {
    setExporting(true);
    setActionError("");
    try {
      const exportStatus =
        resolvedDepositStatus === "All" ? "Pending" : resolvedDepositStatus;
      const exportArgs = {
        status: exportStatus,
        filter: mapDurationToFilter(duration) || (duration === "Today" ? "today" : undefined),
        fromDate: duration === "Custom" ? from || undefined : undefined,
        toDate: duration === "Custom" ? to || undefined : undefined,
      };
      if (tab === "deposits") {
        await downloadDepositsExport(exportArgs);
      } else {
        await downloadWithdrawalsExport(exportArgs);
      }
    } catch (err) {
      setActionError(err.message || `Failed to export ${tab}.`);
    } finally {
      setExporting(false);
    }
  }

  async function pendingTransaction(id) {
    const rows = tab === "deposits" ? deposits : withdrawals;
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setStatusActionBusy(true);
    setActionError("");
    try {
      if (tab === "deposits") {
        await updateDepositStatus({ depositId: row.depositId, status: "Pending" });
      } else {
        await updateWithdrawalStatus({ withdrawalId: row.withdrawalId, status: "Pending" });
      }
      setPendingConfirmId(null);
      if (proof?.id === id) closeProof();
      if (tab === "deposits") await loadDeposits();
      else await loadWithdrawals();
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setActionError(err.message || "Failed to set transaction as pending.");
    } finally {
      setStatusActionBusy(false);
    }
  }

  async function saveProofStatus({ status, rejectedReason, rejectedReasonMessage }) {
    if (!proof) return;
    const rows = tab === "deposits" ? deposits : withdrawals;
    const row = rows.find((r) => r.id === proof.id);
    if (!row) return;
    setProofSaving(true);
    setActionError("");
    try {
      if (tab === "deposits") {
        await updateDepositStatus({
          depositId: row.depositId,
          status,
          rejectedReason,
          rejectedReasonMessage,
        });
      } else {
        await updateWithdrawalStatus({
          withdrawalId: row.withdrawalId,
          status,
          rejectedReason,
          rejectedReasonMessage,
        });
      }
      closeProof();
      if (tab === "deposits") await loadDeposits();
      else await loadWithdrawals();
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setActionError(err.message || "Failed to update transaction status.");
    } finally {
      setProofSaving(false);
    }
  }

  async function approveTransaction(id) {
    const rows = tab === "deposits" ? deposits : withdrawals;
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setActionError("");
    setStatusActionBusy(true);
    try {
      if (tab === "deposits") {
        await updateDepositStatus({ depositId: row.depositId, status: "Completed" });
      } else {
        await updateWithdrawalStatus({ withdrawalId: row.withdrawalId, status: "Completed" });
      }
      setApproveConfirmId(null);
      if (proof?.id === id) closeProof();
      if (tab === "deposits") await loadDeposits();
      else await loadWithdrawals();
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setActionError(err.message || "Failed to approve transaction.");
    } finally {
      setStatusActionBusy(false);
    }
  }

  async function rejectTransaction(reason, id) {
    const targetId = id ?? rejectId;
    if (!targetId) return;
    const rows = tab === "deposits" ? deposits : withdrawals;
    const row = rows.find((r) => r.id === targetId);
    if (!row) return;
    setActionError("");
    try {
      if (tab === "deposits") {
        await updateDepositStatus({
          depositId: row.depositId,
          status: "Rejected",
          rejectedReasonMessage: reason,
        });
      } else {
        await updateWithdrawalStatus({
          withdrawalId: row.withdrawalId,
          status: "Rejected",
          rejectedReasonMessage: reason,
        });
      }
      if (proof?.id === targetId) closeProof();
      setRejectId(null);
      if (tab === "deposits") await loadDeposits();
      else await loadWithdrawals();
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setActionError(err.message || "Failed to reject transaction.");
    }
  }

  function renderRowActions(r) {
    if (!canMutateCurrentTab) {
      return <span className="text-[11px] text-slate-500">—</span>;
    }

    if (isLockedByOther(r)) {
      return (
        <span
          className="cursor-not-allowed text-[11px] text-amber-300/90"
          title={`This request is locked by ${r.lockedBy}.`}
        >
          Locked
        </span>
      );
    }

    const actionMode = getRowActionMode(r.status);

    return (
      <div className="relative flex gap-1">
        {actionMode === "Pending" ? (
          <>
            <button
              type="button"
              onClick={() => toggleRowReject(r.id)}
              className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm"
              title="Reject"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setApproveConfirmId(r.id)}
              className="rounded-lg bg-theme-green-action p-1.5 text-white shadow-sm"
              title="Approve"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
        {actionMode === "Completed" ? (
          <>
            <button
              type="button"
              onClick={() => toggleRowReject(r.id)}
              className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm"
              title="Reject"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPendingConfirmId(r.id)}
              className="rounded-lg bg-[#D1900F] p-1.5 text-white shadow-sm"
              title="Set as pending"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
        {actionMode === "Rejected" ? (
          <>
            <button
              type="button"
              onClick={() => setApproveConfirmId(r.id)}
              className="rounded-lg bg-theme-green-action p-1.5 text-white shadow-sm"
              title="Approve"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPendingConfirmId(r.id)}
              className="rounded-lg bg-[#D1900F] p-1.5 text-white shadow-sm"
              title="Set as pending"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
      </div>
    );
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

  function goToPendingDeposits() {
    tabRef.current = "deposits";
    setTab("deposits");
    setDepositFilters(createDefaultTabFilters());
    setDepositPage(1);
    setSelected([]);
    skipUrlHydrationRef.current = true;
    skipAutoLoadRef.current = true;
    router.replace(`${pathname}?tab=deposits&status=Pending&page=1&per_page=${perPage}`, {
      scroll: false,
    });
    loadDeposits({ status: "Pending", page: 1, keyword: "" }).finally(() => {
      skipAutoLoadRef.current = false;
    });
  }

  function goToPendingWithdrawals() {
    tabRef.current = "withdrawals";
    setTab("withdrawals");
    setWithdrawalFilters(createDefaultTabFilters());
    setWithdrawalPage(1);
    setSelected([]);
    skipUrlHydrationRef.current = true;
    skipAutoLoadRef.current = true;
    router.replace(`${pathname}?tab=withdrawals&status=Pending&page=1&per_page=${perPage}`, {
      scroll: false,
    });
    loadWithdrawals({ status: "Pending", page: 1, keyword: "" }).finally(() => {
      skipAutoLoadRef.current = false;
    });
  }

  function refresh() {
    setRefreshing(true);
    const loader = tab === "deposits" ? loadDeposits() : loadWithdrawals();
    loader.finally(() => setRefreshing(false));
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
            { id: "deposits", label: "Deposits" },
            { id: "withdrawals", label: "Withdrawals" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                const nextTab = t.id;
                tabRef.current = nextTab;
                setTab(nextTab);
                setSelected([]);
                setViewAll(false);
                skipUrlHydrationRef.current = true;
                skipAutoLoadRef.current = true;
                if (nextTab === "deposits") {
                  setDepositPage(1);
                  const qs = buildDepositUrlQuery({ page: 1 });
                  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
                  loadDeposits({ page: 1 }).finally(() => {
                    skipAutoLoadRef.current = false;
                  });
                } else {
                  setWithdrawalPage(1);
                  const qs = buildWithdrawalUrlQuery({ page: 1 });
                  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
                  loadWithdrawals({ page: 1 }).finally(() => {
                    skipAutoLoadRef.current = false;
                  });
                }
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-admin-teal text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
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
                setDepositPage(1);
                setWithdrawalPage(1);
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
            {tab === "deposits" &&
            (resolvedDepositStatus === "Completed" || resolvedDepositStatus === "Rejected") ? (
              <button
                type="button"
                onClick={goToPendingDeposits}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Pending Deposits
              </button>
            ) : null}
            {tab === "withdrawals" &&
            (resolvedDepositStatus === "Completed" || resolvedDepositStatus === "Rejected") ? (
              <button
                type="button"
                onClick={goToPendingWithdrawals}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Pending Withdrawals
              </button>
            ) : null}
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {(tab === "deposits" || tab === "withdrawals") && resolvedDepositStatus === "Pending" ? (
              <>
                <button
                  type="button"
                  disabled={!selected.length}
                  onClick={openSmsModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition enabled:hover:bg-white/20 disabled:opacity-40"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  SMS
                </button>
                <button
                  type="button"
                  disabled={!selected.length}
                  onClick={openEmailModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition enabled:hover:bg-white/20 disabled:opacity-40"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
              </>
            ) : null}
            {tab === "deposits" && depositIsAdmin ? (
              <button
                type="button"
                disabled={!selectedDepositDbIds.length}
                onClick={() => setAssignOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-3.5 py-2 text-xs font-semibold text-white transition enabled:hover:brightness-110 disabled:opacity-40"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign {selectedDepositDbIds.length ? `(${selectedDepositDbIds.length})` : ""}
              </button>
            ) : null}
            {tab === "withdrawals" && withdrawalIsAdmin ? (
              <button
                type="button"
                disabled={!selectedWithdrawalDbIds.length}
                onClick={() => setAssignOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-3.5 py-2 text-xs font-semibold text-white transition enabled:hover:brightness-110 disabled:opacity-40"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign {selectedWithdrawalDbIds.length ? `(${selectedWithdrawalDbIds.length})` : ""}
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={exporting}
              onClick={handleExportTransactions}
              className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              Export
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <label className="inline-flex items-center gap-2 text-xs text-slate-500">
              Per page
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(e.target.value);
                  setDepositPage(1);
                  setWithdrawalPage(1);
                }}
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

        {actionError ? (
          <div className="border-b border-white/10 px-5 py-3 text-sm text-rose-400">{actionError}</div>
        ) : null}
        <form onSubmit={runTransactionSearch} className="border-b border-white/10 bg-white/5 px-5 py-4">
          {filterError ? (
            <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {filterError}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Search
              </span>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setDepositPage(1);
                  setWithdrawalPage(1);
                }}
                placeholder="Search…"
                className="w-full rounded-xl border border-white/10 bg-admin-surface px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
              />
              {status === "Pending" ? (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Keyword search filters pending {tab === "deposits" ? "deposits" : "withdrawals"} only. Use
                  filters below and Search for completed or rejected.
                </p>
              ) : status === "Completed" ? (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Keyword search filters completed {tab === "deposits" ? "deposits" : "withdrawals"} only. Use
                  filters below and Search to narrow by date or account.
                </p>
              ) : status === "Rejected" ? (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Keyword search filters rejected {tab === "deposits" ? "deposits" : "withdrawals"} only. Use
                  filters below and Search to narrow by date or account.
                </p>
              ) : null}
            </div>

            <div
              className="flex w-full flex-wrap items-end gap-3 lg:flex-nowrap"
              onKeyDown={handleAdvancedFilterKeyDown}
            >
              {status === "Pending" ? (
                <FilterField label="Search in" className="min-w-0 flex-1 basis-[8rem]">
                  <select
                    value={advancedSearchIn}
                    onChange={(e) => setAdvancedSearchIn(e.target.value)}
                    className={inputCls}
                  >
                    {["Completed", "Rejected"].map((s) => (
                      <option key={s} value={s} className="bg-admin-surface">
                        {s}
                      </option>
                    ))}
                  </select>
                </FilterField>
              ) : null}
              <FilterField label="Duration" className="min-w-0 flex-1 basis-[9rem]">
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
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d} className="bg-admin-surface">
                      {d}
                    </option>
                  ))}
                </select>
              </FilterField>
              {duration === "Custom" ? (
                <>
                  <FilterField label="From" className="min-w-0 flex-1 basis-[9rem]">
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
                  </FilterField>
                  <FilterField label="To" className="min-w-0 flex-1 basis-[9rem]">
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
                  </FilterField>
                </>
              ) : null}
              <FilterField label="Transaction Id" className="min-w-0 flex-1 basis-[8rem]">
                <input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="1640…" className={inputCls} />
              </FilterField>
              <FilterField label="Platform Id" className="min-w-0 flex-1 basis-[8rem]">
                <input
                  value={platformId}
                  onChange={(e) => setPlatformId(e.target.value)}
                  placeholder="Plat. ID"
                  className={inputCls}
                />
              </FilterField>
              <FilterField label="Account" className="min-w-0 flex-1 basis-[8rem]">
                <input
                  value={userAccount}
                  onChange={(e) => setUserAccount(e.target.value)}
                  placeholder="Account #"
                  className={inputCls}
                />
              </FilterField>
              <button
                type="submit"
                data-search-type="advanced"
                className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-admin-teal px-5 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto lg:ml-0"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Table — deposits vs withdrawals columns */}
        {listError ? (
          <div className="border-b border-white/10 px-5 py-3 text-sm text-rose-400">{listError}</div>
        ) : null}
        {listLoading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            Loading {tab === "deposits" ? "deposits" : "withdrawals"}…
          </div>
        ) : (
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
                  <th className="whitespace-nowrap px-3 py-3">Cashout M.</th>
                  <th className="px-3 py-3">Receiving Amount</th>
                  <th className="px-3 py-3">Acc</th>
                  <th className="px-3 py-3">Proof</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Status</th>
                  {resolvedDepositStatus === "Rejected" ? (
                    <th className="px-3 py-3">Rejected Reason</th>
                  ) : null}
                  <th className="px-3 py-3">Assign</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className={transactionRowClassName(r)}>
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
                      <DateTimeCell value={r.date} />
                    </td>
                    <td className="px-3 py-3">
                      <IdNameCell id={r.userId} name={r.customer} />
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.platform} />
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.cashoutAmt || r.amount} />
                    </td>
                    <td className="px-3 py-3">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => openProof(r)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openProof(r);
                          }
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-left"
                        title="Today's transaction count for this platform user"
                      >
                        <PlatformIdCell value={r.platformId} isScammer={r.isScammer} />
                        {r.todayTxCount > 1 ? (
                          <span className="admin-badge-glow h-5 min-w-5 px-1.5 text-[10px]">{r.todayTxCount}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="inline-flex whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium">
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
                      <button
                        type="button"
                        onClick={() => openProof(r)}
                        className={`rounded-lg p-1.5 ${r.proof ? "bg-theme-green-action/15 text-theme-green-action" : "bg-white/5 text-slate-400"}`}
                        title="View proof"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-3 py-3">{renderRowActions(r)}</td>
                    <td className="px-3 py-3">
                      <StatusPill
                        status={r.status}
                        onClick={() => openProof(r)}
                        title="View proof and approve / reject"
                      />
                    </td>
                    {resolvedDepositStatus === "Rejected" ? (
                      <td className="px-3 py-3 max-w-[220px]">
                        {r.status === "Rejected" ? (
                          <CopyCell value={formatDepositRejectedReason(r)} />
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    ) : null}
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected([r.id]);
                          setAssignOpen(true);
                        }}
                        className="text-xs font-semibold text-admin-teal underline-offset-2 hover:underline"
                      >
                        {r.assigned && r.assigned !== "—" ? r.assigned : "Unassigned"}
                      </button>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={resolvedDepositStatus === "Rejected" ? 15 : 14} className="px-4 py-14 text-center text-slate-400">
                      No Results Found
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
                  {resolvedDepositStatus === "Rejected" ? (
                    <th className="px-3 py-3">Rejected Reason</th>
                  ) : null}
                  <th className="px-3 py-3">Assign</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className={transactionRowClassName(r)}>
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
                      <DateTimeCell value={r.date} />
                    </td>
                    <td className="px-3 py-3">
                      <IdNameCell id={r.account || r.userId} name={r.customer} />
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">{r.method}</span>
                    </td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.clientPay || r.amount} />
                    </td>
                    <td className="px-3 py-3 font-medium text-white">{r.platform || "—"}</td>
                    <td className="px-3 py-3">
                      <CopyCell value={r.deposited || r.amount} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center gap-1.5">
                        <PlatformIdCell value={r.platformId} isScammer={r.isScammer} />
                        {r.todayTxCount > 1 ? (
                          <span
                            className="admin-badge-glow h-5 min-w-5 px-1.5 text-[10px]"
                            title="Same-day transactions for this platform ID"
                          >
                            {r.todayTxCount}
                          </span>
                        ) : null}
                      </div>
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
                    <td className="px-3 py-3">{renderRowActions(r)}</td>
                    <td className="px-3 py-3">
                      <StatusPill
                        status={r.status}
                        onClick={() => openProof(r)}
                        title="View proof and approve / reject"
                      />
                    </td>
                    {resolvedDepositStatus === "Rejected" ? (
                      <td className="px-3 py-3 max-w-[220px]">
                        {r.status === "Rejected" ? (
                          <CopyCell value={formatDepositRejectedReason(r)} />
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    ) : null}
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected([r.id]);
                          setAssignOpen(true);
                        }}
                        className="text-xs font-semibold text-admin-teal underline-offset-2 hover:underline"
                      >
                        {r.assigned && r.assigned !== "—" ? r.assigned : "Unassigned"}
                      </button>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={resolvedDepositStatus === "Rejected" ? 14 : 13} className="px-4 py-14 text-center text-slate-400">
                      No Results Found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
        )}

        {/* Progressive disclosure — concept 3.3 */}
        {activePagination.total_pages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
            <p className="text-xs text-slate-500">
              Page {activePagination.current_page} of {activePagination.total_pages} ·{" "}
              {activePagination.total_count} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!activePagination.has_prev || listLoading}
                onClick={() =>
                  tab === "deposits"
                    ? setDepositPage((p) => Math.max(1, p - 1))
                    : setWithdrawalPage((p) => Math.max(1, p - 1))
                }
                className="admin-btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!activePagination.has_next || listLoading}
                onClick={() =>
                  tab === "deposits" ? setDepositPage((p) => p + 1) : setWithdrawalPage((p) => p + 1)
                }
                className="admin-btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <AssignDepositsModal
        open={assignOpen && tab === "deposits"}
        depositIds={selectedDepositDbIds}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => {
          setSelected([]);
          loadDeposits();
          notifyAdminNavCountsRefresh();
        }}
      />

      <AssignWithdrawalsModal
        open={assignOpen && tab === "withdrawals"}
        withdrawalIds={selectedWithdrawalDbIds}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => {
          setSelected([]);
          loadWithdrawals();
          notifyAdminNavCountsRefresh();
        }}
      />

      <RejectReasonPanel
        key={rejectId || "reject-closed"}
        variant="modal"
        open={Boolean(rejectId)}
        title={`Reject this ${tab === "deposits" ? "deposit" : "withdrawal"}?`}
        subtitle={
          rejectRecord
            ? `${rejectRecord.id} · ${rejectRecord.customer} · ${rejectRecord.clientPay || rejectRecord.cashoutAmt || rejectRecord.amount}`
            : undefined
        }
        onCancel={() => setRejectId(null)}
        onConfirm={(reason) => rejectTransaction(reason, rejectId)}
      />

      <DepositStatusConfirmModal
        open={Boolean(pendingConfirmId)}
        title="Set as Pending?"
        message={
          pendingConfirmRecord
            ? `${pendingConfirmRecord.id} · ${pendingConfirmRecord.customer}`
            : undefined
        }
        confirmLabel="Yes"
        confirmClassName="bg-[#D1900F]"
        busy={statusActionBusy}
        onCancel={() => setPendingConfirmId(null)}
        onConfirm={() => pendingTransaction(pendingConfirmId)}
      />

      <DepositStatusConfirmModal
        open={Boolean(approveConfirmId)}
        title="Set as Completed?"
        message={
          approveConfirmRecord
            ? `${approveConfirmRecord.id} · ${approveConfirmRecord.customer}`
            : undefined
        }
        confirmLabel="Yes"
        confirmClassName="bg-theme-green-action"
        busy={statusActionBusy}
        onCancel={() => setApproveConfirmId(null)}
        onConfirm={() => approveTransaction(approveConfirmId)}
      />

      <EmailSendModal
        open={emailModalOpen}
        receivers={emailCompose.receivers}
        subject={emailCompose.subject}
        body={emailCompose.body}
        attachment={emailCompose.attachment}
        templateId={emailCompose.templateId}
        templateVariables={contactTemplateVariables}
        saving={emailSending}
        error={emailSendError}
        onChange={(patch) => setEmailCompose((prev) => ({ ...prev, ...patch }))}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
      />

      <SmsSendModal
        open={smsModalOpen}
        receivers={smsCompose.receivers}
        message={smsCompose.message}
        templateId={smsCompose.templateId}
        templateVariables={contactTemplateVariables}
        saving={smsSending}
        error={smsSendError}
        onChange={(patch) => setSmsCompose((prev) => ({ ...prev, ...patch }))}
        onClose={() => setSmsModalOpen(false)}
        onSend={handleSendSms}
      />

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
                  fetchProofBlob={activeProofFetcher}
                />
              </div>

              {proof.rejectReason && proof.status === "Rejected" ? (
                <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  Rejection reason (customer-facing): <span className="font-semibold">{proof.rejectReason}</span>
                </div>
              ) : null}
              {tab === "withdrawals" ? (
                <>
                  <h4 className="mb-2 mt-5 text-sm font-semibold text-white">
                    Same-day transactions grid
                  </h4>
                  <p className="mb-2 text-[11px] text-slate-500">
                    Same platform method and Plat. ID since today&apos;s business day (from 0:10 AM).
                  </p>
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
                        {similarWithdrawalsLoading ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                              Loading same-day transactions…
                            </td>
                          </tr>
                        ) : similarWithdrawals.length ? (
                          similarWithdrawals.map((r) => (
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                              No same-day transactions for this platform ID.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}

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
              fetchProofBlob={activeProofFetcher}
            />

            {isLockedByOther(proof) ? (
              <div className="border-t border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-200">
                Locked by {proof.lockedBy} — claim or wait before approving or rejecting.
              </div>
            ) : !canMutateCurrentTab ? (
              <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
                You do not have permission to update transaction status.
              </div>
            ) : (
              <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
                <div className="mb-4 flex items-center gap-2">
                  <StatusPill status={proof.status} />
                  <p className="text-xs text-slate-500">
                    Choose a new status and save. Rejection requires a customer-facing reason.
                  </p>
                </div>
                <DepositProofStatusPanel
                  key={proof.id}
                  initialStatus={proof.status}
                  saving={proofSaving}
                  onCancel={closeProof}
                  onSave={saveProofStatus}
                />
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
