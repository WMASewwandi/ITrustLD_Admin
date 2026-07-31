"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import { useCan } from "@/contexts/admin-permissions";
import {
  addPointWithdrawalRate,
  createRates,
  deletePointWithdrawalRate,
  deleteRate,
  fetchRatesForMethod,
  updateDepositRate,
  updatePointWithdrawalRate,
  updateWithdrawalRate,
} from "@/lib/rates";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dateInputValue(value) {
  if (!value) return todayIso();
  return String(value).slice(0, 10);
}

function titleForMethod(method) {
  return `${method} Rates`;
}

function pointSectionTitle(method) {
  return `${method} Point Withdrawal Rates`;
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

function RatesTable({ title, columns, rows, emptyLabel, renderCells, onEdit, onDelete, canMutate, busy }) {
  return (
    <section className="admin-card admin-fade-up overflow-visible p-0">
      {title ? (
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-left text-[13px]">
          <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className={`px-4 py-3 ${col === "Action" ? "text-right" : ""}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/10 text-slate-300">
                {renderCells(row)}
                <td className="px-4 py-3 text-right">
                  <ActionButtons
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row)}
                    disabled={!canMutate || busy}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-400">
                  {emptyLabel}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function RatesPanel({ method }) {
  const canMutate = useCan("change_currency_configs");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentOption, setPaymentOption] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [pointRates, setPointRates] = useState([]);
  const [modal, setModal] = useState(null);
  const [pointModal, setPointModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRatesForMethod(method);
      setPaymentOption(data.paymentOption || null);
      setWallets(data.wallets || []);
      setDeposits(data.depositRates || []);
      setWithdrawals(data.withdrawalRates || []);
      setPointRates(data.pointWithdrawalRates || []);
    } catch (err) {
      setError(err.message || "Failed to load rates.");
      setPaymentOption(null);
      setWallets([]);
      setDeposits([]);
      setWithdrawals([]);
      setPointRates([]);
    } finally {
      setLoading(false);
    }
  }, [method]);

  useEffect(() => {
    load();
    setModal(null);
    setPointModal(null);
    setSuccess("");
  }, [load]);

  function openAdd() {
    setModal({
      mode: "add",
      walletId: wallets[0]?.id ? String(wallets[0].id) : "",
      depositRate: "",
      withdrawRate: "",
    });
  }

  function openEditDeposit(row) {
    setModal({
      mode: "edit",
      kind: "deposit",
      id: row.id,
      walletId: row.walletId ? String(row.walletId) : "",
      topupMethodId: row.topupMethodId,
      depositRate: String(row.depositRate),
    });
  }

  function openEditWithdrawal(row) {
    setModal({
      mode: "edit",
      kind: "withdrawal",
      id: row.id,
      walletId: row.walletId ? String(row.walletId) : "",
      cashoutMethodId: row.cashoutMethodId,
      withdrawRate: String(row.withdrawRate),
    });
  }

  function openAddPoint() {
    setPointModal({
      mode: "add",
      rate: "",
      applicableDate: todayIso(),
    });
  }

  function openEditPoint(row) {
    setPointModal({
      mode: "edit",
      id: row.id,
      rate: String(row.rate),
      applicableDate: dateInputValue(row.applicableDate),
    });
  }

  async function saveModal() {
    if (!modal || !paymentOption) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (modal.mode === "add") {
        await createRates({
          paymentOptionId: paymentOption.id,
          walletId: Number(modal.walletId),
          depositRate: modal.depositRate,
          withdrawalRate: modal.withdrawRate,
        });
        setSuccess("Rates saved successfully.");
      } else if (modal.kind === "deposit") {
        await updateDepositRate({
          depositRateId: modal.id,
          paymentOptionId: paymentOption.id,
          walletId: Number(modal.walletId),
          topupMethodId: modal.topupMethodId,
          rate: modal.depositRate,
        });
        setSuccess("Deposit rate updated.");
      } else {
        await updateWithdrawalRate({
          withdrawalRateId: modal.id,
          paymentOptionId: paymentOption.id,
          walletId: Number(modal.walletId),
          cashoutMethodId: modal.cashoutMethodId,
          rate: modal.withdrawRate,
        });
        setSuccess("Withdrawal rate updated.");
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message || "Failed to save rate.");
    } finally {
      setBusy(false);
    }
  }

  async function savePointModal() {
    if (!pointModal || !paymentOption) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (pointModal.mode === "add") {
        await addPointWithdrawalRate({
          paymentOptionId: paymentOption.id,
          rate: pointModal.rate,
          applicableDate: pointModal.applicableDate,
        });
        setSuccess("Point withdrawal rate added.");
      } else {
        await updatePointWithdrawalRate({
          pointWithdrawalRateId: pointModal.id,
          paymentOptionId: paymentOption.id,
          rate: pointModal.rate,
          applicableDate: pointModal.applicableDate,
        });
        setSuccess("Point withdrawal rate updated.");
      }
      setPointModal(null);
      await load();
    } catch (err) {
      setError(err.message || "Failed to save point withdrawal rate.");
    } finally {
      setBusy(false);
    }
  }

  async function removeDeposit(row) {
    if (!window.confirm("Delete this deposit rate?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteRate({ rateId: row.id, rateType: "deposit" });
      setSuccess("Deposit rate deleted.");
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete deposit rate.");
    } finally {
      setBusy(false);
    }
  }

  async function removeWithdrawal(row) {
    if (!window.confirm("Delete this withdrawal rate?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteRate({ rateId: row.id, rateType: "withdrawal" });
      setSuccess("Withdrawal rate deleted.");
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete withdrawal rate.");
    } finally {
      setBusy(false);
    }
  }

  async function removePoint(row) {
    if (!window.confirm("Delete this point withdrawal rate?")) return;
    setBusy(true);
    setError("");
    try {
      await deletePointWithdrawalRate(row.id);
      setSuccess("Point withdrawal rate deleted.");
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete point withdrawal rate.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-card mt-5 flex items-center gap-2 p-5 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading rates…
      </section>
    );
  }

  const isEdit = modal?.mode === "edit";
  const showDepositField = !isEdit || modal?.kind === "deposit";
  const showWithdrawField = !isEdit || modal?.kind === "withdrawal";
  const isPointEdit = pointModal?.mode === "edit";

  return (
    <div className="mt-5">
      {error ? <p className="mb-3 text-sm text-rose-400">{error}</p> : null}
      {success ? <p className="mb-3 text-sm text-theme-green-action">{success}</p> : null}

      <div className="admin-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white">{titleForMethod(method)}</h2>
        {canMutate ? (
          <button
            type="button"
            onClick={openAdd}
            disabled={busy || !wallets.length}
            className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add Rate
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-5">
        <RatesTable
          title="Deposit Rates"
          columns={["ID", "Admin ID", "Topup Method", "Deposit Rate", "Changed Date", "Action"]}
          rows={deposits}
          emptyLabel="No deposit rates yet."
          onEdit={openEditDeposit}
          onDelete={removeDeposit}
          canMutate={canMutate}
          busy={busy}
          renderCells={(row) => (
            <>
              <td className="px-4 py-3 font-medium text-white">{row.id}</td>
              <td className="px-4 py-3">{row.adminId}</td>
              <td className="px-4 py-3">{row.topupMethod}</td>
              <td className="px-4 py-3 font-semibold text-white">{row.depositRate}</td>
              <td className="px-4 py-3">{row.changedDate}</td>
            </>
          )}
        />

        <RatesTable
          title="Withdrawal Rates"
          columns={["ID", "Admin ID", "Cashout Method", "Withdraw Rate", "Changed Date", "Action"]}
          rows={withdrawals}
          emptyLabel="No withdrawal rates yet."
          onEdit={openEditWithdrawal}
          onDelete={removeWithdrawal}
          canMutate={canMutate}
          busy={busy}
          renderCells={(row) => (
            <>
              <td className="px-4 py-3 font-medium text-white">{row.id}</td>
              <td className="px-4 py-3">{row.adminId}</td>
              <td className="px-4 py-3">{row.cashoutMethod}</td>
              <td className="px-4 py-3 font-semibold text-white">{row.withdrawRate}</td>
              <td className="px-4 py-3">{row.changedDate}</td>
            </>
          )}
        />
      </div>

      <div className="mt-8">
        <div className="admin-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white">{pointSectionTitle(method)}</h2>
          {canMutate ? (
            <button
              type="button"
              onClick={openAddPoint}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add Point Withdrawal Rate
            </button>
          ) : null}
        </div>

        <div className="mt-5">
          <RatesTable
            columns={["ID", "Payment Option", "Rate", "Applicable Date", "Action"]}
            rows={pointRates}
            emptyLabel="No point withdrawal rates yet."
            onEdit={openEditPoint}
            onDelete={removePoint}
            canMutate={canMutate}
            busy={busy}
            renderCells={(row) => (
              <>
                <td className="px-4 py-3 font-medium text-white">{row.id}</td>
                <td className="px-4 py-3">{row.paymentOptionId ?? row.paymentOption}</td>
                <td className="px-4 py-3 font-semibold text-white">{row.rate}</td>
                <td className="px-4 py-3">{row.applicableDate}</td>
              </>
            )}
          />
        </div>
      </div>

      {modal ? (
        <div className="admin-modal-overlay" onClick={() => !busy && setModal(null)}>
          <div
            className="admin-card w-full max-w-lg overflow-visible p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">
                {isEdit ? `Edit ${method} Rate` : `Add New ${method} Rate`}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveModal();
              }}
              className="space-y-4"
            >
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  {isEdit && modal.kind === "withdrawal" ? "Cashout Method" : "Deposit / Withdraw Method"}
                </span>
                <select
                  required
                  value={modal.walletId}
                  onChange={(e) => setModal((m) => ({ ...m, walletId: e.target.value }))}
                  className={inputCls}
                  disabled={busy}
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </label>

              <div
                className={`grid gap-3 ${showDepositField && showWithdrawField ? "sm:grid-cols-2" : ""}`}
              >
                {showDepositField ? (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-300">Deposit Rate</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={isEdit || !String(modal.withdrawRate || "").trim()}
                      value={modal.depositRate}
                      onChange={(e) => setModal((m) => ({ ...m, depositRate: e.target.value }))}
                      className={inputCls}
                      disabled={busy}
                    />
                  </label>
                ) : null}
                {showWithdrawField ? (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-300">Withdrawal Rate</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={isEdit || !String(modal.depositRate || "").trim()}
                      value={modal.withdrawRate}
                      onChange={(e) => setModal((m) => ({ ...m, withdrawRate: e.target.value }))}
                      className={inputCls}
                      disabled={busy}
                    />
                  </label>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setModal(null)} className="admin-btn-secondary" disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={busy}>
                  {busy ? "Saving…" : isEdit ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pointModal ? (
        <div className="admin-modal-overlay" onClick={() => !busy && setPointModal(null)}>
          <div
            className="admin-card w-full max-w-lg overflow-visible p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">
                {isPointEdit ? "Update Point Withdrawal Rate" : "Add New Point Withdrawal Rate"}
              </h3>
              <button type="button" onClick={() => setPointModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                savePointModal();
              }}
              className="space-y-4"
            >
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Payment Option</span>
                <input
                  type="text"
                  readOnly
                  value={paymentOption?.name || method}
                  className={`${inputCls} cursor-not-allowed opacity-80`}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Point Withdrawal Rate</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={pointModal.rate}
                  onChange={(e) => setPointModal((m) => ({ ...m, rate: e.target.value }))}
                  className={inputCls}
                  disabled={busy}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Applicable Date</span>
                <input
                  type="date"
                  required
                  value={dateInputValue(pointModal.applicableDate)}
                  onChange={(e) => setPointModal((m) => ({ ...m, applicableDate: e.target.value }))}
                  className={inputCls}
                  disabled={busy}
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setPointModal(null)} className="admin-btn-secondary" disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={busy}>
                  {busy ? "Saving…" : isPointEdit ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
