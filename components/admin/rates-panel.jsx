"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";
import {
  DEPOSIT_RATES_BY_METHOD,
  POINT_WITHDRAWAL_PAYMENT_OPTIONS,
  POINT_WITHDRAWAL_RATES_BY_METHOD,
  RATE_METHOD_OPTIONS,
  WITHDRAWAL_RATES_BY_METHOD,
} from "@/lib/mock-data";

function isRedeMethod(method) {
  return method === "REDE" || method === "Rede";
}

/** Normalize URL / nav method keys for mock-data lookups */
function ratesMethodKey(method) {
  if (isRedeMethod(method)) return "REDE";
  return method;
}

function demoAdminId(method) {
  return method === "Crypto" ||
    method === "Perfect Money" ||
    method === "Skrill" ||
    method === "Neteller" ||
    method === "XM" ||
    isRedeMethod(method)
    ? "1"
    : "admin";
}

function usesDateTime(method) {
  return (
    method === "Crypto" ||
    method === "Perfect Money" ||
    method === "Skrill" ||
    method === "Neteller" ||
    method === "XM" ||
    isRedeMethod(method)
  );
}

function displayMethodName(method) {
  if (method === "Bank Transfer") return "Bank transfer";
  if (method === "Perfect Money") return "Perfect money";
  if (method === "XM") return "Xm";
  if (isRedeMethod(method)) return "Rede";
  return method;
}

function cloneRows(source) {
  return (source || []).map((row) => ({ ...row }));
}

function nextId(rows) {
  const max = rows.reduce((acc, row) => {
    const n = Number(row.id);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return max + 1;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowDateTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return n.toFixed(2);
}

function formatApplicableDate(value) {
  if (!value) return nowDateTime();
  if (value.includes(" ")) return value;
  return `${value} 00:00:00`;
}

function dateInputValue(value) {
  if (!value) return todayIso();
  return String(value).slice(0, 10);
}

function titleForMethod(method) {
  return `${displayMethodName(method)} Rates`;
}

function modalTitleForMethod(method, mode) {
  const label = `${displayMethodName(method)} Rate`;
  return mode === "edit" ? `Edit ${label}` : `Add New ${label}`;
}

function pointSectionTitle(method) {
  return `${displayMethodName(method)} Point Withdrawal Rates`;
}

function defaultTransferMethod(method) {
  if (
    method === "Crypto" ||
    method === "Perfect Money" ||
    method === "Skrill" ||
    method === "Neteller" ||
    method === "XM" ||
    isRedeMethod(method)
  ) {
    return "XM";
  }
  return RATE_METHOD_OPTIONS[0];
}

function defaultPointPaymentOption(method) {
  if (method === "Crypto") return "Crypto";
  if (method === "Perfect Money") return "Perfect money";
  if (method === "Skrill") return "Skrill";
  if (method === "Neteller") return "Neteller";
  if (method === "XM") return "XM";
  if (isRedeMethod(method)) return "REDE";
  return POINT_WITHDRAWAL_PAYMENT_OPTIONS[0];
}

function showsPointWithdrawal(method) {
  return (
    method === "Crypto" ||
    method === "Perfect Money" ||
    method === "Skrill" ||
    method === "Neteller" ||
    method === "XM" ||
    isRedeMethod(method)
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

function RatesTable({ title, columns, rows, emptyLabel, renderCells, onEdit, onDelete }) {
  return (
    <section className="admin-card admin-fade-up overflow-visible p-0">
      {title ? (
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-left text-[13px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 text-slate-700">
                {renderCells(row)}
                <td className="px-4 py-3">
                  <ActionButtons onEdit={() => onEdit(row)} onDelete={() => onDelete(row.id)} />
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
  const dataKey = ratesMethodKey(method);
  const [deposits, setDeposits] = useState(() => cloneRows(DEPOSIT_RATES_BY_METHOD[dataKey]));
  const [withdrawals, setWithdrawals] = useState(() =>
    cloneRows(WITHDRAWAL_RATES_BY_METHOD[dataKey])
  );
  const [pointRates, setPointRates] = useState(() =>
    cloneRows(POINT_WITHDRAWAL_RATES_BY_METHOD[dataKey])
  );
  const [modal, setModal] = useState(null);
  const [pointModal, setPointModal] = useState(null);

  const showPointSection = showsPointWithdrawal(method);

  useEffect(() => {
    const key = ratesMethodKey(method);
    setDeposits(cloneRows(DEPOSIT_RATES_BY_METHOD[key]));
    setWithdrawals(cloneRows(WITHDRAWAL_RATES_BY_METHOD[key]));
    setPointRates(cloneRows(POINT_WITHDRAWAL_RATES_BY_METHOD[key]));
    setModal(null);
    setPointModal(null);
  }, [method]);

  function openAdd() {
    setModal({
      mode: "add",
      transferMethod: defaultTransferMethod(method),
      depositRate: "",
      withdrawRate: "",
    });
  }

  function openEditDeposit(row) {
    setModal({
      mode: "edit",
      kind: "deposit",
      id: row.id,
      transferMethod: row.topupMethod,
      depositRate: String(row.depositRate),
      withdrawRate: "",
    });
  }

  function openEditWithdrawal(row) {
    setModal({
      mode: "edit",
      kind: "withdrawal",
      id: row.id,
      transferMethod: row.cashoutMethod,
      depositRate: "",
      withdrawRate: String(row.withdrawRate),
    });
  }

  function openAddPoint() {
    setPointModal({
      mode: "add",
      paymentOption: defaultPointPaymentOption(method),
      rate: "",
      applicableDate: todayIso(),
    });
  }

  function openEditPoint(row) {
    setPointModal({
      mode: "edit",
      id: row.id,
      paymentOption: row.paymentOption,
      rate: String(row.rate),
      applicableDate: dateInputValue(row.applicableDate),
    });
  }

  function saveModal() {
    if (!modal) return;
    const transferMethod = (modal.transferMethod || "").trim();
    if (!transferMethod) return;

    const depositVal = String(modal.depositRate ?? "").trim();
    const withdrawVal = String(modal.withdrawRate ?? "").trim();
    const changedDate = usesDateTime(method) ? nowDateTime() : todayIso();
    const adminId = demoAdminId(method);

    if (modal.mode === "edit") {
      if (modal.kind === "deposit") {
        if (!depositVal) return;
        setDeposits((prev) =>
          prev.map((row) =>
            row.id === modal.id
              ? {
                  ...row,
                  topupMethod: transferMethod,
                  depositRate: formatRate(depositVal),
                  changedDate,
                  adminId,
                }
              : row
          )
        );
      } else {
        if (!withdrawVal) return;
        setWithdrawals((prev) =>
          prev.map((row) =>
            row.id === modal.id
              ? {
                  ...row,
                  cashoutMethod: transferMethod,
                  withdrawRate: formatRate(withdrawVal),
                  changedDate,
                  adminId,
                }
              : row
          )
        );
      }
      setModal(null);
      return;
    }

    if (!depositVal && !withdrawVal) return;

    if (depositVal) {
      setDeposits((prev) => [
        {
          id: nextId(prev),
          adminId,
          topupMethod: transferMethod,
          depositRate: formatRate(depositVal),
          changedDate,
        },
        ...prev,
      ]);
    }

    if (withdrawVal) {
      setWithdrawals((prev) => [
        {
          id: nextId(prev),
          adminId,
          cashoutMethod: transferMethod,
          withdrawRate: formatRate(withdrawVal),
          changedDate,
        },
        ...prev,
      ]);
    }

    setModal(null);
  }

  function savePointModal() {
    if (!pointModal) return;
    const paymentOption = (pointModal.paymentOption || "").trim();
    const rateVal = String(pointModal.rate ?? "").trim();
    if (!paymentOption || !rateVal) return;

    const applicableDate = formatApplicableDate(pointModal.applicableDate);
    const optionIndex = POINT_WITHDRAWAL_PAYMENT_OPTIONS.indexOf(paymentOption);
    const paymentOptionId = optionIndex >= 0 ? optionIndex + 1 : 2;

    if (pointModal.mode === "edit") {
      setPointRates((prev) =>
        prev.map((row) =>
          row.id === pointModal.id
            ? {
                ...row,
                paymentOption,
                paymentOptionId,
                rate: formatRate(rateVal),
                applicableDate,
              }
            : row
        )
      );
      setPointModal(null);
      return;
    }

    setPointRates((prev) => [
      {
        id: nextId(prev),
        paymentOption,
        paymentOptionId,
        rate: formatRate(rateVal),
        applicableDate,
      },
      ...prev,
    ]);
    setPointModal(null);
  }

  function removeDeposit(id) {
    if (!window.confirm("Delete this deposit rate?")) return;
    setDeposits((prev) => prev.filter((row) => row.id !== id));
  }

  function removeWithdrawal(id) {
    if (!window.confirm("Delete this withdrawal rate?")) return;
    setWithdrawals((prev) => prev.filter((row) => row.id !== id));
  }

  function removePoint(id) {
    if (!window.confirm("Delete this point withdrawal rate?")) return;
    setPointRates((prev) => prev.filter((row) => row.id !== id));
  }

  const isEdit = modal?.mode === "edit";
  const showDepositField = !isEdit || modal?.kind === "deposit";
  const showWithdrawField = !isEdit || modal?.kind === "withdrawal";
  const isPointEdit = pointModal?.mode === "edit";

  return (
    <div>
      <div className="admin-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titleForMethod(method)}</h1>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Add Rate
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <RatesTable
          title="Deposit Rates"
          columns={["ID", "Admin ID", "Topup Method", "Deposit Rate", "Changed Date", "Action"]}
          rows={deposits}
          emptyLabel="No deposit rates yet. Click Add Rate to create one."
          onEdit={openEditDeposit}
          onDelete={removeDeposit}
          renderCells={(row) => (
            <>
              <td className="px-4 py-3 font-medium text-slate-900">{row.id}</td>
              <td className="px-4 py-3">{row.adminId}</td>
              <td className="px-4 py-3">{row.topupMethod}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{row.depositRate}</td>
              <td className="px-4 py-3">{row.changedDate}</td>
            </>
          )}
        />

        <RatesTable
          title="Withdrawal Rates"
          columns={["ID", "Admin ID", "Cashout Method", "Withdraw Rate", "Changed Date", "Action"]}
          rows={withdrawals}
          emptyLabel="No withdrawal rates yet. Click Add Rate to create one."
          onEdit={openEditWithdrawal}
          onDelete={removeWithdrawal}
          renderCells={(row) => (
            <>
              <td className="px-4 py-3 font-medium text-slate-900">{row.id}</td>
              <td className="px-4 py-3">{row.adminId}</td>
              <td className="px-4 py-3">{row.cashoutMethod}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{row.withdrawRate}</td>
              <td className="px-4 py-3">{row.changedDate}</td>
            </>
          )}
        />
      </div>

      {showPointSection ? (
        <div className="mt-8">
          <div className="admin-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {pointSectionTitle(method)}
            </h1>
            <button
              type="button"
              onClick={openAddPoint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Add Point Withdrawal Rate
            </button>
          </div>

          <div className="mt-5">
            <RatesTable
              columns={["ID", "Payment Option", "Rate", "Applicable Date", "Action"]}
              rows={pointRates}
              emptyLabel="No point withdrawal rates yet. Click Add Point Withdrawal Rate to create one."
              onEdit={openEditPoint}
              onDelete={removePoint}
              renderCells={(row) => (
                <>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.id}</td>
                  <td className="px-4 py-3">{row.paymentOption}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.rate}</td>
                  <td className="px-4 py-3">{row.applicableDate}</td>
                </>
              )}
            />
          </div>
        </div>
      ) : null}

      {modal ? (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div
            className="admin-card w-full max-w-lg overflow-visible p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {modalTitleForMethod(method, modal.mode)}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-900"
              >
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
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Deposit / Withdraw Method
                </span>
                <select
                  required
                  value={modal.transferMethod}
                  onChange={(e) => setModal((m) => ({ ...m, transferMethod: e.target.value }))}
                  className={inputCls}
                >
                  {RATE_METHOD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {!RATE_METHOD_OPTIONS.includes(modal.transferMethod) && modal.transferMethod ? (
                    <option value={modal.transferMethod}>{modal.transferMethod}</option>
                  ) : null}
                </select>
              </label>

              <div
                className={`grid gap-3 ${showDepositField && showWithdrawField ? "sm:grid-cols-2" : ""}`}
              >
                {showDepositField ? (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                      Deposit Rate
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={isEdit || !String(modal.withdrawRate || "").trim()}
                      value={modal.depositRate}
                      onChange={(e) => setModal((m) => ({ ...m, depositRate: e.target.value }))}
                      className={inputCls}
                      placeholder="Enter deposit rate"
                    />
                  </label>
                ) : null}
                {showWithdrawField ? (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                      Withdrawal Rate
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={isEdit || !String(modal.depositRate || "").trim()}
                      value={modal.withdrawRate}
                      onChange={(e) => setModal((m) => ({ ...m, withdrawRate: e.target.value }))}
                      className={inputCls}
                      placeholder="Enter withdrawal rate"
                    />
                  </label>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setModal(null)} className="admin-btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                >
                  {isEdit ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pointModal ? (
        <div className="admin-modal-overlay" onClick={() => setPointModal(null)}>
          <div
            className="admin-card w-full max-w-lg overflow-visible p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {isPointEdit ? "Edit Point Withdrawal Rate" : "Add New Point Withdrawal Rate"}
              </h3>
              <button
                type="button"
                onClick={() => setPointModal(null)}
                className="text-slate-400 hover:text-slate-900"
              >
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
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Payment Option
                </span>
                <select
                  required
                  value={pointModal.paymentOption}
                  onChange={(e) => setPointModal((m) => ({ ...m, paymentOption: e.target.value }))}
                  className={inputCls}
                >
                  {POINT_WITHDRAWAL_PAYMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {!POINT_WITHDRAWAL_PAYMENT_OPTIONS.includes(pointModal.paymentOption) &&
                  pointModal.paymentOption ? (
                    <option value={pointModal.paymentOption}>{pointModal.paymentOption}</option>
                  ) : null}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Point Withdrawal Rate
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={pointModal.rate}
                  onChange={(e) => setPointModal((m) => ({ ...m, rate: e.target.value }))}
                  className={inputCls}
                  placeholder="Enter point withdrawal rate"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Applicable Date
                </span>
                <input
                  type="date"
                  required
                  value={dateInputValue(pointModal.applicableDate)}
                  onChange={(e) =>
                    setPointModal((m) => ({ ...m, applicableDate: e.target.value }))
                  }
                  className={inputCls}
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPointModal(null)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                >
                  {isPointEdit ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
