"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import { useAppDialog } from "@/components/admin/app-dialog";
import {
  createBankAccount,
  createBinanceAccount,
  createCustomPayAccount,
  createNetellerAccount,
  createPayAccountCategory,
  createPayAccountField,
  createPmAccount,
  createSkrillAccount,
  createXmAccount,
  deleteCustomPayAccount,
  deletePayAccount,
  deletePayAccountCategory,
  deletePayAccountField,
  fetchPayAccounts,
  toggleCustomPayAccountStatus,
  togglePayAccountStatus,
  updateBankAccount,
  updateBinanceAccount,
  updateCustomPayAccount,
  updateNetellerAccount,
  updatePayAccountCategory,
  updatePayAccountField,
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

function SectionCard({ title, actionLabel, onAdd, children, delay, addDisabled, actions }) {
  return (
    <section className={`admin-card admin-fade-up overflow-visible p-0 ${delay || ""}`}>
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              disabled={addDisabled}
              className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {actionLabel}
            </button>
          ) : null}
        </div>
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
  const { alert, confirm } = useAppDialog();
  const [banks, setBanks] = useState([]);
  const [skrill, setSkrill] = useState([]);
  const [neteller, setNeteller] = useState([]);
  const [binance, setBinance] = useState([]);
  const [pm, setPm] = useState([]);
  const [xm, setXm] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [bankModal, setBankModal] = useState(null);
  const [skrillModal, setSkrillModal] = useState(null);
  const [netellerModal, setNetellerModal] = useState(null);
  const [binanceModal, setBinanceModal] = useState(null);
  const [pmModal, setPmModal] = useState(null);
  const [xmModal, setXmModal] = useState(null);
  const [categoryModal, setCategoryModal] = useState(null);
  const [fieldModal, setFieldModal] = useState(null);
  const [recordModal, setRecordModal] = useState(null);

  const applyPayAccounts = useCallback((data) => {
    setBanks(Array.isArray(data?.banks) ? data.banks : []);
    setSkrill(Array.isArray(data?.skrill) ? data.skrill : []);
    setNeteller(Array.isArray(data?.neteller) ? data.neteller : []);
    setBinance(Array.isArray(data?.binance) ? data.binance : []);
    setPm(Array.isArray(data?.pm) ? data.pm : []);
    setXm(Array.isArray(data?.xm) ? data.xm : []);
    setCustomCategories(Array.isArray(data?.customCategories) ? data.customCategories : []);
  }, []);

  const reloadAccounts = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchPayAccounts();
      applyPayAccounts(data);
    } catch (error) {
      console.error(error);
      if (!silent) {
        setBanks([]);
        setSkrill([]);
        setNeteller([]);
        setBinance([]);
        setPm([]);
        setXm([]);
        setCustomCategories([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyPayAccounts]);

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
      await alert(error?.message || "Could not save bank account.");
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
      await alert(error?.message || `Could not save ${config.label} wallet.`);
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
      await alert(error?.message || "Could not save Binance wallet.");
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
      await alert(error?.message || `Could not save ${config.label} account.`);
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory() {
    if (!categoryModal || saving) return;
    const name = String(categoryModal.name || "").trim();
    if (!name) return;

    setSaving(true);
    try {
      if (categoryModal.mode === "edit") {
        await updatePayAccountCategory(categoryModal.id, { name });
      } else {
        await createPayAccountCategory({ name });
      }
      setCategoryModal(null);
      await reloadAccounts({ silent: true });
    } catch (error) {
      await alert(error?.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  }

  async function saveField() {
    if (!fieldModal || saving) return;
    const label = String(fieldModal.label || "").trim();
    if (!label) return;

    setSaving(true);
    try {
      const payload = {
        label,
        type: fieldModal.type || "text",
        required: Boolean(fieldModal.required),
      };
      if (fieldModal.mode === "edit") {
        await updatePayAccountField(fieldModal.id, payload);
      } else {
        await createPayAccountField(fieldModal.categoryId, payload);
      }
      setFieldModal(null);
      await reloadAccounts({ silent: true });
    } catch (error) {
      await alert(error?.message || "Could not save field.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRecord() {
    if (!recordModal || saving) return;
    const category = customCategories.find(
      (item) => Number(item.id) === Number(recordModal.categoryId),
    );
    const fields = category?.fields || [];
    const missing = fields.find(
      (field) => field.required && !String(recordModal.values?.[field.key] || "").trim(),
    );
    if (missing) {
      await alert(`${missing.label} is required.`);
      return;
    }

    setSaving(true);
    try {
      const payload = { values: recordModal.values || {} };
      if (recordModal.mode === "edit") {
        await updateCustomPayAccount(recordModal.id, payload);
      } else {
        await createCustomPayAccount(recordModal.categoryId, payload);
      }
      setRecordModal(null);
      await reloadAccounts({ silent: true });
    } catch (error) {
      await alert(error?.message || "Could not save account.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(category) {
    if (
      !(await confirm(`Delete category “${category.name}” and all of its accounts?`, {
        title: "Delete category",
        confirmLabel: "Delete",
      }))
    ) {
      return;
    }
    try {
      await deletePayAccountCategory(category.id);
      await reloadAccounts({ silent: true });
    } catch (error) {
      await alert(error?.message || "Could not delete category.");
    }
  }

  async function handleDeleteField(field) {
    if (!(await confirm(`Delete field “${field.label}”?`, { title: "Delete field", confirmLabel: "Delete" }))) {
      return;
    }
    try {
      await deletePayAccountField(field.id);
      await reloadAccounts({ silent: true });
    } catch (error) {
      await alert(error?.message || "Could not delete field.");
    }
  }

  async function handleToggleCustomRecord(row) {
    const toggleKey = `custom-${row.id}`;
    if (togglingId === toggleKey) return;
    const nextActive = !row.active;
    setCustomCategories((prev) =>
      prev.map((category) =>
        Number(category.id) === Number(row.categoryId)
          ? {
              ...category,
              accounts: category.accounts.map((item) =>
                item.id === row.id ? { ...item, active: nextActive } : item,
              ),
            }
          : category,
      ),
    );
    setTogglingId(toggleKey);
    try {
      const data = await toggleCustomPayAccountStatus(row.id, nextActive);
      if (data?.account) {
        setCustomCategories((prev) =>
          prev.map((category) =>
            Number(category.id) === Number(row.categoryId)
              ? {
                  ...category,
                  accounts: category.accounts.map((item) =>
                    item.id === row.id ? data.account : item,
                  ),
                }
              : category,
          ),
        );
      }
    } catch (error) {
      setCustomCategories((prev) =>
        prev.map((category) =>
          Number(category.id) === Number(row.categoryId)
            ? {
                ...category,
                accounts: category.accounts.map((item) =>
                  item.id === row.id ? { ...item, active: row.active } : item,
                ),
              }
            : category,
        ),
      );
      await alert(error?.message || "Could not update account status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteCustomRecord(row) {
    if (!(await confirm("Delete this pay account?", { title: "Delete account", confirmLabel: "Delete" }))) return;
    try {
      await deleteCustomPayAccount(row.id);
      setCustomCategories((prev) =>
        prev.map((category) =>
          Number(category.id) === Number(row.categoryId)
            ? { ...category, accounts: category.accounts.filter((item) => item.id !== row.id) }
            : category,
        ),
      );
    } catch (error) {
      await alert(error?.message || "Could not delete pay account.");
    }
  }

  function openAddRecordModal(category) {
    if (!category.fields?.length) {
      setFieldModal({
        mode: "add",
        categoryId: category.id,
        label: "",
        type: "text",
        required: true,
      });
      return;
    }
    setRecordModal({
      mode: "add",
      categoryId: category.id,
      categoryName: category.name,
      values: Object.fromEntries(category.fields.map((field) => [field.key, ""])),
    });
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
      await alert(error?.message || "Could not update account status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(accountType, row, setRows) {
    if (!(await confirm("Delete this pay account?", { title: "Delete account", confirmLabel: "Delete" }))) return;

    try {
      await deletePayAccount(accountType, row.id);
      setRows((prev) => prev.filter((item) => item.id !== row.id));
    } catch (error) {
      await alert(error?.message || "Could not delete pay account.");
    }
  }

  const busy = loading || saving;

  return (
    <div className="mt-5 space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCategoryModal({ mode: "add", name: "" })}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Category
        </button>
      </div>

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

      {customCategories.map((category) => {
        const fields = category.fields || [];
        const accounts = category.accounts || [];
        const colSpan = Math.max(fields.length, 1) + 2;
        return (
          <SectionCard
            key={category.id}
            title={category.name}
            addDisabled={busy}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => setCategoryModal({ mode: "edit", id: category.id, name: category.name })}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFieldModal({
                      mode: "add",
                      categoryId: category.id,
                      label: "",
                      type: "text",
                      required: true,
                    })
                  }
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Field
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#E11D48] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </>
            }
            actionLabel="Add Account"
            onAdd={() => openAddRecordModal(category)}
          >
            <div className="border-b border-white/10 px-4 py-3">
              {fields.length ? (
                <div className="flex flex-wrap gap-2">
                  {fields.map((field) => (
                    <span
                      key={field.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200"
                    >
                      {field.label}
                      {field.required ? <span className="text-rose-300">*</span> : null}
                      <span className="text-slate-500">{field.type}</span>
                      <button
                        type="button"
                        title="Edit field"
                        disabled={busy}
                        onClick={() =>
                          setFieldModal({
                            mode: "edit",
                            id: field.id,
                            categoryId: category.id,
                            label: field.label,
                            type: field.type,
                            required: field.required,
                          })
                        }
                        className="text-slate-400 hover:text-white disabled:opacity-60"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        title="Delete field"
                        disabled={busy}
                        onClick={() => handleDeleteField(field)}
                        className="text-slate-400 hover:text-rose-300 disabled:opacity-60"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Add fields for this category, then add accounts.
                </p>
              )}
            </div>
            <table className="min-w-[480px] w-full text-left text-[13px]">
              <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                <tr>
                  {fields.length ? (
                    fields.map((field) => (
                      <th key={field.id} className="px-4 py-3">
                        {field.label}
                      </th>
                    ))
                  ) : (
                    <th className="px-4 py-3">Account</th>
                  )}
                  <th className="px-4 py-3">Set as Active</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-slate-400">
                      Loading {category.name} accounts…
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? accounts.map((row) => (
                      <tr key={row.id} className="border-t border-white/10 text-slate-300">
                        {fields.length ? (
                          fields.map((field) => (
                            <td key={field.key} className="px-4 py-3 font-medium text-white">
                              {row.values?.[field.key] || "—"}
                            </td>
                          ))
                        ) : (
                          <td className="px-4 py-3 text-slate-400">{row.summary || `Account #${row.id}`}</td>
                        )}
                        <td className="px-4 py-3">
                          <ActiveCheckbox
                            checked={row.active}
                            disabled={togglingId === `custom-${row.id}`}
                            onChange={() => handleToggleCustomRecord(row)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ActionButtons
                            disabled={busy || togglingId === `custom-${row.id}`}
                            onEdit={() =>
                              setRecordModal({
                                mode: "edit",
                                id: row.id,
                                categoryId: category.id,
                                categoryName: category.name,
                                values: { ...(row.values || {}) },
                              })
                            }
                            onDelete={() => handleDeleteCustomRecord(row)}
                          />
                        </td>
                      </tr>
                    ))
                  : null}
                {!loading && accounts.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-slate-400">
                      No {category.name} accounts yet. Click Add Account to create one.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </SectionCard>
        );
      })}

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

      {categoryModal ? (
        <ModalShell
          title={categoryModal.mode === "edit" ? "Rename Category" : "Add Category"}
          onClose={() => setCategoryModal(null)}
          onSave={saveCategory}
          saving={saving}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Category name</span>
            <input
              required
              value={categoryModal.name}
              onChange={(e) => setCategoryModal((m) => ({ ...m, name: e.target.value }))}
              className={inputCls}
              placeholder="e.g. Payoneer"
            />
          </label>
        </ModalShell>
      ) : null}

      {fieldModal ? (
        <ModalShell
          title={fieldModal.mode === "edit" ? "Edit Field" : "Add Field"}
          onClose={() => setFieldModal(null)}
          onSave={saveField}
          saving={saving}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Field name</span>
            <input
              required
              value={fieldModal.label}
              onChange={(e) => setFieldModal((m) => ({ ...m, label: e.target.value }))}
              className={inputCls}
              placeholder="e.g. Email"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Type</span>
            <select
              value={fieldModal.type}
              onChange={(e) => setFieldModal((m) => ({ ...m, type: e.target.value }))}
              className={inputCls}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(fieldModal.required)}
              onChange={(e) => setFieldModal((m) => ({ ...m, required: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 accent-theme-green-action"
            />
            Required
          </label>
        </ModalShell>
      ) : null}

      {recordModal ? (
        <ModalShell
          title={
            recordModal.mode === "edit"
              ? `Edit ${recordModal.categoryName || "Account"}`
              : `Add ${recordModal.categoryName || "Account"}`
          }
          onClose={() => setRecordModal(null)}
          onSave={saveRecord}
          saving={saving}
        >
          {(customCategories.find((item) => Number(item.id) === Number(recordModal.categoryId))?.fields || []).map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              <input
                required={field.required}
                type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                value={recordModal.values?.[field.key] || ""}
                onChange={(e) =>
                  setRecordModal((m) => ({
                    ...m,
                    values: { ...(m.values || {}), [field.key]: e.target.value },
                  }))
                }
                className={inputCls}
                placeholder={field.label}
              />
            </label>
          ))}
        </ModalShell>
      ) : null}
    </div>
  );
}
