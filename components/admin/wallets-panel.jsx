"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import {
  CASHOUT_WALLET_PAYMENT_OPTIONS,
  CASHOUT_WALLETS,
  CURRENCY_TYPES,
  TOPUP_WALLET_PAYMENT_OPTIONS,
  TOPUP_WALLET_PLATFORM_TYPES,
  TOPUP_WALLETS,
} from "@/lib/mock-data";

const emptyForm = {
  name: "",
  logoName: "",
  logoUrl: null,
  paymentMethods: [],
  currency: "USDT",
  minLimit: "",
  maxLimit: "",
  platformType: "INT",
  terms: "",
  active: true,
  badgeColor: "#236B6B",
};

function nextId(rows, prefix) {
  const max = rows.reduce((acc, row) => {
    const n = Number(String(row.id).replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}-${max + 1}`;
}

function formatLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function WalletBadge({ name, color, logoUrl }) {
  const initials = String(name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm"
        />
      ) : (
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
          style={{ background: color || "#236B6B" }}
          aria-hidden
        >
          {initials}
        </span>
      )}
      <span className="text-base font-semibold text-slate-900">{name}</span>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children, onSave }) {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-card max-h-[90vh] w-full max-w-xl overflow-y-auto p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900">
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
            <button type="button" onClick={onClose} className="admin-btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 gap-y-1 border-b border-slate-100 py-2.5 last:border-b-0 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

function WalletSection({
  title,
  activateLabel,
  emptyMessage,
  addTitle,
  editTitle,
  addSubtitle,
  deleteConfirm,
  idPrefix,
  paymentOptions,
  initialRows,
  fallbackTerms,
}) {
  const [rows, setRows] = useState(initialRows);
  const [modal, setModal] = useState(null);
  const [termsModal, setTermsModal] = useState(null);

  const currencyOptions = CURRENCY_TYPES.filter((c) => c.active !== false).map((c) => c.code);

  function openAdd() {
    setModal({ mode: "add", ...emptyForm, paymentMethods: [] });
  }

  function openEdit(row) {
    setModal({
      mode: "edit",
      id: row.id,
      name: row.name,
      logoName: row.logoName || "",
      logoUrl: row.logoUrl || null,
      paymentMethods: Array.isArray(row.paymentMethods) ? [...row.paymentMethods] : [],
      currency: row.currency || "USDT",
      minLimit: row.minLimit === 0 || row.minLimit ? String(row.minLimit) : "",
      maxLimit: row.maxLimit === 0 || row.maxLimit ? String(row.maxLimit) : "",
      platformType: row.platformType || "INT",
      terms: row.terms || "",
      active: row.active,
      badgeColor: row.badgeColor || "#236B6B",
    });
  }

  function toggleMethod(method) {
    setModal((m) => {
      if (!m) return m;
      const selected = m.paymentMethods.includes(method)
        ? m.paymentMethods.filter((x) => x !== method)
        : [...m.paymentMethods, method];
      return { ...m, paymentMethods: selected };
    });
  }

  function onLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setModal((m) => (m ? { ...m, logoName: "", logoUrl: null } : m));
      return;
    }
    const url = URL.createObjectURL(file);
    setModal((m) => (m ? { ...m, logoName: file.name, logoUrl: url } : m));
  }

  function save() {
    if (!modal) return;
    const {
      mode,
      id,
      name,
      logoName,
      logoUrl,
      paymentMethods,
      minLimit,
      maxLimit,
      currency,
      platformType,
      terms,
      active,
      badgeColor,
    } = modal;

    if (!name.trim() || !currency || paymentMethods.length === 0) return;

    const payload = {
      name: name.trim(),
      logoName: logoName || null,
      logoUrl: logoUrl || null,
      paymentMethods: [...paymentMethods],
      minLimit: Number(minLimit) || 0,
      maxLimit: Number(maxLimit) || 0,
      currency,
      platformType: platformType || "INT",
      terms: terms?.trim() || "",
      active: Boolean(active),
      badgeColor: badgeColor || "#236B6B",
    };

    if (mode === "edit") {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...payload } : row)));
    } else {
      setRows((prev) => [...prev, { id: nextId(prev, idPrefix), ...payload }]);
    }
    setModal(null);
  }

  function toggleActive(id) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, active: !row.active } : row))
    );
  }

  function remove(id) {
    if (!window.confirm(deleteConfirm)) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  return (
    <section>
      <div className="admin-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <WalletBadge name={row.name} color={row.badgeColor} logoUrl={row.logoUrl} />
              <button
                type="button"
                onClick={() => toggleActive(row.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium transition ${
                  row.active
                    ? "text-theme-green-action"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded border ${
                    row.active
                      ? "border-theme-green-action bg-theme-green-action text-white"
                      : "border-slate-300 bg-white"
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

            <div className="flex flex-wrap gap-2 border-t border-slate-200 px-5 py-3.5">
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

      {rows.length === 0 ? (
        <div className="admin-card mt-5 p-8 text-center text-sm text-slate-400">{emptyMessage}</div>
      ) : null}

      {modal ? (
        <ModalShell
          title={modal.mode === "edit" ? editTitle : addTitle}
          subtitle={modal.mode === "add" ? addSubtitle : undefined}
          onClose={() => setModal(null)}
          onSave={save}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Wallet Name</span>
            <input
              required
              value={modal.name}
              onChange={(e) => setModal((m) => ({ ...m, name: e.target.value }))}
              className={inputCls}
              placeholder="Enter wallet name"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Logo</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={onLogoChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
              {modal.logoName ? (
                <span className="text-xs text-slate-500">{modal.logoName}</span>
              ) : (
                <span className="text-xs text-slate-400">No file chosen</span>
              )}
            </div>
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Payment Methods</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {paymentOptions.map((method) => (
                <label
                  key={method}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={modal.paymentMethods.includes(method)}
                    onChange={() => toggleMethod(method)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-theme-green-action"
                  />
                  {method}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Currency</span>
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
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Minimum Limit</span>
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
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Maximum Limit</span>
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
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Platform Type</span>
            <select
              required
              value={modal.platformType}
              onChange={(e) => setModal((m) => ({ ...m, platformType: e.target.value }))}
              className={inputCls}
            >
              {TOPUP_WALLET_PLATFORM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Terms & Conditions
            </span>
            <textarea
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
              <h3 className="text-lg font-semibold text-slate-900">
                Terms & Conditions — {termsModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setTermsModal(null)}
                className="text-slate-400 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
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
  return (
    <div className="mt-5 space-y-10">
      <WalletSection
        title="Top-up Wallets"
        activateLabel="Activate Topup Wallet"
        emptyMessage="No top-up wallets yet. Click Add Wallet to create one."
        addTitle="Add Wallet"
        editTitle="Edit Wallet"
        deleteConfirm="Delete this top-up wallet?"
        idPrefix="TW"
        paymentOptions={TOPUP_WALLET_PAYMENT_OPTIONS}
        initialRows={TOPUP_WALLETS}
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
        idPrefix="CW"
        paymentOptions={CASHOUT_WALLET_PAYMENT_OPTIONS}
        initialRows={CASHOUT_WALLETS}
        fallbackTerms="Standard cash-out wallet terms apply. Limits and processing times may vary by payment method."
      />
    </div>
  );
}
