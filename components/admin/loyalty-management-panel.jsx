"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useLocationSearchParams } from "@/lib/location-search";
import { Loader2, Mail, MessageSquare, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { FilterField, inputCls } from "@/components/admin/queue-ui";
import { useAppDialog } from "@/components/admin/app-dialog";
import { sendCustomerEmail, sendCustomerSms } from "@/lib/customers";
import { parseDbDateTime } from "@/lib/sl-time";
import {
  createBonus,
  createLoyaltyLevel,
  createPointCollection,
  deleteBonus,
  deleteLoyaltyLevel,
  deletePointCollection,
  fetchLoyaltyManagementConfigs,
  updateBonusAmount,
  updateBonusState,
  updateLoyaltyLevelAmount,
  updateLoyaltyLevelState,
  updateMasterConfigState,
  updatePointCollectionAmount,
  updatePointCollectionState,
} from "@/lib/loyalty-management";

const LEVEL_BONUS_VALIDITY_DAYS = 30;

const LEVEL_META = [
  { key: "SILVER", label: "Silver Level", configKey: "silver_bonus", masterId: "SILVER-BONUS" },
  { key: "GOLD", label: "Gold Level", configKey: "gold_bonus", masterId: "GOLD-BONUS" },
  { key: "DIAMOND", label: "Diamond Level", configKey: "diamond_bonus", masterId: "DIAMOND-BONUS" },
  { key: "VIP", label: "VIP Level", configKey: "vip_bonus", masterId: "VIP-BONUS" },
  { key: "VVIP", label: "VVIP Level", configKey: "vvip_bonus", masterId: "VVIP-BONUS" },
];

const AUDIENCE_OPTIONS = [
  { label: "Normal Users", param: "normal", apiKey: "standard" },
  { label: "Affiliate Users", param: "affiliate", apiKey: "affiliate" },
];

const POINT_COLLECTION_TIER_OPTIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "SILVER", label: "Silver" },
  { value: "GOLD", label: "Gold" },
  { value: "DIAMOND", label: "Diamond" },
  { value: "VIP", label: "VIP" },
  { value: "VVIP", label: "VVIP" },
];

const DEFAULT_TIER_OPTIONS = [
  { slug: "normal", name: "Normal", color: "#64969A" },
  { slug: "silver", name: "Silver", color: "#8A9399" },
  { slug: "gold", name: "Gold", color: "#B8860B" },
  { slug: "diamond", name: "Diamond", color: "#3D8FA8" },
  { slug: "vip", name: "VIP", color: "#C48A12" },
  { slug: "vvip", name: "VVIP", color: "#0D9F1B" },
];

function usedTiersFromRows(rows) {
  const set = new Set();
  for (const row of rows || []) {
    const tier = String(row.membership_tier || "").trim().toUpperCase();
    if (tier) set.add(tier);
  }
  return set;
}

function membershipTierSelectOptions(usedSet, currentValue) {
  return POINT_COLLECTION_TIER_OPTIONS.map((option) => {
    const isCurrent = option.value === String(currentValue || "").toUpperCase();
    const alreadyAdded = usedSet.has(option.value) && !isCurrent;
    return {
      ...option,
      disabled: alreadyAdded,
      label: alreadyAdded ? `${option.label} (already added)` : option.label,
    };
  });
}

function resolveTierSlug(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value || value === "all") return "all";
  const match = DEFAULT_TIER_OPTIONS.find((tier) => tier.slug === value);
  return match ? match.slug : "all";
}

function TierBadge({ tier }) {
  if (!tier?.name) {
    return <span className="text-slate-500">—</span>;
  }
  const color = tier.color || "#64969A";
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{
        color,
        backgroundColor: `${color}22`,
        border: `1px solid ${color}55`,
      }}
    >
      {tier.name}
    </span>
  );
}

function resolveAudienceOption(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (
    value === "affiliate" ||
    value === "partner" ||
    value === "affiliate users" ||
    value === "affiliate partners"
  ) {
    return AUDIENCE_OPTIONS[1];
  }
  return AUDIENCE_OPTIONS[0];
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

function ActionButtons({
  onEdit,
  onDelete,
  disabled,
  disabledTitle,
  editDisabled,
  deleteDisabled,
  editTitle,
  deleteTitle,
}) {
  const isEditDisabled = editDisabled ?? disabled;
  const isDeleteDisabled = deleteDisabled ?? disabled;

  return (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        disabled={isEditDisabled}
        className="rounded-lg bg-theme-green-action/90 p-1.5 text-white disabled:cursor-not-allowed disabled:opacity-40"
        title={isEditDisabled ? editTitle || disabledTitle || "Unavailable" : editTitle || "Edit"}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleteDisabled}
        className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:cursor-not-allowed disabled:opacity-40"
        title={
          isDeleteDisabled
            ? deleteTitle || disabledTitle || "Unavailable"
            : deleteTitle || "Delete"
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getLevelBonusExpiresAt(expiresAt, createdAt) {
  const fromExpires = parseDbDateTime(expiresAt);
  if (fromExpires) return fromExpires;

  const created = parseDbDateTime(createdAt);
  if (!created) return null;
  return new Date(created.getTime() + LEVEL_BONUS_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
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

function LevelBonusCountdown({ expiresAt, createdAt, isExpired }) {
  const expires = useMemo(
    () => getLevelBonusExpiresAt(expiresAt, createdAt),
    [expiresAt, createdAt],
  );
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

  if (parts.expired) {
    return (
      <span className="inline-flex rounded-md bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-300">
        Expired
      </span>
    );
  }

  return (
    <span
      className="inline-flex rounded-md bg-amber-500/15 px-2 py-1 font-mono text-[11px] font-semibold text-amber-200"
      title={expires ? `Expires ${expires.toLocaleString()}` : undefined}
    >
      {formatCountdown(parts)}
    </span>
  );
}

function useLevelBonusExpired(expiresAt, createdAt, serverExpired) {
  const expires = useMemo(
    () => getLevelBonusExpiresAt(expiresAt, createdAt),
    [expiresAt, createdAt],
  );
  const [expired, setExpired] = useState(() =>
    Boolean(serverExpired || !expires || expires.getTime() <= Date.now()),
  );

  useEffect(() => {
    if (serverExpired || !expires) {
      setExpired(true);
      return undefined;
    }
    const tick = () => setExpired(expires.getTime() <= Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expires, serverExpired]);

  return expired;
}

function LevelBonusRow({ row, busyKey, readOnly = false, onToggle, onEdit, onDelete }) {
  const expired = useLevelBonusExpired(row.expires_at, row.created_at, row.is_expired);
  const busy = Boolean(busyKey);
  const mutateDisabled = busy || expired || readOnly;
  const deleteDisabled = busy || !expired;

  return (
    <tr
      className={`border-t border-white/10 text-slate-300 ${
        expired ? "bg-rose-500/[0.04] opacity-80" : ""
      }`}
    >
      <td className="px-4 py-3 font-medium text-white">{row.display_id}</td>
      <td className="px-4 py-3">{row.admin_id ?? "—"}</td>
      <td className="px-4 py-3">{row.client_bonus_amount}</td>
      <td className="px-4 py-3">{row.client_count}</td>
      <td className="px-4 py-3 text-slate-400">{row.changed_date}</td>
      <td className="px-4 py-3">
        <LevelBonusCountdown
          expiresAt={row.expires_at}
          createdAt={row.created_at}
          isExpired={expired}
        />
      </td>
      <td className="px-4 py-3">
        <ActiveCheckbox
          checked={Boolean(row.is_active)}
          disabled={mutateDisabled}
          title={expired ? "Expired level bonus cannot be activated" : undefined}
          onChange={(e) => onToggle(row, e.target.checked)}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <ActionButtons
          editDisabled={mutateDisabled}
          deleteDisabled={deleteDisabled}
          editTitle={expired ? "Expired level bonus cannot be edited" : "Edit"}
          deleteTitle={
            expired
              ? "Delete expired level bonus"
              : "Delete is only available after the bonus expires"
          }
          onEdit={() => onEdit(row)}
          onDelete={() => onDelete(row)}
        />
      </td>
    </tr>
  );
}

function AmountModal({
  open,
  title,
  fields,
  saving,
  error = "",
  showNotify = false,
  notifyUsersByEmail = false,
  onNotifyChange,
  onClose,
  onSave,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="admin-modal-overlay z-[90]" onClick={onClose}>
      <div
        className="admin-card w-full max-w-md p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          {fields.map((field) => (
            <label key={field.name} className="block text-sm text-slate-300">
              <span className="mb-1 block text-xs text-slate-400">{field.label}</span>
              {field.type === "select" ? (
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={inputCls}
                >
                  {field.options.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={Boolean(option.disabled)}
                      className="bg-admin-surface disabled:text-slate-500"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={inputCls}
                />
              )}
            </label>
          ))}

          {showNotify ? (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <span className="block text-sm font-medium text-slate-200">
                  Notify users by email &amp; SMS
                </span>
                <span className="block text-xs text-slate-500">
                  If checked, selected tier users will receive email and SMS.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(notifyUsersByEmail)}
                onChange={(e) => onNotifyChange?.(e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          ) : null}
        </div>
        {error ? (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        ) : null}
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
            onClick={onSave}
            disabled={saving}
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

export default function LoyaltyManagementPanel({ canMutate = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useLocationSearchParams();
  const { confirm } = useAppDialog();
  const audienceOption = resolveAudienceOption(searchParams.get("audience"));
  const audience = audienceOption.label;
  const isAffiliate = audienceOption.param === "affiliate";
  const audienceKey = audienceOption.apiKey;
  const selectedTier = resolveTierSlug(searchParams.get("tier"));

  const readOnly = !canMutate;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rankSelectAll, setRankSelectAll] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState({});
  const [emailForm, setEmailForm] = useState({ receivers: "", subject: "", body: "" });
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [smsForm, setSmsForm] = useState({ receivers: "", message: "" });
  const [smsSending, setSmsSending] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const smsSectionRef = useRef(null);

  const setAudience = useCallback(
    (nextParam) => {
      const option = resolveAudienceOption(nextParam);
      if (option.param === audienceOption.param) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "management");
      params.set("audience", option.param);
      params.delete("tier");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [audienceOption.param, pathname, router, searchParams],
  );

  const setTier = useCallback(
    (nextTier) => {
      const slug = resolveTierSlug(nextTier);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "management");
      params.set("audience", audienceOption.param);
      if (slug === "all") params.delete("tier");
      else params.set("tier", slug);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [audienceOption.param, pathname, router, searchParams],
  );

  const reload = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");
      try {
        const response = await fetchLoyaltyManagementConfigs(audienceKey, selectedTier);
        setData(response);
        setSelectedEmails({});
        setRankSelectAll(false);
      } catch (err) {
        setError(err.message || "Failed to load loyalty management data.");
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [audienceKey, selectedTier],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  // Keep URL explicit so sidebar "Affiliate Users" / "Normal Users" stays highlighted.
  useEffect(() => {
    const current = String(searchParams.get("audience") || "").trim().toLowerCase();
    if (current === audienceOption.param) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "management");
    params.set("audience", audienceOption.param);
    params.delete("tier");
    router.replace(`${pathname}?${params.toString()}`);
  }, [audienceOption.param, pathname, router, searchParams]);

  const topEarners = data?.top_earners || [];
  const pointRows = data?.point_collections || [];
  const bonusRows = data?.bonuses || [];
  const configs = data?.configs || {};
  const usedPointTiers = useMemo(() => usedTiersFromRows(pointRows), [pointRows]);
  const availablePointTiers = POINT_COLLECTION_TIER_OPTIONS.filter(
    (option) => !usedPointTiers.has(option.value),
  );
  const nextPointTier = availablePointTiers[0]?.value || "NORMAL";
  const allPointTiersUsed = availablePointTiers.length === 0;
  const usedBonusTiers = useMemo(() => usedTiersFromRows(bonusRows), [bonusRows]);
  const availableBonusTiers = POINT_COLLECTION_TIER_OPTIONS.filter(
    (option) => !usedBonusTiers.has(option.value),
  );
  const nextBonusTier = availableBonusTiers[0]?.value || "NORMAL";
  const allBonusTiersUsed = availableBonusTiers.length === 0;
  const tierOptions = data?.membership_tiers?.length ? data.membership_tiers : DEFAULT_TIER_OPTIONS;
  const selectedTierLabel =
    selectedTier === "all"
      ? "All Tiers"
      : tierOptions.find((tier) => tier.slug === selectedTier)?.name || "All Tiers";

  const selectedEmailList = useMemo(
    () =>
      topEarners
        .filter((row) => selectedEmails[row.account_holder_id])
        .map((row) => row.email)
        .filter((email) => email && email !== "—"),
    [topEarners, selectedEmails],
  );

  const selectedMobileList = useMemo(
    () =>
      topEarners
        .filter((row) => selectedEmails[row.account_holder_id])
        .map((row) => row.mobile_number)
        .filter((mobile) => mobile && mobile !== "—"),
    [topEarners, selectedEmails],
  );

  async function runAction(key, action, reloadAfter = true) {
    if (busyKey) return;
    setBusyKey(key);
    setError("");
    try {
      await action();
      if (reloadAfter) await reload(true);
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setBusyKey("");
    }
  }

  async function toggleMasterConfig(identifier, checked) {
    await runAction(`master-${identifier}`, () =>
      updateMasterConfigState({ identifier, activationState: checked }),
    );
  }

  async function togglePointRow(row, checked) {
    await runAction(`pc-${row.id}`, () =>
      updatePointCollectionState({ id: row.id, activationState: checked }),
    );
  }

  async function toggleBonusRow(row, checked) {
    await runAction(`bonus-${row.id}`, () => updateBonusState({ id: row.id, activationState: checked }));
  }

  async function toggleLevelRow(row, checked) {
    await runAction(`level-${row.id}`, () =>
      updateLoyaltyLevelState({ id: row.id, activationState: checked }),
    );
  }

  async function handleDeletePoint(row) {
    if (!(await confirm("Delete this point collection amount?", { title: "Delete", confirmLabel: "Delete" }))) return;
    await runAction(`delete-pc-${row.id}`, () => deletePointCollection({ id: row.id }));
  }

  async function handleDeleteBonus(row) {
    if (!(await confirm("Delete this bonus amount?", { title: "Delete", confirmLabel: "Delete" }))) return;
    await runAction(`delete-bonus-${row.id}`, () => deleteBonus({ id: row.id }));
  }

  async function handleDeleteLevel(row) {
    if (!(await confirm("Delete this loyalty level configuration?", { title: "Delete", confirmLabel: "Delete" }))) return;
    await runAction(`delete-level-${row.id}`, () => deleteLoyaltyLevel({ id: row.id }));
  }

  async function saveModal() {
    if (!modal || saving) return;
    setSaving(true);
    setError("");
    try {
      if (modal.type === "add-point") {
        const amount = Number(modal.calAmount);
        if (!Number.isInteger(amount) || amount < 0) throw new Error("Enter a valid cal amount.");
        if (!modal.membershipTier) throw new Error("Select a membership tier.");
        await createPointCollection({
          calAmount: amount,
          isAffiliate: isAffiliate,
          membershipTier: modal.membershipTier,
        });
      } else if (modal.type === "edit-point") {
        const amount = Number(modal.calAmount);
        if (!Number.isInteger(amount) || amount < 0) throw new Error("Enter a valid cal amount.");
        if (!modal.membershipTier) throw new Error("Select a membership tier.");
        await updatePointCollectionAmount({
          id: modal.id,
          calAmount: amount,
          membershipTier: modal.membershipTier,
        });
      } else if (modal.type === "add-bonus") {
        const amount = Number(modal.bonusAmount);
        if (!Number.isInteger(amount) || amount < 0) throw new Error("Enter a valid bonus amount.");
        if (!modal.membershipTier) throw new Error("Select a membership tier.");
        await createBonus({
          bonusAmount: amount,
          isAffiliate: isAffiliate,
          membershipTier: modal.membershipTier,
          notifyUsersByEmail: Boolean(modal.notifyUsersByEmail),
        });
      } else if (modal.type === "edit-bonus") {
        const amount = Number(modal.bonusAmount);
        if (!Number.isInteger(amount) || amount < 0) throw new Error("Enter a valid bonus amount.");
        if (!modal.membershipTier) throw new Error("Select a membership tier.");
        await updateBonusAmount({
          id: modal.id,
          bonusAmount: amount,
          membershipTier: modal.membershipTier,
          notifyUsersByEmail: Boolean(modal.notifyUsersByEmail),
        });
      } else if (modal.type === "add-level") {
        const bonusAmount = Number(modal.clientBonusAmount);
        const clientCount = Number(modal.clientCount);
        if (!Number.isInteger(bonusAmount) || bonusAmount < 0) {
          throw new Error("Enter a valid client bonus amount.");
        }
        if (!Number.isInteger(clientCount) || clientCount < 0) {
          throw new Error("Enter a valid client count.");
        }
        await createLoyaltyLevel({
          clientBonusAmount: bonusAmount,
          clientCount,
          loyaltyLevel: modal.loyaltyLevel,
          notifyUsersByEmail: Boolean(modal.notifyUsersByEmail),
        });
      } else if (modal.type === "edit-level") {
        const bonusAmount = Number(modal.clientBonusAmount);
        const clientCount = Number(modal.clientCount);
        if (!Number.isInteger(bonusAmount) || bonusAmount < 0) {
          throw new Error("Enter a valid client bonus amount.");
        }
        if (!Number.isInteger(clientCount) || clientCount < 0) {
          throw new Error("Enter a valid client count.");
        }
        await updateLoyaltyLevelAmount({
          id: modal.id,
          clientBonusAmount: bonusAmount,
          clientCount,
          notifyUsersByEmail: Boolean(modal.notifyUsersByEmail),
        });
      }
      setModal(null);
      await reload(true);
    } catch (err) {
      setError(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function sendRankingEmail() {
    const receivers = emailForm.receivers.trim() || selectedEmailList.join(",");
    if (!receivers) {
      setEmailMessage("Select users or enter recipient emails.");
      return;
    }
    if (!emailForm.subject.trim() || !emailForm.body.trim()) {
      setEmailMessage("Subject and message are required.");
      return;
    }

    setEmailSending(true);
    setEmailMessage("Please wait. Email is being sent.");
    try {
      const result = await sendCustomerEmail({
        receivers,
        subject: emailForm.subject.trim(),
        body: emailForm.body.trim(),
      });
      if (result?.error) {
        setEmailMessage(result.message || "Failed to send email.");
      } else {
        setEmailMessage("Email sent successfully.");
        setEmailForm((prev) => ({ ...prev, subject: "", body: "" }));
      }
    } catch (err) {
      setEmailMessage(err.message || "Failed to send email.");
    } finally {
      setEmailSending(false);
    }
  }

  function openSendEmailModal() {
    setEmailForm((prev) => ({
      ...prev,
      receivers: selectedEmailList.join(","),
    }));
    setEmailMessage("");
  }

  async function sendRankingSms() {
    const mobileNumbers = smsForm.receivers.trim() || selectedMobileList.join(",");
    if (!mobileNumbers) {
      setSmsMessage("Select users or enter mobile numbers.");
      return;
    }
    if (!smsForm.message.trim()) {
      setSmsMessage("Message is required.");
      return;
    }

    setSmsSending(true);
    setSmsMessage("Please wait. SMS is being sent.");
    try {
      const result = await sendCustomerSms({
        mobileNumbers,
        message: smsForm.message.trim(),
      });
      if (result?.error) {
        setSmsMessage(result.message || "Failed to send SMS.");
      } else {
        setSmsMessage("SMS sent successfully.");
        setSmsForm((prev) => ({ ...prev, message: "" }));
      }
    } catch (err) {
      setSmsMessage(err.message || "Failed to send SMS.");
    } finally {
      setSmsSending(false);
    }
  }

  function openSendSmsForm() {
    setSmsForm((prev) => ({
      ...prev,
      receivers: selectedMobileList.join(","),
    }));
    setSmsMessage("");
    smsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const modalFields =
    modal?.type === "add-point" || modal?.type === "edit-point"
      ? [
          {
            name: "membershipTier",
            label: "Tier",
            type: "select",
            value: modal.membershipTier || nextPointTier,
            options: membershipTierSelectOptions(usedPointTiers, modal.membershipTier),
            onChange: (value) => setModal((prev) => ({ ...prev, membershipTier: value })),
          },
          {
            name: "calAmount",
            label: "Cal Amount",
            value: modal.calAmount,
            onChange: (value) => setModal((prev) => ({ ...prev, calAmount: value })),
          },
        ]
      : modal?.type === "add-bonus" || modal?.type === "edit-bonus"
        ? [
            {
              name: "membershipTier",
              label: "Tier",
              type: "select",
              value: modal.membershipTier || nextBonusTier,
              options: membershipTierSelectOptions(usedBonusTiers, modal.membershipTier),
              onChange: (value) => setModal((prev) => ({ ...prev, membershipTier: value })),
            },
            {
              name: "bonusAmount",
              label: "Bonus Amount",
              value: modal.bonusAmount,
              onChange: (value) => setModal((prev) => ({ ...prev, bonusAmount: value })),
            },
          ]
        : modal?.type === "add-level" || modal?.type === "edit-level"
          ? [
              {
                name: "clientBonusAmount",
                label: "Client Bonus Amount",
                value: modal.clientBonusAmount,
                onChange: (value) => setModal((prev) => ({ ...prev, clientBonusAmount: value })),
              },
              {
                name: "clientCount",
                label: "Client Count",
                value: modal.clientCount,
                onChange: (value) => setModal((prev) => ({ ...prev, clientCount: value })),
              },
            ]
          : [];

  const modalTitle =
    modal?.type === "add-point"
      ? "Add Point Collection Amount"
      : modal?.type === "edit-point"
        ? "Edit Point Collection Amount"
        : modal?.type === "add-bonus"
          ? "Add Bonus Amount"
          : modal?.type === "edit-bonus"
            ? "Edit Bonus Amount"
            : modal?.type === "add-level"
              ? `Add ${modal.levelLabel} Configuration`
              : modal?.type === "edit-level"
                ? `Edit ${modal.levelLabel} Configuration`
                : "";

  const pointMasterId = isAffiliate ? "POINT-COLLECTION-AFFILIATE" : "POINT-COLLECTION";
  const bonusMasterId = isAffiliate ? "BONUS-AFFILIATE" : "BONUS";

  return (
    <div className="admin-fade-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Loyalty Management</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            {isAffiliate
              ? "Affiliate users · point collection · bonus · Silver / Gold / Diamond / VIP / VVIP levels"
              : "Point collection · bonus · user ranking · Normal Users"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => reload(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {AUDIENCE_OPTIONS.map((option) => (
            <button
              key={option.param}
              type="button"
              onClick={() => setAudience(option.param)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                audienceOption.param === option.param
                  ? "bg-gradient-to-r from-admin-teal to-admin-teal-deep text-white"
                  : "border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && !modal ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading loyalty management…
        </div>
      ) : (
        <>
          <section className="admin-card overflow-visible p-0">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Point Collection</h2>
                <p className="mt-0.5 text-xs text-slate-400">Cal amount per membership tier</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-auto">
                <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <ActiveCheckbox
                    checked={Boolean(configs.point_collection?.is_active)}
                    disabled={readOnly || Boolean(busyKey)}
                    onChange={(e) => toggleMasterConfig(pointMasterId, e.target.checked)}
                  />
                  Activate Amount
                </label>
                {readOnly ? null : (
                <button
                  type="button"
                  onClick={() =>
                    setModal({ type: "add-point", calAmount: "1", membershipTier: nextPointTier })
                  }
                  disabled={allPointTiersUsed}
                  title={allPointTiersUsed ? "Each tier already has a cal amount." : "Add Amount"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Amount
                </button>
                )}
              </div>
            </div>
            <ConfigTable
              rows={pointRows}
              busyKey={busyKey}
              readOnly={readOnly}
              amountKey="cal_amount"
              amountLabel="Cal Amount"
              showTier
              onToggle={togglePointRow}
              onEdit={(row) =>
                setModal({
                  type: "edit-point",
                  id: row.id,
                  calAmount: String(row.cal_amount),
                  membershipTier: row.membership_tier || "NORMAL",
                })
              }
              onDelete={handleDeletePoint}
            />
          </section>

          <section className="admin-card overflow-visible p-0">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Bonus</h2>
                <p className="mt-0.5 text-xs text-slate-400">Bonus amount per membership tier</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-auto">
                <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <ActiveCheckbox
                    checked={Boolean(configs.bonus?.is_active)}
                    disabled={readOnly || Boolean(busyKey)}
                    onChange={(e) => toggleMasterConfig(bonusMasterId, e.target.checked)}
                  />
                  Activate Amount
                </label>
                {readOnly ? null : (
                <button
                  type="button"
                  onClick={() =>
                    setModal({
                      type: "add-bonus",
                      bonusAmount: "5",
                      membershipTier: nextBonusTier,
                      notifyUsersByEmail: false,
                    })
                  }
                  disabled={allBonusTiersUsed}
                  title={allBonusTiersUsed ? "Each tier already has a bonus amount." : "Add Amount"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Amount
                </button>
                )}
              </div>
            </div>
            <ConfigTable
              rows={bonusRows}
              busyKey={busyKey}
              readOnly={readOnly}
              amountKey="bonus_amount"
              amountLabel="Bonus Amount"
              showTier
              onToggle={toggleBonusRow}
              onEdit={(row) =>
                setModal({
                  type: "edit-bonus",
                  id: row.id,
                  bonusAmount: String(row.bonus_amount),
                  membershipTier: row.membership_tier || "NORMAL",
                  notifyUsersByEmail: false,
                })
              }
              onDelete={handleDeleteBonus}
            />
          </section>

          {isAffiliate
            ? LEVEL_META.map((level) => {
                const rows = data?.loyalty_levels?.[level.key] || [];
                const config = configs[level.configKey];
                const masterId = level.masterId;

                return (
                  <section key={level.key} className="admin-card overflow-visible p-0">
                    <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-semibold text-white">Loyalty — {level.label}</h2>
                      <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-auto">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                          <ActiveCheckbox
                            checked={Boolean(config?.is_active)}
                            disabled={readOnly || Boolean(busyKey)}
                            onChange={(e) => toggleMasterConfig(masterId, e.target.checked)}
                          />
                          Activate Amount
                        </label>
                        {readOnly ? null : (
                        <button
                          type="button"
                          onClick={() =>
                            setModal({
                              type: "add-level",
                              loyaltyLevel: level.key,
                              levelLabel: level.label,
                              clientBonusAmount: "5",
                              clientCount: "10",
                              notifyUsersByEmail: false,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Amount
                        </button>
                        )}
                      </div>
                    </div>
                    <LevelTable
                      rows={rows}
                      busyKey={busyKey}
                      readOnly={readOnly}
                      onToggle={toggleLevelRow}
                      onEdit={(row) =>
                        setModal({
                          type: "edit-level",
                          id: row.id,
                          levelLabel: level.label,
                          clientBonusAmount: String(row.client_bonus_amount),
                          clientCount: String(row.client_count),
                          notifyUsersByEmail: false,
                        })
                      }
                      onDelete={handleDeleteLevel}
                    />
                  </section>
                );
              })
            : null}

          <section className="admin-card p-0">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">User Ranking</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Top 50 earners in the previous 12 months · {audience} · {selectedTierLabel}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Ranking uses Trust Points earned in the last 365 days. User type is Normal or Affluent
                  (partner).
                </p>
              </div>
              <div className="flex flex-wrap items-end justify-end gap-2 sm:ml-auto">
                <FilterField label="Filter by Tier" className="w-[10.5rem]">
                  <select
                    value={selectedTier}
                    onChange={(e) => setTier(e.target.value)}
                    className={inputCls}
                  >
                    <option value="all" className="bg-admin-surface">
                      All Tiers
                    </option>
                    {tierOptions.map((tier) => (
                      <option key={tier.slug} value={tier.slug} className="bg-admin-surface">
                        {tier.name}
                      </option>
                    ))}
                  </select>
                </FilterField>
                <button
                  type="button"
                  onClick={openSendEmailModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Send Email
                </button>
                <button
                  type="button"
                  onClick={openSendSmsForm}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Send Message
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-x-auto overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
              <table className="min-w-full text-left text-[13px]">
                <thead className="sticky top-0 z-10 bg-admin-surface-raised text-[10px] uppercase tracking-wide text-slate-400 shadow-[0_1px_0_rgba(255,255,255,0.08)]">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={rankSelectAll}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRankSelectAll(checked);
                          const next = {};
                          if (checked) {
                            for (const row of topEarners) {
                              next[row.account_holder_id] = true;
                            }
                          }
                          setSelectedEmails(next);
                        }}
                        className="rounded border-white/20"
                      />
                    </th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Mobile No.</th>
                    <th className="px-4 py-3">Total Loyalty Points</th>
                  </tr>
                </thead>
                <tbody>
                  {topEarners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No ranking data available.
                      </td>
                    </tr>
                  ) : (
                    topEarners.map((row) => (
                      <tr key={row.account_holder_id} className="border-t border-white/10 text-slate-300">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedEmails[row.account_holder_id])}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedEmails((prev) => {
                                const next = { ...prev };
                                if (checked) next[row.account_holder_id] = true;
                                else delete next[row.account_holder_id];
                                return next;
                              });
                              if (!checked) setRankSelectAll(false);
                            }}
                            className="rounded border-white/20"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{row.user_id}</td>
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">
                          <TierBadge tier={row.tier} />
                        </td>
                        <td className="px-4 py-3 text-slate-400">{row.email}</td>
                        <td className="px-4 py-3">{row.mobile_number}</td>
                        <td className="px-4 py-3 font-semibold text-[#FBBF24]">{row.total_points_display}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <section className="admin-card flex flex-col p-0 lg:col-span-6">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold text-white">Email Promotions</h2>
              </div>
              <div className="flex flex-1 flex-col space-y-3 px-5 py-4">
                <label className="block text-sm text-slate-300">
                  <span className="mb-1 block text-xs text-slate-400">To</span>
                  <input
                    value={emailForm.receivers}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, receivers: e.target.value }))}
                    placeholder="Enter email addresses (comma-separated)"
                    className={inputCls}
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  <span className="mb-1 block text-xs text-slate-400">Subject</span>
                  <input
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter subject"
                    className={inputCls}
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  <span className="mb-1 block text-xs text-slate-400">Message</span>
                  <textarea
                    value={emailForm.body}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, body: e.target.value }))}
                    placeholder="Enter message"
                    rows={4}
                    className={`${inputCls} resize-y`}
                  />
                </label>
                {emailMessage ? <p className="text-sm text-slate-400">{emailMessage}</p> : null}
                <div className="mt-auto flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={sendRankingEmail}
                    disabled={emailSending}
                    className="inline-flex items-center gap-2 rounded-xl bg-theme-green-action px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {emailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Send Email
                  </button>
                </div>
              </div>
            </section>

            <section ref={smsSectionRef} className="admin-card flex flex-col p-0 lg:col-span-6">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold text-white">Send Message</h2>
              </div>
              <div className="flex flex-1 flex-col space-y-3 px-5 py-4">
                <label className="block text-sm text-slate-300">
                  <span className="mb-1 block text-xs text-slate-400">To</span>
                  <input
                    value={smsForm.receivers}
                    onChange={(e) => setSmsForm((prev) => ({ ...prev, receivers: e.target.value }))}
                    placeholder="Enter mobile numbers (comma-separated)"
                    className={inputCls}
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  <span className="mb-1 block text-xs text-slate-400">Message</span>
                  <textarea
                    value={smsForm.message}
                    onChange={(e) => setSmsForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter message"
                    rows={4}
                    className={`${inputCls} resize-y`}
                  />
                </label>
                {smsMessage ? <p className="text-sm text-slate-400">{smsMessage}</p> : null}
                <div className="mt-auto flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={sendRankingSms}
                    disabled={smsSending}
                    className="inline-flex items-center gap-2 rounded-xl bg-theme-green-action px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {smsSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Send
                  </button>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      <AmountModal
        open={Boolean(modal)}
        title={modalTitle}
        fields={modalFields}
        saving={saving}
        error={error}
        showNotify={
          modal?.type === "add-bonus" ||
          modal?.type === "edit-bonus" ||
          modal?.type === "add-level" ||
          modal?.type === "edit-level"
        }
        notifyUsersByEmail={Boolean(modal?.notifyUsersByEmail)}
        onNotifyChange={(checked) =>
          setModal((prev) => (prev ? { ...prev, notifyUsersByEmail: checked } : prev))
        }
        onClose={() => {
          setModal(null);
          setError("");
        }}
        onSave={saveModal}
      />
    </div>
  );
}

function ConfigTable({ rows, busyKey, readOnly = false, amountKey, amountLabel, onToggle, onEdit, onDelete, showTier = false }) {
  const colSpan = showTier ? 7 : 6;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[13px]">
        <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Admin ID</th>
            {showTier ? <th className="px-4 py-3">Tier</th> : null}
            <th className="px-4 py-3">{amountLabel}</th>
            <th className="px-4 py-3">Changed Date</th>
            <th className="px-4 py-3">Set as Active</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-t border-white/10 text-slate-300">
                <td className="px-4 py-3 font-medium text-white">{row.display_id}</td>
                <td className="px-4 py-3">{row.admin_id ?? "—"}</td>
                {showTier ? (
                  <td className="px-4 py-3">
                    <TierBadge
                      tier={
                        row.membership_tier
                          ? DEFAULT_TIER_OPTIONS.find(
                              (tier) => tier.slug === String(row.membership_tier).toLowerCase(),
                            ) || { name: row.membership_tier_label, color: "#64969A" }
                          : { name: row.membership_tier_label || "All Tiers", color: "#94a3b8" }
                      }
                    />
                  </td>
                ) : null}
                <td className="px-4 py-3">{row[amountKey]}</td>
                <td className="px-4 py-3 text-slate-400">{row.changed_date}</td>
                <td className="px-4 py-3">
                  <ActiveCheckbox
                    checked={Boolean(row.is_active)}
                    disabled={readOnly || Boolean(busyKey)}
                    onChange={(e) => onToggle(row, e.target.checked)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  {readOnly ? (
                    <span className="text-slate-500">—</span>
                  ) : (
                  <ActionButtons
                    disabled={Boolean(busyKey)}
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row)}
                  />
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function LevelTable({ rows, busyKey, readOnly = false, onToggle, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[13px]">
        <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Admin ID</th>
            <th className="px-4 py-3">Client Bonus Amt</th>
            <th className="px-4 py-3">Client Count</th>
            <th className="px-4 py-3">Changed Date</th>
            <th className="px-4 py-3">Expiry</th>
            <th className="px-4 py-3">Set as Active</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <LevelBonusRow
                key={row.id}
                row={row}
                busyKey={busyKey}
                readOnly={readOnly}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
