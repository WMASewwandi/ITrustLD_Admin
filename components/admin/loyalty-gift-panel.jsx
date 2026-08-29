"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useLocationSearchParams } from "@/lib/location-search";
import { Check, Loader2, Pencil, Plus, Trash2, Truck, X } from "lucide-react";
import CopyCell, { FilterField, IdNameCell, StatusPill, inputCls } from "@/components/admin/queue-ui";
import RejectModal from "@/components/admin/reject-modal";
import { useRejectReasonOptions } from "@/lib/reject-reasons";
import DepositStatusConfirmModal from "@/components/admin/deposit-status-confirm-modal";
import {
  approveGiftClaim,
  createGift,
  deleteGift,
  deliverGiftClaim,
  fetchGiftClaims,
  fetchGifts,
  rejectGiftClaim,
  updateGift,
  updateGiftState,
} from "@/lib/loyalty-gifts";
import { useAppDialog } from "@/components/admin/app-dialog";
import { parseDbDateTime } from "@/lib/sl-time";
import { notifyAdminNavCountsRefresh } from "@/lib/notifications";

const LEVEL_OPTIONS = [
  { key: "NORMAL", label: "Normal" },
  { key: "SILVER", label: "Silver" },
  { key: "GOLD", label: "Gold" },
  { key: "DIAMOND", label: "Diamond" },
  { key: "VIP", label: "VIP" },
  { key: "VVIP", label: "VVIP" },
];

const AUDIENCE_FILTER_OPTIONS = [
  { label: "All", param: "all", apiKey: "all" },
  { label: "Normal", param: "normal", apiKey: "standard" },
  { label: "Affiliate", param: "affiliate", apiKey: "affiliate" },
  { label: "Both", param: "both", apiKey: "both" },
];

const AUDIENCE_FORM_OPTIONS = [
  { key: "normal", label: "Normal Users" },
  { key: "affiliate", label: "Affiliate Users" },
  { key: "both", label: "Both" },
];

const CLAIM_STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Delivered"];

function resolveAudienceFilter(raw) {
  const value = String(raw || "all").trim().toLowerCase();
  return AUDIENCE_FILTER_OPTIONS.find((option) => option.param === value) || AUDIENCE_FILTER_OPTIONS[0];
}

function ActiveCheckbox({ checked, onChange, disabled, title }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      title={title}
      className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

function FieldHelp({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-rose-400">{message}</p>;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateInputValue(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const parsed = parseDbDateTime(value);
  if (!parsed) return "";
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}

function getCountdownParts(expiresAt) {
  if (!expiresAt) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalMs = expiresAt.getTime() - Date.now();
  if (totalMs <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSec = Math.floor(totalMs / 1000);
  return {
    expired: false,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

function formatCountdown(parts) {
  if (parts.expired) return "Expired";
  if (parts.days > 0) {
    return `${parts.days}d ${pad2(parts.hours)}h ${pad2(parts.minutes)}m ${pad2(parts.seconds)}s`;
  }
  if (parts.hours > 0) {
    return `${parts.hours}h ${pad2(parts.minutes)}m ${pad2(parts.seconds)}s`;
  }
  return `${parts.minutes}m ${pad2(parts.seconds)}s`;
}

function GiftExpiryCountdown({ expiresAt, isExpired }) {
  const expires = useMemo(() => parseDbDateTime(expiresAt), [expiresAt]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!expires || isExpired) return undefined;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expires, isExpired]);

  const parts = useMemo(() => {
    if (isExpired || !expires) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    return getCountdownParts(expires);
  }, [expires, isExpired, nowMs]);

  if (!expiresAt) {
    return <span className="text-slate-500">—</span>;
  }

  if (parts.expired) {
    return (
      <span className="inline-flex rounded-md bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-300">
        Expired
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-md bg-amber-500/15 px-2 py-1 font-mono text-[11px] font-semibold text-amber-200">
      {formatCountdown(parts)}
    </span>
  );
}

function useGiftExpired(expiresAt, serverExpired) {
  const expires = useMemo(() => parseDbDateTime(expiresAt), [expiresAt]);
  const [expired, setExpired] = useState(() =>
    Boolean(serverExpired || (expires && expires.getTime() <= Date.now())),
  );

  useEffect(() => {
    if (serverExpired) {
      setExpired(true);
      return undefined;
    }
    if (!expires) {
      setExpired(false);
      return undefined;
    }
    const tick = () => setExpired(expires.getTime() <= Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expires, serverExpired]);

  return expired;
}

function GiftFormModal({ open, title, initial, saving, saveError, onClose, onSave }) {
  const [giftTitle, setGiftTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audienceType, setAudienceType] = useState("normal");
  const [levels, setLevels] = useState([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [notifyUsersByEmail, setNotifyUsersByEmail] = useState(false);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setGiftTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setAudienceType(initial?.audience_type || initial?.audience || "normal");
    setLevels(initial?.allowed_levels || []);
    setExpiresAt(toDateInputValue(initial?.expires_at_date || initial?.expires_at || ""));
    setNotifyUsersByEmail(false);
    setErrors({});
  }, [open, initial]);

  if (!open || !mounted) return null;

  function toggleLevel(key) {
    setLevels((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
    setErrors((prev) => ({ ...prev, levels: "" }));
  }

  function validateAndSave() {
    const nextErrors = {};
    if (!giftTitle.trim()) nextErrors.title = "Gift title is required.";
    if (!audienceType) nextErrors.audienceType = "Select a customer type.";
    if (!levels.length) nextErrors.levels = "Select at least one allowed level.";
    if (!expiresAt) nextErrors.expiresAt = "Expiration date is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({
      title: giftTitle,
      description,
      audienceType,
      allowedLevels: levels,
      expiresAt,
      notifyUsersByEmail,
    });
  }

  return createPortal(
    <div className="admin-modal-overlay z-[90]" onClick={onClose}>
      <div
        className="admin-card w-full max-w-lg p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm text-slate-300">
            <span className="mb-1 block text-xs text-slate-400">Gift Title</span>
            <input
              value={giftTitle}
              onChange={(e) => {
                setGiftTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: "" }));
              }}
              className={`${inputCls} ${errors.title ? "border-rose-500/60" : ""}`}
              placeholder="e.g. Gold Tier Welcome Hamper"
            />
            <FieldHelp message={errors.title} />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-1 block text-xs text-slate-400">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Brief description of the gift"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-1 block text-xs text-slate-400">Expiration Date</span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => {
                setExpiresAt(e.target.value);
                setErrors((prev) => ({ ...prev, expiresAt: "" }));
              }}
              className={`${inputCls} ${errors.expiresAt ? "border-rose-500/60" : ""}`}
            />
            <FieldHelp message={errors.expiresAt} />
          </label>

          <div>
            <span className="mb-2 block text-xs text-slate-400">Customer Type</span>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_FORM_OPTIONS.map((option) => {
                const active = audienceType === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setAudienceType(option.key);
                      setErrors((prev) => ({ ...prev, audienceType: "" }));
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-theme-green-action/50 bg-theme-green-action/20 text-theme-green-action"
                        : errors.audienceType
                          ? "border-rose-500/40 text-slate-400 hover:text-white"
                          : "border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <FieldHelp message={errors.audienceType} />
          </div>

          <div>
            <span className="mb-2 block text-xs text-slate-400">Allowed Levels</span>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map((level) => {
                const active = levels.includes(level.key);
                return (
                  <button
                    key={level.key}
                    type="button"
                    onClick={() => toggleLevel(level.key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-theme-green-action/50 bg-theme-green-action/20 text-theme-green-action"
                        : errors.levels
                          ? "border-rose-500/40 text-slate-400 hover:text-white"
                          : "border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {level.label}
                  </button>
                );
              })}
            </div>
            <FieldHelp message={errors.levels} />
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <span className="block text-sm font-medium text-slate-200">Notify users by email &amp; SMS</span>
              <span className="block text-xs text-slate-500">
                If checked, selected customer types and tiers will receive email and SMS.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyUsersByEmail}
              onChange={(e) => setNotifyUsersByEmail(e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <FieldHelp message={saveError} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={validateAndSave}
            className="inline-flex items-center gap-2 rounded-xl bg-theme-green-action px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function GiftCatalogRow({ gift, busy, readOnly = false, onToggleActive, onEdit, onDelete }) {
  const expired = useGiftExpired(gift.expires_at, gift.is_expired);

  return (
    <tr
      className={`border-t border-white/10 text-slate-300 ${
        expired ? "bg-rose-500/[0.04]" : ""
      }`}
    >
      <td className="px-3 py-3">{gift.id}</td>
      <td className="px-3 py-3 font-medium text-white">{gift.title}</td>
      <td className="px-3 py-3">
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
          {gift.audience_label || "Normal"}
        </span>
      </td>
      <td className="max-w-[200px] truncate px-3 py-3 text-slate-400">
        {gift.description || "—"}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {(gift.allowed_levels || []).map((level) => (
            <span
              key={level}
              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold"
            >
              {level}
            </span>
          ))}
        </div>
      </td>
      <td className="px-3 py-3">
        <GiftExpiryCountdown expiresAt={gift.expires_at} isExpired={expired} />
      </td>
      <td className="px-3 py-3">
        <ActiveCheckbox
          checked={gift.is_active}
          disabled={busy || readOnly}
          onChange={onToggleActive}
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            disabled={busy || readOnly}
            onClick={() => {
              if (busy || readOnly) return;
              onEdit?.();
            }}
            title={readOnly ? "No permission to edit" : "Edit"}
            className="rounded-lg bg-theme-green-action/90 p-1.5 text-white disabled:opacity-60"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={busy || readOnly}
            onClick={() => {
              if (busy || readOnly) return;
              onDelete?.();
            }}
            title={readOnly ? "No permission to delete" : "Delete"}
            className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function LoyaltyGiftPanel({ canMutateClaims = true, canMutateCatalog = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useLocationSearchParams();
  const { alert } = useAppDialog();
  const audienceFilter = useMemo(
    () => resolveAudienceFilter(searchParams.get("audience")),
    [searchParams],
  );
  const claimStatus = searchParams.get("status") || "Pending";
  const section =
    searchParams.get("section") || (searchParams.get("status") ? "claims" : "catalog");

  const [gifts, setGifts] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [error, setError] = useState("");
  const [claimsError, setClaimsError] = useState("");
  const [busy, setBusy] = useState(false);
  const [giftModal, setGiftModal] = useState(null);
  const [giftSaveError, setGiftSaveError] = useState("");
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [deliverId, setDeliverId] = useState(null);
  const [detail, setDetail] = useState(null);
  const { reasons: giftRejectReasons } = useRejectReasonOptions("gift_claim");

  const syncUrl = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "gifts");
      if (next.audience) params.set("audience", next.audience);
      if (next.section) params.set("section", next.section);
      if (next.status) params.set("status", next.status);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const loadGifts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchGifts(audienceFilter.apiKey);
      setGifts(data.gifts || []);
    } catch (err) {
      setError(err.message || "Failed to load gifts.");
      await alert(err.message || "Failed to load gifts.", { title: "Notice", tone: "danger" });
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, [alert, audienceFilter.apiKey]);

  const loadClaims = useCallback(async () => {
    setClaimsLoading(true);
    setClaimsError("");
    try {
      const data = await fetchGiftClaims({ status: claimStatus, perPage: 50 });
      setClaims(data.claims || []);
    } catch (err) {
      setClaimsError(err.message || "Failed to load gift claims.");
      await alert(err.message || "Failed to load gift claims.", { title: "Notice", tone: "danger" });
      setClaims([]);
    } finally {
      setClaimsLoading(false);
    }
  }, [alert, claimStatus]);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  useEffect(() => {
    if (section === "claims") loadClaims();
  }, [section, loadClaims]);

  async function runAction(action) {
    setBusy(true);
    setError("");
    try {
      await action();
      await loadGifts();
      if (section === "claims") await loadClaims();
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setError(err.message || "Action failed.");
      await alert(err.message || "Action failed.", { title: "Notice", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveGift(values) {
    setBusy(true);
    setGiftSaveError("");
    try {
      if (giftModal?.mode === "edit") {
        await updateGift({
          id: giftModal.record.id,
          title: values.title.trim(),
          description: values.description?.trim() || "",
          audienceType: values.audienceType,
          allowedLevels: values.allowedLevels,
          expiresAt: values.expiresAt,
          notifyUsersByEmail: Boolean(values.notifyUsersByEmail),
        });
      } else {
        await createGift({
          title: values.title.trim(),
          description: values.description?.trim() || "",
          audienceType: values.audienceType,
          allowedLevels: values.allowedLevels,
          expiresAt: values.expiresAt,
          notifyUsersByEmail: Boolean(values.notifyUsersByEmail),
        });
      }
      setGiftModal(null);
      await loadGifts();
    } catch (err) {
      setGiftSaveError(err.message || "Failed to save gift.");
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove(claimId) {
    setBusy(true);
    setClaimsError("");
    try {
      await approveGiftClaim({ claimId });
      setApproveId(null);
      await loadClaims();
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setClaimsError(err.message || "Failed to approve claim.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(claimId, reason) {
    setBusy(true);
    setClaimsError("");
    try {
      await rejectGiftClaim({ claimId, rejectionReason: reason });
      setRejectId(null);
      await loadClaims();
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setClaimsError(err.message || "Failed to reject claim.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeliver(claimId) {
    setBusy(true);
    setClaimsError("");
    try {
      await deliverGiftClaim({ claimId });
      setDeliverId(null);
      await loadClaims();
    } catch (err) {
      setClaimsError(err.message || "Failed to mark as delivered.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="admin-card overflow-visible p-0">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">Gift Management</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Create gifts · select customer type and eligible loyalty levels
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {section === "catalog"
                ? AUDIENCE_FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.param}
                      type="button"
                      onClick={() => syncUrl({ audience: option.param, section, status: claimStatus })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        audienceFilter.param === option.param
                          ? "bg-teal-600 text-white"
                          : "border border-white/10 text-slate-500 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))
                : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {[
              ["catalog", "Gift Catalog"],
              ["claims", "Gift Claims"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => syncUrl({ audience: audienceFilter.param, section: key, status: claimStatus })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  section === key
                    ? "bg-gradient-to-r from-admin-teal to-[#236B6B] text-white"
                    : "border border-white/10 text-slate-500 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {section === "catalog" ? (
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">{gifts.length} gifts configured</p>
              <button
                type="button"
                disabled={!canMutateCatalog || busy}
                onClick={() => {
                  if (!canMutateCatalog || busy) return;
                  setGiftSaveError("");
                  setGiftModal({ mode: "create" });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                title={canMutateCatalog ? "Add Gift" : "No permission"}
              >
                <Plus className="h-4 w-4" />
                Add Gift
              </button>
            </div>

            {loading ? (
              <p className="py-10 text-center text-slate-400">Loading gifts…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-[13px]">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-3">ID</th>
                      <th className="px-3 py-3">Title</th>
                      <th className="px-3 py-3">Customer Type</th>
                      <th className="px-3 py-3">Description</th>
                      <th className="px-3 py-3">Allowed Levels</th>
                      <th className="px-3 py-3">Expiry</th>
                      <th className="px-3 py-3">Active</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gifts.map((gift) => (
                      <GiftCatalogRow
                        key={gift.id}
                        gift={gift}
                        busy={busy}
                        readOnly={!canMutateCatalog}
                        onToggleActive={() =>
                          runAction(() =>
                            updateGiftState({ id: gift.id, isActive: !gift.is_active }),
                          )
                        }
                        onEdit={() => {
                          setGiftSaveError("");
                          setGiftModal({ mode: "edit", record: gift });
                        }}
                        onDelete={() => runAction(() => deleteGift({ id: gift.id }))}
                      />
                    ))}
                    {!gifts.length ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-14 text-center text-slate-400">
                          No gifts configured yet
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">{claims.length} claims</p>
              <div className="flex flex-wrap gap-1.5">
                {CLAIM_STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      syncUrl({ audience: audienceFilter.param, section: "claims", status })
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      claimStatus === status
                        ? "bg-teal-600 text-white"
                        : "border border-white/10 text-slate-500 hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {claimsLoading ? (
              <p className="py-10 text-center text-slate-400">Loading gift claims…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-left text-[13px]">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-3">Claim ID</th>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Customer</th>
                      <th className="px-3 py-3">Gift</th>
                      <th className="px-3 py-3">Delivery Address</th>
                      <th className="px-3 py-3">Phone</th>
                      <th className="px-3 py-3">Action</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim.id} className="border-t border-white/10 text-slate-300">
                        <td className="px-3 py-3">
                          <CopyCell value={claim.id} />
                        </td>
                        <td className="px-3 py-3">
                          <CopyCell value={claim.date} />
                        </td>
                        <td className="px-3 py-3">
                          <IdNameCell id={claim.account_id} name={claim.customer} />
                        </td>
                        <td className="px-3 py-3 font-medium text-white">{claim.gift_title}</td>
                        <td className="max-w-[220px] px-3 py-3">
                          <CopyCell value={claim.delivery_address} />
                        </td>
                        <td className="px-3 py-3">
                          <CopyCell value={claim.contact_phone || "—"} />
                        </td>
                        <td className="px-3 py-3">
                        {claim.status === "Pending" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={busy || !canMutateClaims}
                              onClick={() => {
                                if (busy || !canMutateClaims) return;
                                setRejectId(claim.id);
                              }}
                              className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:opacity-50"
                              title={canMutateClaims ? "Reject" : "No permission"}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={busy || !canMutateClaims}
                              onClick={() => {
                                if (busy || !canMutateClaims) return;
                                setApproveId(claim.id);
                              }}
                              className="rounded-lg bg-theme-green-action p-1.5 text-white disabled:opacity-50"
                              title={canMutateClaims ? "Approve" : "No permission"}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : claim.status === "Approved" ? (
                          <button
                            type="button"
                            disabled={busy || !canMutateClaims}
                            onClick={() => {
                              if (busy || !canMutateClaims) return;
                              setDeliverId(claim.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#D1900F] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                            title={canMutateClaims ? "Mark delivered" : "No permission"}
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Deliver
                          </button>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill
                            status={claim.status}
                            onClick={() => setDetail(claim)}
                            title="View details"
                          />
                        </td>
                      </tr>
                    ))}
                    {!claims.length ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-14 text-center text-slate-400">
                          No gift claims found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <GiftFormModal
        open={Boolean(giftModal)}
        title={giftModal?.mode === "edit" ? "Edit Gift" : "Create Gift"}
        initial={giftModal?.record}
        saving={busy}
        saveError={giftSaveError}
        onClose={() => {
          setGiftSaveError("");
          setGiftModal(null);
        }}
        onSave={handleSaveGift}
      />

      <DepositStatusConfirmModal
        open={Boolean(approveId)}
        title="Approve gift claim?"
        message={approveId ? `Claim #${approveId}` : undefined}
        confirmLabel="Approve"
        confirmClassName="bg-theme-green-action"
        busy={busy}
        error={claimsError}
        onCancel={() => {
          setApproveId(null);
          setClaimsError("");
        }}
        onConfirm={() => handleApprove(approveId)}
      />

      <DepositStatusConfirmModal
        open={Boolean(deliverId)}
        title="Mark as delivered?"
        message={deliverId ? `Claim #${deliverId}` : undefined}
        confirmLabel="Confirm"
        confirmClassName="bg-[#D1900F]"
        busy={busy}
        error={claimsError}
        onCancel={() => {
          setDeliverId(null);
          setClaimsError("");
        }}
        onConfirm={() => handleDeliver(deliverId)}
      />

      <RejectModal
        open={Boolean(rejectId)}
        title="Reject gift claim"
        reasons={giftRejectReasons}
        error={claimsError}
        busy={busy}
        onClose={() => {
          setRejectId(null);
          setClaimsError("");
        }}
        onConfirm={(reason) => handleReject(rejectId, reason)}
      />

      {detail ? (
        <div className="admin-modal-overlay z-[80]" onClick={() => setDetail(null)}>
          <div
            className="admin-card w-full max-w-lg p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Gift claim details</h3>
                <p className="mt-1 text-sm text-slate-400">
                  #{detail.id} · {detail.customer}
                </p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <dt className="text-[11px] text-slate-400">Gift</dt>
                <dd className="font-medium text-white">{detail.gift_title}</dd>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <dt className="text-[11px] text-slate-400">Delivery Address</dt>
                <dd className="text-white">{detail.delivery_address}</dd>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <dt className="text-[11px] text-slate-400">Contact Phone</dt>
                <dd className="text-white">{detail.contact_phone || "—"}</dd>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <dt className="text-[11px] text-slate-400">Status</dt>
                <dd><StatusPill status={detail.status} /></dd>
              </div>
              {detail.rejection_reason ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  Rejection reason: {detail.rejection_reason}
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
