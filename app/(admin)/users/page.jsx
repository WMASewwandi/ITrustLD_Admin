"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import RejectModal from "@/components/admin/reject-modal";
import RejectReasonPanel from "@/components/admin/reject-reason-panel";
import CopyCell, { FilterField, FormError, inputCls } from "@/components/admin/queue-ui";
import { fetchCustomers, fetchCustomerKycDocuments, fetchKycDocumentBlob, approveCustomerKyc, rejectCustomerKyc, verifyCustomerMobile, banCustomer, unbanCustomer, banMultipleCustomers, updateCustomerPartner, sendCustomerEmail, sendCustomerSms } from "@/lib/customers";
import { EmailSendModal, SmsSendModal } from "@/components/admin/customer-message-modals";
import { notifyAdminNavCountsRefresh } from "@/lib/notifications";
import { useCan } from "@/contexts/admin-permissions";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  FileImage,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  X,
} from "lucide-react";

const READ_ACCOUNTS_PERMISSION = "read_customer_accounts_data";
const READ_MOBILE_PENDING_PERMISSION = "read_mobile_verification_pending";

const FILTERS = [
  { value: "all", label: "All Users", permission: READ_ACCOUNTS_PERMISSION },
  { value: "pending", label: "All Pending Users", permission: READ_ACCOUNTS_PERMISSION },
  { value: "address-pending", label: "Address Pending", permission: READ_ACCOUNTS_PERMISSION },
  { value: "nic-pending", label: "NIC Verification Pending", permission: READ_ACCOUNTS_PERMISSION },
  { value: "mobile-pending", label: "Mobile Verification Pending", permission: READ_MOBILE_PENDING_PERMISSION },
  { value: "self-verified", label: "Self-verification Done", permission: READ_ACCOUNTS_PERMISSION },
  { value: "not-confirmed", label: "Not Confirmed", permission: READ_ACCOUNTS_PERMISSION },
  { value: "only-address", label: "Only Address Verified", permission: READ_ACCOUNTS_PERMISSION },
  { value: "only-nic", label: "Only NIC Verified", permission: READ_ACCOUNTS_PERMISSION },
  { value: "banned", label: "Banned Customers", permission: READ_ACCOUNTS_PERMISSION },
];

const FILTER_VALUES = new Set(FILTERS.map((f) => f.value));

const EMPTY_SEARCH = {
  email: "",
  accountId: "",
  firstName: "",
  lastName: "",
  isPartner: "",
  userType: "",
  loyaltyTier: "",
};

const USER_TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "normal", label: "Normal" },
  { value: "affluent", label: "Affluent" },
];

const LOYALTY_TIER_FILTERS = [
  { value: "", label: "All" },
  { value: "normal", label: "Normal" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "diamond", label: "Diamond" },
  { value: "vip", label: "VIP" },
  { value: "vvip", label: "VVIP" },
];

function resolveFilter(searchParams) {
  const value = searchParams.get("filter") || "pending";
  return FILTER_VALUES.has(value) ? value : "pending";
}

function isPartnerValue(value) {
  return String(value).toLowerCase() === "yes" || value === "Affiliate";
}

function formatDateOfBirth(value) {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return String(value);
  const [year, month, day] = raw.split("-");
  return `${day}/${month}/${year}`;
}

function DetailField({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-white">{value || "—"}</p>
    </div>
  );
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

function ConfirmModal({ open, title, message, confirmLabel = "Confirm", onClose, onConfirm, error = "", busy = false }) {
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
        <FormError message={error} className="mb-4" />
        <div className="mt-5 flex justify-end gap-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="admin-btn-secondary" disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function KycDocsModal({ open, user, field, canActOnKyc, onClose, onApprove, onReject }) {
  const [docs, setDocs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const active = docs.find((d) => d.id === activeId) || docs[0];
  const label = field === "nic" ? "NIC" : "Address";
  const status = user?.[field];
  const canApprove = canActOnKyc && (status === "Pending" || status === "Rejected");
  const canReject = canActOnKyc && (status === "Pending" || status === "Verified");
  const canAct = canApprove || canReject;

  useEffect(() => {
    if (!open || !user?.accountHolderId || !field) {
      setDocs([]);
      setActiveId(null);
      setRejectOpen(false);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetchCustomerKycDocuments(user.accountHolderId, field)
      .then((res) => {
        if (cancelled) return;
        const nextDocs = res.documents ?? [];
        setDocs(nextDocs);
        setActiveId(nextDocs[0]?.id ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setDocs([]);
        setActiveId(null);
        setError(err.message || "Failed to load documents.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user?.accountHolderId, field]);

  useEffect(() => {
    if (!open || !active?.filename || active?.missing) {
      setPreviewUrl("");
      return;
    }

    let cancelled = false;
    let objectUrl = "";

    fetchKycDocumentBlob(active.filename)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((err) => {
        if (cancelled) return;
        setPreviewUrl("");
        setError(err.message || "Failed to load document preview.");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, active?.filename, active?.missing]);

  if (!open || !user) return null;

  return (
    <div className="admin-modal-overlay admin-modal-drawer z-[70]" onClick={onClose}>
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
          {field === "nic" ? (
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              <DetailField label="First Name" value={user.firstName} />
              <DetailField label="Last Name" value={user.lastName} />
              <DetailField label="Date of Birth" value={formatDateOfBirth(user.dateOfBirth)} />
              <DetailField label="Country" value={user.country} />
            </div>
          ) : null}
          {field === "address" ? (
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              <DetailField label="Address" value={user.addressNumber} />
              <DetailField label="Street" value={user.street} />
              <DetailField label="City" value={user.city} />
              <DetailField label="Country" value={user.country} />
            </div>
          ) : null}
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading documents…
            </div>
          ) : docs.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-center text-sm text-slate-400">
              <FileText className="mb-2 h-8 w-8 opacity-50" />
              {error ? error : "No documents uploaded"}
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
                <div className="flex min-h-[240px] items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent p-4">
                  {active?.missing ? (
                    <div className="flex w-full max-w-xs flex-col items-center rounded-lg border border-amber-300/30 bg-amber-50 p-6 text-center text-amber-950 shadow-lg">
                      <FileImage className="mb-2 h-10 w-10 text-amber-500" />
                      <p className="text-sm font-bold">File not on this server</p>
                      <p className="mt-1 text-xs text-amber-800">{active?.name}</p>
                      <p className="mt-3 text-[11px] leading-relaxed text-amber-800">
                        This record points to an image that is not in local storage. Older files use paths like
                        upload/... and live on S3 or the original server, not this machine.
                      </p>
                    </div>
                  ) : previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={active?.kind || "Document preview"}
                      className="max-h-[360px] w-full rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex w-full max-w-xs flex-col items-center rounded-lg border border-slate-300/30 bg-[#f8fafc] p-6 text-center text-slate-800 shadow-lg">
                      <FileImage className="mb-2 h-10 w-10 text-slate-400" />
                      <p className="text-sm font-bold text-slate-900">{active?.kind}</p>
                      <p className="mt-1 text-xs text-slate-500">{active?.name}</p>
                      <p className="mt-3 rounded bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                        Loading preview…
                      </p>
                    </div>
                  )}
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
          {error && docs.length > 0 ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
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
                    disabled={acting}
                    className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
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
                    disabled={acting}
                    onClick={async () => {
                      setActing(true);
                      setError("");
                      try {
                        await onApprove?.();
                      } catch (err) {
                        setError(err.message || "Failed to approve.");
                      } finally {
                        setActing(false);
                      }
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
              onConfirm={async (reason) => {
                setActing(true);
                setError("");
                try {
                  await onReject?.(reason);
                  setRejectOpen(false);
                } catch (err) {
                  setError(err.message || "Failed to reject.");
                } finally {
                  setActing(false);
                }
              }}
              error={error}
              busy={acting}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function UsersContent() {
  const router = useRouter();
  const params = useSearchParams();
  const filter = useMemo(() => resolveFilter(params), [params]);
  const canReadAccounts = useCan(READ_ACCOUNTS_PERMISSION);
  const canReadMobilePending = useCan(READ_MOBILE_PENDING_PERMISSION);
  const canActOnKyc = useCan("change_customer_account_status");
  const canVerifyMobile = useCan([READ_MOBILE_PENDING_PERMISSION, "change_customer_account_status"]);
  const canCommunicate = useCan("comunicatte_to_customer");
  const canBan = useCan("change_customer_account_status");
  const allowedFilters = useMemo(
    () => FILTERS.filter((item) => (item.value === "mobile-pending" ? canReadMobilePending : canReadAccounts)),
    [canReadAccounts, canReadMobilePending],
  );
  const canAccessCurrentFilter = filter === "mobile-pending" ? canReadMobilePending : canReadAccounts;
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [accountId, setAccountId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isPartner, setIsPartner] = useState("");
  const [userType, setUserType] = useState("");
  const [loyaltyTier, setLoyaltyTier] = useState("");
  const [applied, setApplied] = useState(EMPTY_SEARCH);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banOpen, setBanOpen] = useState(null);
  const [partnerConfirm, setPartnerConfirm] = useState(null);
  const [mobileVerifyTarget, setMobileVerifyTarget] = useState(null);
  const [verifyingMobile, setVerifyingMobile] = useState(false);
  const [kycDocs, setKycDocs] = useState(null);
  const [unbanTarget, setUnbanTarget] = useState(null);
  const [bulkBanOpen, setBulkBanOpen] = useState(false);
  const [bulkBanReason, setBulkBanReason] = useState("");
  const [bulkBanning, setBulkBanning] = useState(false);
  const [emailModal, setEmailModal] = useState(null);
  const [emailCompose, setEmailCompose] = useState({ receivers: "", subject: "", body: "", attachment: null, templateId: null });
  const [emailSending, setEmailSending] = useState(false);
  const [emailSendError, setEmailSendError] = useState("");
  const [smsModal, setSmsModal] = useState(false);
  const [smsDraft, setSmsDraft] = useState({ receivers: "", message: "", templateId: null });
  const [contactTemplateVariables, setContactTemplateVariables] = useState({});
  const [smsSending, setSmsSending] = useState(false);
  const [smsSendError, setSmsSendError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const skipSearchOnNextLoadRef = useRef(false);
  const skipNextEffectLoadRef = useRef(false);
  const loadCustomersRef = useRef(null);

  const loadCustomers = useCallback(async (searchOverride = null) => {
    if (!canAccessCurrentFilter) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let search = { ...EMPTY_SEARCH };
      if (searchOverride) {
        skipSearchOnNextLoadRef.current = false;
        search = searchOverride;
      } else if (skipSearchOnNextLoadRef.current) {
        skipSearchOnNextLoadRef.current = false;
      } else {
        search = applied;
      }

      const res = await fetchCustomers({
        filter,
        email: search.email || undefined,
        accountId: search.accountId || undefined,
        firstName: search.firstName || undefined,
        lastName: search.lastName || undefined,
        isPartner: search.isPartner || undefined,
        userType: search.userType || undefined,
        loyaltyTier: search.loyaltyTier || undefined,
      });
      setRows(res.customers ?? []);
      setSelected([]);
    } catch (err) {
      setError(err.message || "Failed to load customers.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, applied, canAccessCurrentFilter]);

  loadCustomersRef.current = loadCustomers;

  useEffect(() => {
    skipSearchOnNextLoadRef.current = true;
    setPage(1);
    setSelected([]);
    setQ("");
    setEmail("");
    setAccountId("");
    setFirstName("");
    setLastName("");
    setIsPartner("");
    setUserType("");
    setLoyaltyTier("");
    setApplied(EMPTY_SEARCH);
  }, [filter]);

  useEffect(() => {
    if (canAccessCurrentFilter) return;
    const fallback = allowedFilters[0]?.value;
    if (fallback) {
      router.replace(`/users?filter=${encodeURIComponent(fallback)}`);
    }
  }, [allowedFilters, canAccessCurrentFilter, router]);

  useEffect(() => {
    if (skipNextEffectLoadRef.current) {
      skipNextEffectLoadRef.current = false;
      return;
    }
    loadCustomers();
  }, [loadCustomers]);

  const title = FILTERS.find((f) => f.value === filter)?.label || "Users";
  const isMobilePending = filter === "mobile-pending";

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((u) =>
      [u.id, u.accountId, u.name, u.firstName, u.lastName, u.email, u.mobile, u.partner, u.userType, u.loyaltyTier]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const shown = filtered.slice(start, start + perPage);
  const hasActiveSearch = Boolean(
    applied.email || applied.accountId || applied.firstName || applied.lastName ||
    applied.isPartner || applied.userType || applied.loyaltyTier ||
    email.trim() || accountId.trim() || firstName.trim() || lastName.trim() ||
    isPartner || userType || loyaltyTier
  );

  function changeFilter(nextFilter) {
    if (!allowedFilters.some((item) => item.value === nextFilter) || nextFilter === filter) return;
    skipSearchOnNextLoadRef.current = true;
    setQ("");
    setEmail("");
    setAccountId("");
    setFirstName("");
    setLastName("");
    setIsPartner("");
    setUserType("");
    setLoyaltyTier("");
    setApplied(EMPTY_SEARCH);
    setPage(1);
    setSelected([]);
    router.replace(`/users?filter=${encodeURIComponent(nextFilter)}`, { scroll: false });
  }

  function runSearch(event) {
    event?.preventDefault?.();
    const nextApplied = {
      email: email.trim(),
      accountId: accountId.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      isPartner,
      userType,
      loyaltyTier,
    };
    setPage(1);
    setSelected([]);
    skipNextEffectLoadRef.current = true;
    setApplied(nextApplied);
    loadCustomersRef.current?.(nextApplied);
  }

  function clearSearchFilters() {
    const empty = { ...EMPTY_SEARCH };
    setEmail("");
    setAccountId("");
    setFirstName("");
    setLastName("");
    setIsPartner("");
    setUserType("");
    setLoyaltyTier("");
    setPage(1);
    setSelected([]);
    skipNextEffectLoadRef.current = true;
    setApplied(empty);
    loadCustomersRef.current?.(empty);
  }

  function toggleAll(checked) {
    setSelected(checked ? shown.map((u) => u.id) : []);
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function updateCustomerRow(updated) {
    if (!updated) return;
    setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  }

  async function handleApproveKyc(user, field) {
    const res = await approveCustomerKyc(user.accountHolderId, field);
    updateCustomerRow(res.customer);
    setKycDocs(null);
    notifyAdminNavCountsRefresh();
  }

  async function handleRejectKyc(user, field, reason) {
    const res = await rejectCustomerKyc(user.accountHolderId, field, reason);
    updateCustomerRow(res.customer);
    setKycDocs(null);
    notifyAdminNavCountsRefresh();
  }

  async function handleBanCustomer(userId, reason) {
    const user = rows.find((row) => row.id === userId);
    if (!user) return;
    const res = await banCustomer(user.accountHolderId, reason);
    updateCustomerRow(res.customer);
    setBanOpen(null);
    setActionMessage(res.message || "Customer banned.");
  }

  async function handleUnbanCustomer(user) {
    const res = await unbanCustomer(user.accountHolderId);
    updateCustomerRow(res.customer);
    setUnbanTarget(null);
    setActionMessage(res.message || "Customer unbanned.");
  }

  async function handleBulkBan() {
    const accountHolderIds = rows
      .filter((row) => selected.includes(row.id))
      .map((row) => row.accountHolderId);
    if (!accountHolderIds.length) return;
    const reason = bulkBanReason.trim();
    if (!reason) {
      setError("A reason for ban is required.");
      return;
    }

    setBulkBanning(true);
    setError("");
    try {
      const res = await banMultipleCustomers(accountHolderIds, reason);
      const updatedById = new Map((res.customers || []).map((customer) => [customer.id, customer]));
      setRows((prev) => prev.map((row) => updatedById.get(row.id) || row));
      setSelected([]);
      setBulkBanOpen(false);
      setBulkBanReason("");
      setActionMessage(res.message || "Customers banned.");
    } catch (err) {
      setError(err.message || "Failed to ban selected customers.");
    } finally {
      setBulkBanning(false);
    }
  }

  function openEmailModalForUsers(users) {
    const list = Array.isArray(users) ? users : [users];
    const first = list[0];
    setEmailCompose({
      receivers: list.map((user) => user.email).filter(Boolean).join(","),
      subject: "",
      body: "",
      attachment: null,
      templateId: null,
    });
    setContactTemplateVariables({
      username: first?.name || "",
      first_name: first?.name?.split(" ")[0] || "",
    });
    setEmailSendError("");
    setEmailModal(list);
  }

  function openSmsModalForUsers(users) {
    const list = Array.isArray(users) ? users : [users];
    const first = list[0];
    setSmsDraft({
      receivers: list.map((user) => user.mobile).filter(Boolean).join(","),
      message: "",
      templateId: null,
    });
    setContactTemplateVariables({
      username: first?.name || "",
      first_name: first?.name?.split(" ")[0] || "",
    });
    setSmsSendError("");
    setSmsModal(true);
  }

  async function handleSendEmail() {
    setEmailSending(true);
    setEmailSendError("");
    try {
      const res = await sendCustomerEmail({
        receivers: emailCompose.receivers,
        subject: emailCompose.subject,
        body: emailCompose.body,
        attachment: emailCompose.attachment,
        templateId: emailCompose.templateId,
        variables: contactTemplateVariables,
      });
      setEmailModal(null);
      setActionMessage(res.message || "Email sent.");
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
      const res = await sendCustomerSms({
        mobileNumbers: smsDraft.receivers,
        message: smsDraft.message,
        templateId: smsDraft.templateId,
        variables: contactTemplateVariables,
      });
      setSmsModal(false);
      setActionMessage(res.message || "SMS sent.");
    } catch (err) {
      setSmsSendError(err.message || "Failed to send SMS.");
    } finally {
      setSmsSending(false);
    }
  }

  async function handlePartnerChange() {
    if (!partnerConfirm) return;
    const user = rows.find((row) => row.id === partnerConfirm.id);
    if (!user) return;
    setError("");
    try {
      const res = await updateCustomerPartner(
        user.accountHolderId,
        partnerConfirm.next === "Yes"
      );
      updateCustomerRow(res.customer);
      setPartnerConfirm(null);
    } catch (err) {
      setError(err.message || "Failed to update partner status.");
    }
  }

  async function handleVerifyMobile() {
    if (!mobileVerifyTarget) return;
    setError("");
    setVerifyingMobile(true);
    try {
      const res = await verifyCustomerMobile(mobileVerifyTarget.accountHolderId);
      setRows((prev) => prev.filter((row) => row.id !== mobileVerifyTarget.id));
      setSelected((prev) => prev.filter((id) => id !== mobileVerifyTarget.id));
      setMobileVerifyTarget(null);
      setActionMessage(res.message || "Mobile number marked as verified.");
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setError(err.message || "Failed to verify mobile number.");
    } finally {
      setVerifyingMobile(false);
    }
  }

  if (!canAccessCurrentFilter) {
    if (allowedFilters.length === 0) {
      return (
        <div>
          <p className="text-sm text-slate-400">You do not have permission to view this page.</p>
        </div>
      );
    }
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading customers…
      </div>
    );
  }

  if (loading && rows.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading customers…
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "User Management", href: canReadAccounts ? "/users?filter=pending" : "/users?filter=mobile-pending" }, { label: title }]} />

      {actionMessage ? (
        <div className="admin-card mb-4 border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {actionMessage}
        </div>
      ) : null}

      {error && !unbanTarget && !bulkBanOpen && !partnerConfirm && !mobileVerifyTarget && !banOpen ? (
        <div className="admin-card mb-4 border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

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
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => changeFilter(e.target.value)}
                  className={inputCls}
                >
                  {allowedFilters.map((f) => (
                    <option key={f.value} value={f.value} className="bg-admin-surface">
                      {f.label}
                    </option>
                  ))}
                </select>
                {loading && rows.length > 0 ? (
                  <Loader2 className="pointer-events-none absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
                ) : null}
              </div>
            </label>
          </div>
        </div>

        <form
          onSubmit={runSearch}
          className="border-b border-white/10 bg-white/5 px-5 py-4"
        >
          <div className="flex min-w-0 flex-nowrap items-end gap-2 overflow-x-auto">
            <FilterField label="Email" className="min-w-[9rem] flex-1">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={inputCls}
                autoComplete="off"
              />
            </FilterField>
            <FilterField label="Account Id" className="min-w-[8rem] flex-1">
              <input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Account Id"
                className={inputCls}
                autoComplete="off"
              />
            </FilterField>
            <FilterField label="First Name" className="min-w-[8rem] flex-1">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className={inputCls}
                autoComplete="off"
              />
            </FilterField>
            <FilterField label="Last Name" className="min-w-[8rem] flex-1">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className={inputCls}
                autoComplete="off"
              />
            </FilterField>
            <FilterField label="Is Partner" className="w-auto shrink-0">
              <div className="flex h-10 items-center">
                <input
                  type="checkbox"
                  checked={isPartner === "yes"}
                  onChange={(e) => setIsPartner(e.target.checked ? "yes" : "")}
                  className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action"
                  title="Show partner users only"
                />
              </div>
            </FilterField>
            <FilterField label="User Type" className="w-[8.5rem] shrink-0">
              <select value={userType} onChange={(e) => setUserType(e.target.value)} className={inputCls}>
                {USER_TYPE_FILTERS.map((option) => (
                  <option key={option.value || "all"} value={option.value} className="bg-admin-surface">
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Loyalty Tier" className="w-[8.5rem] shrink-0">
              <select value={loyaltyTier} onChange={(e) => setLoyaltyTier(e.target.value)} className={inputCls}>
                {LOYALTY_TIER_FILTERS.map((option) => (
                  <option key={option.value || "all"} value={option.value} className="bg-admin-surface">
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <div className="flex shrink-0 items-end gap-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
              <button
                type="button"
                onClick={clearSearchFilters}
                disabled={!hasActiveSearch}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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
            {selected.length > 0 && canBan ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setBulkBanOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
              >
                <Ban className="h-3.5 w-3.5" />
                Ban ({selected.length})
              </button>
            ) : null}
            {selected.length > 0 && canCommunicate ? (
              <>
                <button
                  type="button"
                  onClick={() => openEmailModalForUsers(rows.filter((row) => selected.includes(row.id)))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#134B52] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email ({selected.length})
                </button>
                <button
                  type="button"
                  onClick={() => openSmsModalForUsers(rows.filter((row) => selected.includes(row.id)))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#134B52] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  SMS ({selected.length})
                </button>
              </>
            ) : null}
          </div>
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

        <div className={`overflow-x-auto overflow-y-visible transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
                      <table className={`${isMobilePending ? "min-w-[860px]" : "min-w-[1280px]"} w-full text-left text-[13px]`}>
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={shown.length > 0 && selected.length === shown.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded border-white/20"
                    disabled={loading}
                  />
                </th>
                <th className="px-3 py-3">Account ID</th>
                <th className="px-3 py-3">Full Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Mobile No.</th>
                {isMobilePending ? <th className="px-3 py-3">Mobile</th> : null}
                {!isMobilePending ? (
                  <>
                    <th className="px-3 py-3">Is Partner</th>
                    <th className="px-3 py-3">User Type</th>
                    <th className="px-3 py-3">Loyalty Tier</th>
                  </>
                ) : null}
                {filter === "banned" ? <th className="px-3 py-3">Reason for Banning</th> : null}
                {!isMobilePending ? (
                  <>
                    <th className="px-3 py-3">NIC</th>
                    <th className="px-3 py-3">Address</th>
                  </>
                ) : null}
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
                    <CopyCell value={u.accountId || "—"} />
                  </td>
                  <td className="px-3 py-3">
                    <CopyCell value={u.name || "—"} />
                  </td>
                  <td className="px-3 py-3">
                    <CopyCell value={u.email || "—"} />
                  </td>
                  <td className="px-3 py-3">
                    <CopyCell value={u.mobile || "—"} />
                  </td>
                  {isMobilePending ? (
                    <td className="px-3 py-3">
                      <KycBadge value={u.mobileVerification} />
                    </td>
                  ) : null}
                  {!isMobilePending ? (
                    <>
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
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                            u.userType === "Affluent" || isPartnerValue(u.partner)
                              ? "border-theme-green-action/40 bg-theme-green-action/10 text-theme-green-action"
                              : "border-white/15 bg-white/5 text-slate-300"
                          }`}
                        >
                          {u.userType || (isPartnerValue(u.partner) ? "Affluent" : "Normal")}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {u.loyaltyTier || "Normal"}
                        </span>
                      </td>
                    </>
                  ) : null}
                  {filter === "banned" ? (
                    <td className="max-w-[240px] px-3 py-3">
                      <CopyCell value={u.banReason || "—"} />
                    </td>
                  ) : null}
                  {!isMobilePending ? (
                    <>
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
                    </>
                  ) : null}
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      {isMobilePending && canVerifyMobile && u.mobileVerification !== "Verified" ? (
                        <button
                          type="button"
                          onClick={() => setMobileVerifyTarget(u)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 px-2 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                          title="Mark mobile number as verified"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Verify
                        </button>
                      ) : null}
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
                        <button
                          type="button"
                          onClick={() => setUnbanTarget(u)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 px-2 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                          title={u.banReason || "Unban user"}
                        >
                          Unban
                        </button>
                      )}
                      {canCommunicate ? (
                        <button
                          type="button"
                          onClick={() => openEmailModalForUsers(u)}
                          className="rounded-lg border border-white/10 p-1.5 text-slate-500 transition hover:border-admin-teal/40 hover:text-white"
                          title="Send email"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={isMobilePending ? 7 : 11} className="px-4 py-14 text-center text-slate-400">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading…
                      </span>
                    ) : (
                      "No Results Found"
                    )}
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
        open={!!unbanTarget}
        title="Unban customer"
        message={unbanTarget ? `Restore access for ${unbanTarget.name}?` : ""}
        confirmLabel="Unban"
        error={unbanTarget ? error : ""}
        onClose={() => {
          setUnbanTarget(null);
          setError(null);
        }}
        onConfirm={() => {
          handleUnbanCustomer(unbanTarget).catch((err) => {
            setError(err.message || "Failed to unban customer.");
          });
        }}
      />

      {bulkBanOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !bulkBanning && setBulkBanOpen(false)}
        >
          <div
            className="admin-card w-full max-w-md rounded-t-2xl p-5 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Ban selected customers</h3>
            <p className="mt-1 text-sm text-slate-400">
              Ban {selected.length} selected customer(s). A reason is required.
            </p>
            <textarea
              value={bulkBanReason}
              onChange={(e) => setBulkBanReason(e.target.value)}
              rows={4}
              placeholder="Reason for ban"
              className={`${inputCls} mt-4 resize-y`}
            />
            <FormError message={error} className="mt-3" />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={bulkBanning}
                onClick={() => setBulkBanOpen(false)}
                className="admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkBanning || !bulkBanReason.trim()}
                onClick={handleBulkBan}
                className="rounded-xl bg-admin-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {bulkBanning ? "Banning…" : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <EmailSendModal
        open={!!emailModal}
        receivers={emailCompose.receivers}
        subject={emailCompose.subject}
        body={emailCompose.body}
        attachment={emailCompose.attachment}
        templateId={emailCompose.templateId}
        templateVariables={contactTemplateVariables}
        saving={emailSending}
        error={emailSendError}
        onChange={(patch) => setEmailCompose((prev) => ({ ...prev, ...patch }))}
        onClose={() => setEmailModal(null)}
        onSend={handleSendEmail}
      />

      <SmsSendModal
        open={smsModal}
        receivers={smsDraft.receivers}
        message={smsDraft.message}
        templateId={smsDraft.templateId}
        templateVariables={contactTemplateVariables}
        saving={smsSending}
        error={smsSendError}
        onChange={(patch) => setSmsDraft((prev) => ({ ...prev, ...patch }))}
        onClose={() => setSmsModal(false)}
        onSend={handleSendSms}
      />

      <ConfirmModal
        open={!!partnerConfirm}
        title="Confirm partner status"
        message={
          partnerConfirm
            ? `Set ${partnerConfirm.name} as partner: ${partnerConfirm.next}?`
            : ""
        }
        confirmLabel={`Set to ${partnerConfirm?.next || "Yes"}`}
        error={partnerConfirm ? error : ""}
        onClose={() => {
          setPartnerConfirm(null);
          setError(null);
        }}
        onConfirm={handlePartnerChange}
      />

      <ConfirmModal
        open={!!mobileVerifyTarget}
        title="Verify mobile number"
        message={
          mobileVerifyTarget
            ? `Mark ${mobileVerifyTarget.mobile || "this mobile number"} for ${mobileVerifyTarget.name} as verified?`
            : ""
        }
        confirmLabel="Verify"
        busy={verifyingMobile}
        error={mobileVerifyTarget ? error : ""}
        onClose={() => {
          if (verifyingMobile) return;
          setMobileVerifyTarget(null);
          setError(null);
        }}
        onConfirm={handleVerifyMobile}
      />

      <RejectModal
        open={!!banOpen}
        title="Ban customer"
        error={banOpen ? error : ""}
        onClose={() => {
          setBanOpen(null);
          setError(null);
        }}
        onConfirm={(reason) => {
          handleBanCustomer(banOpen, reason).catch((err) => {
            setError(err.message || "Failed to ban customer.");
          });
        }}
      />

      <KycDocsModal
        open={!!kycDocs}
        user={kycDocs?.user ? rows.find((u) => u.id === kycDocs.user.id) || kycDocs.user : null}
        field={kycDocs?.field}
        canActOnKyc={canActOnKyc}
        onClose={() => setKycDocs(null)}
        onApprove={() => handleApproveKyc(kycDocs.user, kycDocs.field)}
        onReject={(reason) => handleRejectKyc(kycDocs.user, kycDocs.field, reason)}
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
