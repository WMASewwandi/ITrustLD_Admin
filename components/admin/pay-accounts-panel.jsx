"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import {
  createBankAccount,
  createBinanceAccount,
  createNetellerAccount,
  createPmAccount,
  createSkrillAccount,
  createXmAccount,
  deletePayAccount,
  fetchPayAccounts,
  togglePayAccountStatus,
  updateBankAccount,
  updateBinanceAccount,
  updateNetellerAccount,
  updatePmAccount,
  updateSkrillAccount,
  updateXmAccount,
} from "@/lib/pay-accounts";

const emptyBank = { accountNumber: "", name: "", bank: "", branch: "" };
const emptyWallet = { email: "" };
const emptyBinance = { trc20WalletAddress: "", binanceEmail: "" };
const emptyAccountId = { accountId: "" };

function ActiveCheckbox({ checked, onChange, disabled }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 cursor-pointer rounded border-white/20 accent-theme-green-action disabled:cursor-not-allowed disabled:opacity-60"
      title={checked ? "Active" : "Set as active"}
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
        className="rounded-lg bg-theme-green-action/90 p-1.5 text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="rounded-lg bg-[#E11D48] p-1.5 text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SectionCard({ title, actionLabel, onAdd, children, delay, addDisabled }) {
  return (
    <section className={`admin-card admin-fade-up overflow-visible p-0 ${delay || ""}`}>
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          disabled={addDisabled}
          className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function ModalShell({ title, onClose, children, onSave, saving }) {
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

function EmailWalletSection({
  title,
  emailLabel,
  accountType,
  rows,
  loading,
  loadingLabel,
  emptyLabel,
  delay,
  busy,
  togglingId,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}) {
  return (
    <SectionCard title={title} actionLabel="Add Wallet" onAdd={onAdd} delay={delay} addDisabled={busy}>
      <table className="min-w-[480px] w-full text-left text-[13px]">
        <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">{emailLabel}</th>
            <th className="px-4 py-3">Set as Active</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                {loadingLabel}
              </td>
            </tr>
          ) : null}
          {!loading
            ? rows.map((row) => (
                <tr key={row.id} className="border-t border-white/10 text-slate-300">
                  <td className="px-4 py-3 font-medium text-white">{row.email}</td>
                  <td className="px-4 py-3">
                    <ActiveCheckbox
                      checked={row.active}
                      disabled={togglingId === `${accountType}-${row.id}`}
                      onChange={() => onToggle(row)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionButtons
                      disabled={busy || togglingId === `${accountType}-${row.id}`}
                      onEdit={() => onEdit(row)}
                      onDelete={() => onDelete(row)}
                    />
                  </td>
                </tr>
              ))
            : null}
          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                {emptyLabel}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </SectionCard>
  );
}

export default function PayAccountsPanel() {
  const [banks, setBanks] = useState([]);
  const [skrill, setSkrill] = useState([]);
  const [neteller, setNeteller] = useState([]);
  const [binance, setBinance] = useState([]);
  const [pm, setPm] = useState([]);
  const [xm, setXm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [bankModal, setBankModal] = useState(null);
  const [skrillModal, setSkrillModal] = useState(null);
  const [netellerModal, setNetellerModal] = useState(null);
  const [binanceModal, setBinanceModal] = useState(null);
  const [pmModal, setPmModal] = useState(null);
  const [xmModal, setXmModal] = useState(null);

  const reloadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPayAccounts();
      setBanks(Array.isArray(data?.banks) ? data.banks : []);
      setSkrill(Array.isArray(data?.skrill) ? data.skrill : []);
      setNeteller(Array.isArray(data?.neteller) ? data.neteller : []);
      setBinance(Array.isArray(data?.binance) ? data.binance : []);
      setPm(Array.isArray(data?.pm) ? data.pm : []);
      setXm(Array.isArray(data?.xm) ? data.xm : []);
    } catch (error) {
      console.error(error);
      setBanks([]);
      setSkrill([]);
      setNeteller([]);
      setBinance([]);
      setPm([]);
      setXm([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadAccounts();
  }, [reloadAccounts]);

  async function saveBank() {
    if (!bankModal || saving) return;
    const { mode, id, accountNumber, name, bank, branch } = bankModal;
    if (!accountNumber.trim() || !name.trim() || !bank.trim() || !branch.trim()) return;

    const payload = {
      accountNumber: accountNumber.trim(),
      name: name.trim(),
      bank: bank.trim(),
      branch: branch.trim(),
    };

    setSaving(true);
    try {
      if (mode === "edit") {
        const data = await updateBankAccount(id, payload);
        const account = data?.account;
        if (account) {
          setBanks((prev) => prev.map((row) => (row.id === id ? account : row)));
        } else {
          await reloadAccounts();
        }
      } else {
        const data = await createBankAccount(payload);
        const account = data?.account;
        if (account) {
          setBanks((prev) => [...prev, account]);
        } else {
          await reloadAccounts();
        }
      }
      setBankModal(null);
    } catch (error) {
      window.alert(error?.message || "Could not save bank account.");
    } finally {
      setSaving(false);
    }
  }

  async function saveWallet(kind) {
    const config = {
      skrill: {
        modal: skrillModal,
        setModal: setSkrillModal,
        setRows: setSkrill,
        createFn: createSkrillAccount,
        updateFn: updateSkrillAccount,
        label: "Skrill",
      },
      neteller: {
        modal: netellerModal,
        setModal: setNetellerModal,
        setRows: setNeteller,
        createFn: createNetellerAccount,
        updateFn: updateNetellerAccount,
        label: "Neteller",
      },
    }[kind];

    if (!config?.modal?.email?.trim() || saving) return;

    const payload = { email: config.modal.email.trim() };

    setSaving(true);
    try {
      if (config.modal.mode === "edit") {
        const data = await config.updateFn(config.modal.id, payload);
        const account = data?.account;
        if (account) {
          config.setRows((prev) =>
            prev.map((row) => (row.id === config.modal.id ? account : row)),
          );
        } else {
          await reloadAccounts();
        }
      } else {
        const data = await config.createFn(payload);
        const account = data?.account;
        if (account) {
          config.setRows((prev) => [...prev, account]);
        } else {
          await reloadAccounts();
        }
      }
      config.setModal(null);
    } catch (error) {
      window.alert(error?.message || `Could not save ${config.label} wallet.`);
    } finally {
      setSaving(false);
    }
  }

  async function saveBinance() {
    if (!binanceModal || saving) return;
    const { mode, id, trc20WalletAddress, binanceEmail } = binanceModal;
    if (!trc20WalletAddress.trim() || !binanceEmail.trim()) return;

    const payload = {
      trc20WalletAddress: trc20WalletAddress.trim(),
      binanceEmail: binanceEmail.trim(),
    };

    setSaving(true);
    try {
      if (mode === "edit") {
        const data = await updateBinanceAccount(id, payload);
        const account = data?.account;
        if (account) {
          setBinance((prev) => prev.map((row) => (row.id === id ? account : row)));
        } else {
          await reloadAccounts();
        }
      } else {
        const data = await createBinanceAccount(payload);
        const account = data?.account;
        if (account) {
          setBinance((prev) => [...prev, account]);
        } else {
          await reloadAccounts();
        }
      }
      setBinanceModal(null);
    } catch (error) {
      window.alert(error?.message || "Could not save Binance wallet.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAccountId(kind) {
    const config = {
      pm: {
        modal: pmModal,
        setModal: setPmModal,
        setRows: setPm,
        createFn: createPmAccount,
        updateFn: updatePmAccount,
        label: "Perfect Money",
      },
      xm: {
        modal: xmModal,
        setModal: setXmModal,
        setRows: setXm,
        createFn: createXmAccount,
        updateFn: updateXmAccount,
        label: "XM",
      },
    }[kind];

    if (!config?.modal?.accountId?.trim() || saving) return;

    const payload = { accountId: config.modal.accountId.trim() };

    setSaving(true);
    try {
      if (config.modal.mode === "edit") {
        const data = await config.updateFn(config.modal.id, payload);
        const account = data?.account;
        if (account) {
          config.setRows((prev) =>
            prev.map((row) => (row.id === config.modal.id ? account : row)),
          );
        } else {
          await reloadAccounts();
        }
      } else {
        const data = await config.createFn(payload);
        const account = data?.account;
        if (account) {
          config.setRows((prev) => [...prev, account]);
        } else {
          await reloadAccounts();
        }
      }
      config.setModal(null);
    } catch (error) {
      window.alert(error?.message || `Could not save ${config.label} account.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(accountType, row, setRows) {
    const toggleKey = `${accountType}-${row.id}`;
    if (togglingId === toggleKey) return;

    const nextActive = !row.active;
    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, active: nextActive } : item)));
    setTogglingId(toggleKey);

    try {
      const data = await togglePayAccountStatus(accountType, row.id, nextActive);
      if (data?.account) {
        setRows((prev) => prev.map((item) => (item.id === row.id ? data.account : item)));
      }
    } catch (error) {
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, active: row.active } : item)));
      window.alert(error?.message || "Could not update account status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(accountType, row, setRows) {
    if (!window.confirm("Delete this pay account?")) return;

    try {
      await deletePayAccount(accountType, row.id);
      setRows((prev) => prev.filter((item) => item.id !== row.id));
    } catch (error) {
      window.alert(error?.message || "Could not delete pay account.");
    }
  }

  const busy = loading || saving;

  return (
    <div className="mt-5 space-y-5">
      <SectionCard
        title="Bank Account"
        actionLabel="Add Account"
        onAdd={() => setBankModal({ mode: "add", ...emptyBank })}
        addDisabled={busy}
      >
        <table className="min-w-[720px] w-full text-left text-[13px]">
          <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Account Number</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Set as Active</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  Loading bank accounts…
                </td>
              </tr>
            ) : null}
            {!loading
              ? banks.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-slate-300">
                    <td className="px-4 py-3 font-medium text-white">{row.accountNumber}</td>
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.bank}</td>
                    <td className="px-4 py-3">{row.branch}</td>
                    <td className="px-4 py-3">
                      <ActiveCheckbox
                        checked={row.active}
                        disabled={togglingId === `bank-${row.id}`}
                        onChange={() => handleToggleStatus("bank", row, setBanks)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionButtons
                        disabled={busy || togglingId === `bank-${row.id}`}
                        onEdit={() =>
                          setBankModal({
                            mode: "edit",
                            id: row.id,
                            accountNumber: row.accountNumber,
                            name: row.name,
                            bank: row.bank,
                            branch: row.branch,
                          })
                        }
                        onDelete={() => handleDelete("bank", row, setBanks)}
                      />
                    </td>
                  </tr>
                ))
              : null}
            {!loading && banks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  No bank accounts yet. Click Add Account to create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </SectionCard>

      <EmailWalletSection
        title="Skrill Wallet"
        emailLabel="Skrill Email"
        accountType="skrill"
        rows={skrill}
        loading={loading}
        loadingLabel="Loading Skrill wallets…"
        emptyLabel="No Skrill wallets yet. Click Add Wallet to create one."
        delay="admin-fade-up-delay-1"
        busy={busy}
        togglingId={togglingId}
        onAdd={() => setSkrillModal({ mode: "add", ...emptyWallet })}
        onEdit={(row) => setSkrillModal({ mode: "edit", id: row.id, email: row.email })}
        onToggle={(row) => handleToggleStatus("skrill", row, setSkrill)}
        onDelete={(row) => handleDelete("skrill", row, setSkrill)}
      />

      <EmailWalletSection
        title="Neteller Wallet"
        emailLabel="Neteller Email"
        accountType="neteller"
        rows={neteller}
        loading={loading}
        loadingLabel="Loading Neteller wallets…"
        emptyLabel="No Neteller wallets yet. Click Add Wallet to create one."
        delay="admin-fade-up-delay-2"
        busy={busy}
        togglingId={togglingId}
        onAdd={() => setNetellerModal({ mode: "add", ...emptyWallet })}
        onEdit={(row) => setNetellerModal({ mode: "edit", id: row.id, email: row.email })}
        onToggle={(row) => handleToggleStatus("neteller", row, setNeteller)}
        onDelete={(row) => handleDelete("neteller", row, setNeteller)}
      />

      <SectionCard
        title="Crypto Wallet (Binance)"
        actionLabel="Add Wallet"
        onAdd={() => setBinanceModal({ mode: "add", ...emptyBinance })}
        delay="admin-fade-up-delay-3"
        addDisabled={busy}
      >
        <table className="min-w-[720px] w-full text-left text-[13px]">
          <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">TRC20 Wallet Address</th>
              <th className="px-4 py-3">Binance Email</th>
              <th className="px-4 py-3">Set as Active</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  Loading Binance wallets…
                </td>
              </tr>
            ) : null}
            {!loading
              ? binance.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-slate-300">
                    <td className="px-4 py-3 font-medium text-white">{row.trc20WalletAddress}</td>
                    <td className="px-4 py-3">{row.binanceEmail}</td>
                    <td className="px-4 py-3">
                      <ActiveCheckbox
                        checked={row.active}
                        disabled={togglingId === `binance-${row.id}`}
                        onChange={() => handleToggleStatus("binance", row, setBinance)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionButtons
                        disabled={busy || togglingId === `binance-${row.id}`}
                        onEdit={() =>
                          setBinanceModal({
                            mode: "edit",
                            id: row.id,
                            trc20WalletAddress: row.trc20WalletAddress,
                            binanceEmail: row.binanceEmail,
                          })
                        }
                        onDelete={() => handleDelete("binance", row, setBinance)}
                      />
                    </td>
                  </tr>
                ))
              : null}
            {!loading && binance.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  No Binance wallets yet. Click Add Wallet to create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard
        title="Perfect Money Account"
        actionLabel="Add Account"
        onAdd={() => setPmModal({ mode: "add", ...emptyAccountId })}
        delay="admin-fade-up-delay-4"
        addDisabled={busy}
      >
        <table className="min-w-[480px] w-full text-left text-[13px]">
          <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">PM Account ID</th>
              <th className="px-4 py-3">Set as Active</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                  Loading Perfect Money accounts…
                </td>
              </tr>
            ) : null}
            {!loading
              ? pm.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-slate-300">
                    <td className="px-4 py-3 font-medium text-white">{row.accountId}</td>
                    <td className="px-4 py-3">
                      <ActiveCheckbox
                        checked={row.active}
                        disabled={togglingId === `pm-${row.id}`}
                        onChange={() => handleToggleStatus("pm", row, setPm)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionButtons
                        disabled={busy || togglingId === `pm-${row.id}`}
                        onEdit={() =>
                          setPmModal({ mode: "edit", id: row.id, accountId: row.accountId })
                        }
                        onDelete={() => handleDelete("pm", row, setPm)}
                      />
                    </td>
                  </tr>
                ))
              : null}
            {!loading && pm.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                  No Perfect Money accounts yet. Click Add Account to create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard
        title="XM Local Deposit Account"
        actionLabel="Add Account"
        onAdd={() => setXmModal({ mode: "add", ...emptyAccountId })}
        delay="admin-fade-up-delay-5"
        addDisabled={busy}
      >
        <table className="min-w-[480px] w-full text-left text-[13px]">
          <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">XM Account ID</th>
              <th className="px-4 py-3">Set as Active</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                  Loading XM accounts…
                </td>
              </tr>
            ) : null}
            {!loading
              ? xm.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-slate-300">
                    <td className="px-4 py-3 font-medium text-white">{row.accountId}</td>
                    <td className="px-4 py-3">
                      <ActiveCheckbox
                        checked={row.active}
                        disabled={togglingId === `xm-${row.id}`}
                        onChange={() => handleToggleStatus("xm", row, setXm)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionButtons
                        disabled={busy || togglingId === `xm-${row.id}`}
                        onEdit={() =>
                          setXmModal({ mode: "edit", id: row.id, accountId: row.accountId })
                        }
                        onDelete={() => handleDelete("xm", row, setXm)}
                      />
                    </td>
                  </tr>
                ))
              : null}
            {!loading && xm.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                  No XM accounts yet. Click Add Account to create one.
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
          saving={saving}
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
          saving={saving}
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
          saving={saving}
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

      {binanceModal ? (
        <ModalShell
          title={binanceModal.mode === "edit" ? "Edit Binance Wallet" : "Add Binance Wallet"}
          onClose={() => setBinanceModal(null)}
          onSave={saveBinance}
          saving={saving}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">
              TRC20 Wallet Address
            </span>
            <input
              required
              value={binanceModal.trc20WalletAddress}
              onChange={(e) =>
                setBinanceModal((m) => ({ ...m, trc20WalletAddress: e.target.value }))
              }
              className={inputCls}
              placeholder="TRC20 wallet address"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Binance Email</span>
            <input
              required
              type="email"
              value={binanceModal.binanceEmail}
              onChange={(e) => setBinanceModal((m) => ({ ...m, binanceEmail: e.target.value }))}
              className={inputCls}
              placeholder="binance@example.com"
            />
          </label>
        </ModalShell>
      ) : null}

      {pmModal ? (
        <ModalShell
          title={pmModal.mode === "edit" ? "Edit Perfect Money Account" : "Add Perfect Money Account"}
          onClose={() => setPmModal(null)}
          onSave={() => saveAccountId("pm")}
          saving={saving}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">PM Account ID</span>
            <input
              required
              value={pmModal.accountId}
              onChange={(e) => setPmModal((m) => ({ ...m, accountId: e.target.value }))}
              className={inputCls}
              placeholder="Perfect Money account ID"
            />
          </label>
        </ModalShell>
      ) : null}

      {xmModal ? (
        <ModalShell
          title={xmModal.mode === "edit" ? "Edit XM Account" : "Add XM Account"}
          onClose={() => setXmModal(null)}
          onSave={() => saveAccountId("xm")}
          saving={saving}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">XM Account ID</span>
            <input
              required
              value={xmModal.accountId}
              onChange={(e) => setXmModal((m) => ({ ...m, accountId: e.target.value }))}
              className={inputCls}
              placeholder="XM account ID"
            />
          </label>
        </ModalShell>
      ) : null}
    </div>
  );
}
