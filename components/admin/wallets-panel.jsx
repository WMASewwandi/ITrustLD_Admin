"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import {
  createCashoutWallet,
  createTopupWallet,
  deleteCashoutWallet,
  deleteTopupWallet,
  fetchCashoutWallet,
  fetchCashoutWallets,
  fetchTopupWallet,
  fetchTopupWallets,
  fetchWalletMeta,
  mapWalletToRow,
  SAMPLE_WALLET_LOGO,
  toggleCashoutWalletStatus,
  toggleTopupWalletStatus,
  updateCashoutWallet,
  updateTopupWallet,
} from "@/lib/wallets";
import { TOPUP_WALLET_PLATFORM_TYPES } from "@/lib/mock-data";

const emptyForm = {
  name: "",
  logoName: "",
  logoUrl: null,
  logoFile: null,
  paymentMethodIds: [],
  currency: "USD",
  minLimit: "",
  maxLimit: "",
  platformType: "INT",
  terms: "",
  active: true,
  badgeColor: "#236B6B",
};

function formatLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function WalletBadge({ name, color, logoUrl }) {
  const [useSample, setUseSample] = useState(!logoUrl);
  const [sampleFailed, setSampleFailed] = useState(false);

  useEffect(() => {
    setUseSample(!logoUrl);
    setSampleFailed(false);
  }, [logoUrl]);

  const initials = String(name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();

  const showInitials = useSample && sampleFailed;
  const imageSrc = useSample ? SAMPLE_WALLET_LOGO : logoUrl;

  return (
    <div className="flex items-center gap-2.5">
      {showInitials ? (
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
          style={{ background: color || "#236B6B" }}
          aria-hidden
        >
          {initials}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          className="h-10 w-10 shrink-0 rounded-xl bg-white/10 object-contain p-1.5 shadow-sm"
          onError={() => {
            if (useSample) {
              setSampleFailed(true);
            } else {
              setUseSample(true);
            }
          }}
        />
      )}
      <span className="text-base font-semibold text-white">{name}</span>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children, onSave, saving }) {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-card max-h-[90vh] w-full max-w-xl overflow-y-auto p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="space-y-4"
        >
          {children}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="admin-btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 gap-y-1 border-b border-white/10 py-2.5 last:border-b-0 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-white">{children}</dd>
    </div>
  );
}

function isPaymentMethodSelected(selectedIds, paymentMethodId) {
  const targetId = Number(paymentMethodId);
  return selectedIds.some((id) => Number(id) === targetId);
}

function WalletSection({
  title,
  activateLabel,
  emptyMessage,
  addTitle,
  editTitle,
  addSubtitle,
  deleteConfirm,
  paymentOptionChoices,
  currencyOptions,
  platformTypes,
  loadRows,
  fetchWalletById,
  onRefreshPaymentOptions,
  createRow,
  updateRow,
  deleteRow,
  toggleRowStatus,
  fallbackTerms,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [termsModal, setTermsModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const reloadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadRows();
      setRows((data?.wallets || []).map(mapWalletToRow));
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [loadRows]);

  useEffect(() => {
    reloadRows();
  }, [reloadRows]);

  async function openAdd() {
    setModalLoading(true);
    try {
      await onRefreshPaymentOptions?.();
      setModal({
        mode: "add",
        ...emptyForm,
        currency: currencyOptions[0] || "USD",
        paymentMethodIds: [],
      });
    } catch (error) {
      window.alert(error?.message || "Could not load payment methods.");
    } finally {
      setModalLoading(false);
    }
  }

  async function openEdit(row) {
    setModalLoading(true);
    try {
      await onRefreshPaymentOptions?.();
      const data = await fetchWalletById(row.id);
      const wallet = mapWalletToRow(data?.wallet || row);
      setModal({
        mode: "edit",
        id: wallet.id,
        name: wallet.name,
        logoName: wallet.logoName || "",
        logoUrl: wallet.logoUrl || null,
        logoFile: null,
        paymentMethodIds: Array.isArray(wallet.paymentMethodIds)
          ? wallet.paymentMethodIds.map((id) => Number(id))
          : [],
        currency: wallet.currency || currencyOptions[0] || "USD",
        minLimit: wallet.minLimit === 0 || wallet.minLimit ? String(wallet.minLimit) : "",
        maxLimit: wallet.maxLimit === 0 || wallet.maxLimit ? String(wallet.maxLimit) : "",
        platformType: wallet.platformType || "INT",
        terms: wallet.terms || "",
        active: wallet.active,
        badgeColor: wallet.badgeColor || "#236B6B",
      });
    } catch (error) {
      window.alert(error?.message || "Could not load wallet details.");
    } finally {
      setModalLoading(false);
    }
  }

  function toggleMethod(paymentMethodId) {
    const normalizedId = Number(paymentMethodId);
    setModal((m) => {
      if (!m) return m;
      const selected = isPaymentMethodSelected(m.paymentMethodIds, normalizedId)
        ? m.paymentMethodIds.filter((id) => Number(id) !== normalizedId)
        : [...m.paymentMethodIds, normalizedId];
      return { ...m, paymentMethodIds: selected };
    });
  }

  function onLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setModal((m) => (m ? { ...m, logoName: "", logoUrl: null, logoFile: null } : m));
      return;
    }
    const url = URL.createObjectURL(file);
    setModal((m) => (m ? { ...m, logoName: file.name, logoUrl: url, logoFile: file } : m));
  }

  async function save() {
    if (!modal || saving) return;
    const {
      mode,
      id,
      name,
      logoFile,
      paymentMethodIds,
      minLimit,
      maxLimit,
      currency,
      platformType,
      terms,
    } = modal;

    if (!name.trim() || !currency || paymentMethodIds.length === 0) return;

    const payload = {
      name: name.trim(),
      currency,
      minLimit: Number(minLimit) || 0,
      maxLimit: Number(maxLimit) || 0,
      platformType: platformType || "INT",
      terms: terms?.trim() || "",
      paymentMethodIds: paymentMethodIds.map((id) => Number(id)),
    };

    setSaving(true);
    try {
      if (mode === "edit") {
        await updateRow(id, payload, logoFile);
      } else {
        await createRow(payload, logoFile);
      }
      setModal(null);
      await reloadRows();
    } catch (error) {
      window.alert(error?.message || "Could not save wallet.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id, currentActive) {
    try {
      await toggleRowStatus(id, !currentActive);
      await reloadRows();
    } catch (error) {
      window.alert(error?.message || "Could not update wallet status.");
    }
  }

  async function remove(id) {
    if (!window.confirm(deleteConfirm)) return;
    try {
      await deleteRow(id);
      await reloadRows();
    } catch (error) {
      window.alert(error?.message || "Could not delete wallet.");
    }
  }

  return (
    <section>
      <div className="admin-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-admin-surface px-3.5 py-2 text-sm font-semibold text-slate-300 shadow-sm transition hover:border-white/25 hover:bg-white/5"
        >
          <Plus className="h-4 w-4" />
          Add Wallet
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {rows.map((row, i) => (
          <article
            key={row.id}
            className={`admin-card admin-fade-up overflow-visible p-0 ${
              i % 2 === 1 ? "admin-fade-up-delay-1" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <WalletBadge name={row.name} color={row.badgeColor} logoUrl={row.logoUrl} />
              <button
                type="button"
                onClick={() => toggleActive(row.id, row.active)}
                className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium transition ${
                  row.active
                    ? "text-theme-green-action"
                    : "text-slate-500 hover:text-slate-100"
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded border ${
                    row.active
                      ? "border-theme-green-action bg-theme-green-action text-white"
                      : "border-white/20 bg-admin-surface"
                  }`}
                >
                  {row.active ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                </span>
                {activateLabel}
              </button>
            </div>

            <dl className="px-5 py-2">
              <FieldRow label="Wallet Name">{row.name}</FieldRow>
              <FieldRow label="Payment methods">
                {Array.isArray(row.paymentMethods)
                  ? row.paymentMethods.join(", ")
                  : row.paymentMethods}
              </FieldRow>
              <FieldRow label="Minimum limit">{formatLimit(row.minLimit)}</FieldRow>
              <FieldRow label="Maximum limit">{formatLimit(row.maxLimit)}</FieldRow>
              <FieldRow label="Currency">{row.currency}</FieldRow>
              <FieldRow label="Terms & Conditions">
                <button
                  type="button"
                  onClick={() => setTermsModal(row)}
                  className="font-semibold text-admin-teal underline-offset-2 hover:text-admin-teal-deep hover:underline"
                >
                  View terms and conditions
                </button>
              </FieldRow>
            </dl>

            <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3.5">
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-green-action px-3 py-1.5 text-sm font-semibold text-theme-green-action transition hover:bg-theme-green-action/10"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E11D48] px-3 py-1.5 text-sm font-semibold text-[#E11D48] transition hover:bg-[#E11D48]/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && rows.length === 0 ? (
        <div className="admin-card mt-5 p-8 text-center text-sm text-slate-400">{emptyMessage}</div>
      ) : null}

      {loading ? (
        <div className="admin-card mt-5 p-8 text-center text-sm text-slate-400">Loading wallets…</div>
      ) : null}

      {modalLoading ? (
        <div className="admin-card mt-5 p-8 text-center text-sm text-slate-400">Loading wallet form…</div>
      ) : null}

      {modal && !modalLoading ? (
        <ModalShell
          title={modal.mode === "edit" ? editTitle : addTitle}
          subtitle={modal.mode === "add" ? addSubtitle : undefined}
          onClose={() => setModal(null)}
          onSave={save}
          saving={saving}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Wallet Name</span>
            <input
              required
              value={modal.name}
              onChange={(e) => setModal((m) => ({ ...m, name: e.target.value }))}
              className={inputCls}
              placeholder="Enter wallet name"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Logo</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={onLogoChange}
                className="block w-full text-sm text-slate-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-300 hover:file:bg-white/15"
              />
              {modal.logoName ? (
                <span className="text-xs text-slate-500">{modal.logoName}</span>
              ) : (
                <span className="text-xs text-slate-400">No file chosen</span>
              )}
            </div>
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-300">Payment Methods</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {paymentOptionChoices.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 text-sm text-slate-300 hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={isPaymentMethodSelected(modal.paymentMethodIds, option.id)}
                    onChange={() => toggleMethod(option.id)}
                    className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action"
                  />
                  {option.name}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Currency</span>
            <select
              required
              value={modal.currency}
              onChange={(e) => setModal((m) => ({ ...m, currency: e.target.value }))}
              className={inputCls}
            >
              {currencyOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Minimum Limit</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={modal.minLimit}
                onChange={(e) => setModal((m) => ({ ...m, minLimit: e.target.value }))}
                className={inputCls}
                placeholder="Enter minimum limit"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Maximum Limit</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={modal.maxLimit}
                onChange={(e) => setModal((m) => ({ ...m, maxLimit: e.target.value }))}
                className={inputCls}
                placeholder="Enter maximum limit"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Platform Type</span>
            <select
              required
              value={modal.platformType}
              onChange={(e) => setModal((m) => ({ ...m, platformType: e.target.value }))}
              className={inputCls}
            >
              {platformTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">
              Terms & Conditions
            </span>
            <textarea
              required
              rows={4}
              value={modal.terms}
              onChange={(e) => setModal((m) => ({ ...m, terms: e.target.value }))}
              className={inputCls}
              placeholder="Enter terms and conditions"
            />
          </label>
        </ModalShell>
      ) : null}

      {termsModal ? (
        <div className="admin-modal-overlay" onClick={() => setTermsModal(null)}>
          <div
            className="admin-card w-full max-w-md overflow-visible p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">
                Terms & Conditions — {termsModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setTermsModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              {termsModal.terms || fallbackTerms}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setTermsModal(null)}
                className="admin-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function WalletsPanel() {
  const [meta, setMeta] = useState({
    paymentOptions: [],
    currencyTypes: ["USD"],
  });

  const refreshPaymentOptions = useCallback(async () => {
    const data = await fetchWalletMeta();
    setMeta({
      paymentOptions: Array.isArray(data.paymentOptions) ? data.paymentOptions : [],
      currencyTypes:
        Array.isArray(data.currencyTypes) && data.currencyTypes.length > 0
          ? data.currencyTypes
          : ["USD"],
    });
    return data;
  }, []);

  useEffect(() => {
    refreshPaymentOptions().catch(console.error);
  }, [refreshPaymentOptions]);

  return (
    <div className="mt-5 space-y-10">
      <WalletSection
        title="Top-up Wallets"
        activateLabel="Activate Topup Wallet"
        emptyMessage="No top-up wallets yet. Click Add Wallet to create one."
        addTitle="Add Wallet"
        editTitle="Edit Wallet"
        deleteConfirm="Delete this top-up wallet?"
        paymentOptionChoices={meta.paymentOptions}
        currencyOptions={meta.currencyTypes}
        platformTypes={TOPUP_WALLET_PLATFORM_TYPES}
        loadRows={fetchTopupWallets}
        fetchWalletById={fetchTopupWallet}
        onRefreshPaymentOptions={refreshPaymentOptions}
        createRow={createTopupWallet}
        updateRow={updateTopupWallet}
        deleteRow={deleteTopupWallet}
        toggleRowStatus={toggleTopupWalletStatus}
        fallbackTerms="Standard top-up wallet terms apply. Limits and processing times may vary by payment method."
      />

      <WalletSection
        title="Cash-out Wallets"
        activateLabel="Activate Cashout Wallet"
        emptyMessage="No cash-out wallets yet. Click Add Wallet to create one."
        addTitle="Add Cashout Wallet"
        editTitle="Edit Cashout Wallet"
        addSubtitle="Fill the below details to add a wallet."
        deleteConfirm="Delete this cash-out wallet?"
        paymentOptionChoices={meta.paymentOptions}
        currencyOptions={meta.currencyTypes}
        platformTypes={TOPUP_WALLET_PLATFORM_TYPES}
        loadRows={fetchCashoutWallets}
        fetchWalletById={fetchCashoutWallet}
        onRefreshPaymentOptions={refreshPaymentOptions}
        createRow={createCashoutWallet}
        updateRow={updateCashoutWallet}
        deleteRow={deleteCashoutWallet}
        toggleRowStatus={toggleCashoutWalletStatus}
        fallbackTerms="Standard cash-out wallet terms apply. Limits and processing times may vary by payment method."
      />
    </div>
  );
}
