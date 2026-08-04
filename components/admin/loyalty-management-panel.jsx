"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, MessageSquare, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import { sendCustomerEmail, sendCustomerSms } from "@/lib/customers";
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

function ActionButtons({ onEdit, onDelete, disabled }) {
  return (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="rounded-lg bg-theme-green-action/90 p-1.5 text-white disabled:opacity-60"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:opacity-60"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AmountModal({ open, title, fields, saving, onClose, onSave }) {
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
              <input
                type="number"
                min="0"
                step="1"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className={inputCls}
              />
            </label>
          ))}
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

export default function LoyaltyManagementPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const audienceOption = resolveAudienceOption(searchParams.get("audience"));
  const audience = audienceOption.label;
  const isAffiliate = audienceOption.param === "affiliate";
  const audienceKey = audienceOption.apiKey;

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
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "management");
      params.set("audience", option.param);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const reload = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");
      try {
        const response = await fetchLoyaltyManagementConfigs(audienceKey);
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
    [audienceKey],
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
    router.replace(`${pathname}?${params.toString()}`);
  }, [audienceOption.param, pathname, router, searchParams]);

  const topEarners = data?.top_earners || [];
  const pointRows = data?.point_collections || [];
  const bonusRows = data?.bonuses || [];
  const configs = data?.configs || {};

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
    if (!window.confirm("Delete this point collection amount?")) return;
    await runAction(`delete-pc-${row.id}`, () => deletePointCollection({ id: row.id }));
  }

  async function handleDeleteBonus(row) {
    if (!window.confirm("Delete this bonus amount?")) return;
    await runAction(`delete-bonus-${row.id}`, () => deleteBonus({ id: row.id }));
  }

  async function handleDeleteLevel(row) {
    if (!window.confirm("Delete this loyalty level configuration?")) return;
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
        await createPointCollection({ calAmount: amount, isAffiliate: isAffiliate });
      } else if (modal.type === "edit-point") {
        const amount = Number(modal.calAmount);
        if (!Number.isInteger(amount) || amount < 0) throw new Error("Enter a valid cal amount.");
        await updatePointCollectionAmount({ id: modal.id, calAmount: amount });
      } else if (modal.type === "add-bonus") {
        const amount = Number(modal.bonusAmount);
        if (!Number.isInteger(amount) || amount < 0) throw new Error("Enter a valid bonus amount.");
        await createBonus({ bonusAmount: amount, isAffiliate: isAffiliate });
      } else if (modal.type === "edit-bonus") {
        const amount = Number(modal.bonusAmount);
        if (!Number.isInteger(amount) || amount < 0) throw new Error("Enter a valid bonus amount.");
        await updateBonusAmount({ id: modal.id, bonusAmount: amount });
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
            name: "calAmount",
            label: "Cal Amount",
            value: modal.calAmount,
            onChange: (value) => setModal((prev) => ({ ...prev, calAmount: value })),
          },
        ]
      : modal?.type === "add-bonus" || modal?.type === "edit-bonus"
        ? [
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

      {error ? (
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
              <h2 className="text-lg font-semibold text-white">Point Collection</h2>
              <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-auto">
                <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <ActiveCheckbox
                    checked={Boolean(configs.point_collection?.is_active)}
                    disabled={Boolean(busyKey)}
                    onChange={(e) => toggleMasterConfig(pointMasterId, e.target.checked)}
                  />
                  Activate Amount
                </label>
                <button
                  type="button"
                  onClick={() => setModal({ type: "add-point", calAmount: "1" })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Amount
                </button>
              </div>
            </div>
            <ConfigTable
              rows={pointRows}
              busyKey={busyKey}
              amountKey="cal_amount"
              amountLabel="Cal Amount"
              onToggle={togglePointRow}
              onEdit={(row) =>
                setModal({ type: "edit-point", id: row.id, calAmount: String(row.cal_amount) })
              }
              onDelete={handleDeletePoint}
            />
          </section>

          <section className="admin-card overflow-visible p-0">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">Bonus</h2>
              <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-auto">
                <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <ActiveCheckbox
                    checked={Boolean(configs.bonus?.is_active)}
                    disabled={Boolean(busyKey)}
                    onChange={(e) => toggleMasterConfig(bonusMasterId, e.target.checked)}
                  />
                  Activate Amount
                </label>
                <button
                  type="button"
                  onClick={() => setModal({ type: "add-bonus", bonusAmount: "5" })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Amount
                </button>
              </div>
            </div>
            <ConfigTable
              rows={bonusRows}
              busyKey={busyKey}
              amountKey="bonus_amount"
              amountLabel="Bonus Amount"
              onToggle={toggleBonusRow}
              onEdit={(row) =>
                setModal({ type: "edit-bonus", id: row.id, bonusAmount: String(row.bonus_amount) })
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
                            disabled={Boolean(busyKey)}
                            onChange={(e) => toggleMasterConfig(masterId, e.target.checked)}
                          />
                          Activate Amount
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setModal({
                              type: "add-level",
                              loyaltyLevel: level.key,
                              levelLabel: level.label,
                              clientBonusAmount: "5",
                              clientCount: "10",
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Amount
                        </button>
                      </div>
                    </div>
                    <LevelTable
                      rows={rows}
                      busyKey={busyKey}
                      onToggle={toggleLevelRow}
                      onEdit={(row) =>
                        setModal({
                          type: "edit-level",
                          id: row.id,
                          levelLabel: level.label,
                          clientBonusAmount: String(row.client_bonus_amount),
                          clientCount: String(row.client_count),
                        })
                      }
                      onDelete={handleDeleteLevel}
                    />
                  </section>
                );
              })
            : null}

          <section className="admin-card p-0">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">User Ranking</h2>
                <p className="mt-0.5 text-xs text-slate-400">Top 50 point earners · {audience}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 sm:ml-auto">
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
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Mobile No.</th>
                    <th className="px-4 py-3">Total Loyalty Points</th>
                  </tr>
                </thead>
                <tbody>
                  {topEarners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
        onClose={() => setModal(null)}
        onSave={saveModal}
      />
    </div>
  );
}

function ConfigTable({ rows, busyKey, amountKey, amountLabel, onToggle, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[13px]">
        <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Admin ID</th>
            <th className="px-4 py-3">{amountLabel}</th>
            <th className="px-4 py-3">Changed Date</th>
            <th className="px-4 py-3">Set as Active</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-t border-white/10 text-slate-300">
                <td className="px-4 py-3 font-medium text-white">{row.display_id}</td>
                <td className="px-4 py-3">{row.admin_id ?? "—"}</td>
                <td className="px-4 py-3">{row[amountKey]}</td>
                <td className="px-4 py-3 text-slate-400">{row.changed_date}</td>
                <td className="px-4 py-3">
                  <ActiveCheckbox
                    checked={Boolean(row.is_active)}
                    disabled={Boolean(busyKey)}
                    onChange={(e) => onToggle(row, e.target.checked)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionButtons
                    disabled={Boolean(busyKey)}
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function LevelTable({ rows, busyKey, onToggle, onEdit, onDelete }) {
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
            <th className="px-4 py-3">Set as Active</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-t border-white/10 text-slate-300">
                <td className="px-4 py-3 font-medium text-white">{row.display_id}</td>
                <td className="px-4 py-3">{row.admin_id ?? "—"}</td>
                <td className="px-4 py-3">{row.client_bonus_amount}</td>
                <td className="px-4 py-3">{row.client_count}</td>
                <td className="px-4 py-3 text-slate-400">{row.changed_date}</td>
                <td className="px-4 py-3">
                  <ActiveCheckbox
                    checked={Boolean(row.is_active)}
                    disabled={Boolean(busyKey)}
                    onChange={(e) => onToggle(row, e.target.checked)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionButtons
                    disabled={Boolean(busyKey)}
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
