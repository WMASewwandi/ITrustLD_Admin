"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import {
  PAY_BANK_ACCOUNTS,
  PAY_NETELLER_WALLETS,
  PAY_SKRILL_WALLETS,
} from "@/lib/mock-data";

const emptyBank = { accountNumber: "", name: "", bank: "", branch: "" };
const emptyWallet = { email: "" };

function nextId(prefix, rows) {
  const max = rows.reduce((acc, row) => {
    const n = Number(String(row.id).replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}-${max + 1}`;
}

function setActiveOnly(rows, id) {
  return rows.map((row) => ({ ...row, active: row.id === id }));
}

function ActiveCheckbox({ checked, onChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action"
      title={checked ? "Active" : "Set as active"}
    />
  );
}

function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg bg-theme-green-action/90 p-1.5 text-white shadow-sm transition hover:brightness-110"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm transition hover:brightness-110"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SectionCard({ title, actionLabel, onAdd, children, delay }) {
  return (
    <section className={`admin-card admin-fade-up overflow-visible p-0 ${delay || ""}`}>
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function ModalShell({ title, onClose, children, onSave }) {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-card w-full max-w-md overflow-visible p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
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

export default function PayAccountsPanel() {
  const [banks, setBanks] = useState(PAY_BANK_ACCOUNTS);
  const [skrill, setSkrill] = useState(PAY_SKRILL_WALLETS);
  const [neteller, setNeteller] = useState(PAY_NETELLER_WALLETS);

  const [bankModal, setBankModal] = useState(null);
  const [skrillModal, setSkrillModal] = useState(null);
  const [netellerModal, setNetellerModal] = useState(null);

  function openAddBank() {
    setBankModal({ mode: "add", ...emptyBank });
  }

  function openEditBank(row) {
    setBankModal({
      mode: "edit",
      id: row.id,
      accountNumber: row.accountNumber,
      name: row.name,
      bank: row.bank,
      branch: row.branch,
    });
  }

  function saveBank() {
    if (!bankModal) return;
    const { mode, id, accountNumber, name, bank, branch } = bankModal;
    if (!accountNumber.trim() || !name.trim() || !bank.trim() || !branch.trim()) return;

    if (mode === "edit") {
      setBanks((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, accountNumber, name, bank, branch } : row
        )
      );
    } else {
      setBanks((prev) => [
        ...prev,
        {
          id: nextId("BA", prev),
          accountNumber,
          name,
          bank,
          branch,
          active: prev.length === 0,
        },
      ]);
    }
    setBankModal(null);
  }

  function openAddWallet(kind) {
    const payload = { mode: "add", ...emptyWallet };
    if (kind === "skrill") setSkrillModal(payload);
    else setNetellerModal(payload);
  }

  function openEditWallet(kind, row) {
    const payload = { mode: "edit", id: row.id, email: row.email };
    if (kind === "skrill") setSkrillModal(payload);
    else setNetellerModal(payload);
  }

  function saveWallet(kind) {
    const modal = kind === "skrill" ? skrillModal : netellerModal;
    const setRows = kind === "skrill" ? setSkrill : setNeteller;
    const setModal = kind === "skrill" ? setSkrillModal : setNetellerModal;
    const prefix = kind === "skrill" ? "SK" : "NT";
    if (!modal?.email?.trim()) return;

    if (modal.mode === "edit") {
      setRows((prev) =>
        prev.map((row) => (row.id === modal.id ? { ...row, email: modal.email.trim() } : row))
      );
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: nextId(prefix, prev),
          email: modal.email.trim(),
          active: prev.length === 0,
        },
      ]);
    }
    setModal(null);
  }

  return (
    <div className="mt-5 space-y-5">
      <SectionCard title="Bank Account" actionLabel="Add Account" onAdd={openAddBank}>
        <table className="min-w-[720px] w-full text-left text-[13px]">
          <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Account Number</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Set as Active</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((row) => (
              <tr key={row.id} className="border-t border-white/10 text-slate-300">
                <td className="px-4 py-3 font-medium text-white">{row.accountNumber}</td>
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.bank}</td>
                <td className="px-4 py-3">{row.branch}</td>
                <td className="px-4 py-3">
                  <ActiveCheckbox
                    checked={row.active}
                    onChange={() => setBanks((prev) => setActiveOnly(prev, row.id))}
                  />
                </td>
                <td className="px-4 py-3">
                  <ActionButtons
                    onEdit={() => openEditBank(row)}
                    onDelete={() => setBanks((prev) => prev.filter((r) => r.id !== row.id))}
                  />
                </td>
              </tr>
            ))}
            {banks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  No bank accounts yet. Click Add Account to create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard
        title="Skrill Wallet"
        actionLabel="Add Wallet"
        onAdd={() => openAddWallet("skrill")}
        delay="admin-fade-up-delay-1"
      >
        <table className="min-w-[480px] w-full text-left text-[13px]">
          <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Skrill Email</th>
              <th className="px-4 py-3">Set as Active</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {skrill.map((row) => (
              <tr key={row.id} className="border-t border-white/10 text-slate-300">
                <td className="px-4 py-3 font-medium text-white">{row.email}</td>
                <td className="px-4 py-3">
                  <ActiveCheckbox
                    checked={row.active}
                    onChange={() => setSkrill((prev) => setActiveOnly(prev, row.id))}
                  />
                </td>
                <td className="px-4 py-3">
                  <ActionButtons
                    onEdit={() => openEditWallet("skrill", row)}
                    onDelete={() => setSkrill((prev) => prev.filter((r) => r.id !== row.id))}
                  />
                </td>
              </tr>
            ))}
            {skrill.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                  No Skrill wallets yet. Click Add Wallet to create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard
        title="Neteller Wallet"
        actionLabel="Add Wallet"
        onAdd={() => openAddWallet("neteller")}
        delay="admin-fade-up-delay-2"
      >
        <table className="min-w-[480px] w-full text-left text-[13px]">
          <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Neteller Email</th>
              <th className="px-4 py-3">Set as Active</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {neteller.map((row) => (
              <tr key={row.id} className="border-t border-white/10 text-slate-300">
                <td className="px-4 py-3 font-medium text-white">{row.email}</td>
                <td className="px-4 py-3">
                  <ActiveCheckbox
                    checked={row.active}
                    onChange={() => setNeteller((prev) => setActiveOnly(prev, row.id))}
                  />
                </td>
                <td className="px-4 py-3">
                  <ActionButtons
                    onEdit={() => openEditWallet("neteller", row)}
                    onDelete={() => setNeteller((prev) => prev.filter((r) => r.id !== row.id))}
                  />
                </td>
              </tr>
            ))}
            {neteller.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                  No Neteller wallets yet. Click Add Wallet to create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </SectionCard>

      {bankModal ? (
        <ModalShell
          title={bankModal.mode === "edit" ? "Edit Bank Account" : "Add Bank Account"}
          onClose={() => setBankModal(null)}
          onSave={saveBank}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Account Number</span>
            <input
              required
              value={bankModal.accountNumber}
              onChange={(e) => setBankModal((m) => ({ ...m, accountNumber: e.target.value }))}
              className={inputCls}
              placeholder="e.g. 8001234567"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Name</span>
            <input
              required
              value={bankModal.name}
              onChange={(e) => setBankModal((m) => ({ ...m, name: e.target.value }))}
              className={inputCls}
              placeholder="Account holder name"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Bank</span>
            <input
              required
              value={bankModal.bank}
              onChange={(e) => setBankModal((m) => ({ ...m, bank: e.target.value }))}
              className={inputCls}
              placeholder="Bank name"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Branch</span>
            <input
              required
              value={bankModal.branch}
              onChange={(e) => setBankModal((m) => ({ ...m, branch: e.target.value }))}
              className={inputCls}
              placeholder="Branch"
            />
          </label>
        </ModalShell>
      ) : null}

      {skrillModal ? (
        <ModalShell
          title={skrillModal.mode === "edit" ? "Edit Skrill Wallet" : "Add Skrill Wallet"}
          onClose={() => setSkrillModal(null)}
          onSave={() => saveWallet("skrill")}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Skrill Email</span>
            <input
              required
              type="email"
              value={skrillModal.email}
              onChange={(e) => setSkrillModal((m) => ({ ...m, email: e.target.value }))}
              className={inputCls}
              placeholder="wallet@example.com"
            />
          </label>
        </ModalShell>
      ) : null}

      {netellerModal ? (
        <ModalShell
          title={netellerModal.mode === "edit" ? "Edit Neteller Wallet" : "Add Neteller Wallet"}
          onClose={() => setNetellerModal(null)}
          onSave={() => saveWallet("neteller")}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Neteller Email</span>
            <input
              required
              type="email"
              value={netellerModal.email}
              onChange={(e) => setNetellerModal((m) => ({ ...m, email: e.target.value }))}
              className={inputCls}
              placeholder="wallet@example.com"
            />
          </label>
        </ModalShell>
      ) : null}
    </div>
  );
}
