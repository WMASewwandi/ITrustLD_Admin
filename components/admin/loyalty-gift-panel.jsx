"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Trash2, Truck, X } from "lucide-react";
import CopyCell, { FilterField, IdNameCell, StatusPill, inputCls } from "@/components/admin/queue-ui";
import RejectModal from "@/components/admin/reject-modal";
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
import { notifyAdminNavCountsRefresh } from "@/lib/notifications";

const LEVEL_OPTIONS = [
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

function GiftFormModal({ open, title, initial, saving, onClose, onSave }) {
  const [giftTitle, setGiftTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audienceType, setAudienceType] = useState("normal");
  const [levels, setLevels] = useState([]);
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
  }, [open, initial]);

  if (!open || !mounted) return null;

  function toggleLevel(key) {
    setLevels((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
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
              onChange={(e) => setGiftTitle(e.target.value)}
              className={inputCls}
              placeholder="e.g. Gold Tier Welcome Hamper"
            />
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

          <div>
            <span className="mb-2 block text-xs text-slate-400">Customer Type</span>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_FORM_OPTIONS.map((option) => {
                const active = audienceType === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setAudienceType(option.key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-theme-green-action/50 bg-theme-green-action/20 text-theme-green-action"
                        : "border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
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
                        : "border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {level.label}
                  </button>
                );
              })}
            </div>
          </div>
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
            onClick={() => onSave({ title: giftTitle, description, audienceType, allowedLevels: levels })}
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

export default function LoyaltyGiftPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [deliverId, setDeliverId] = useState(null);
  const [detail, setDetail] = useState(null);

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
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, [audienceFilter.apiKey]);

  const loadClaims = useCallback(async () => {
    setClaimsLoading(true);
    setClaimsError("");
    try {
      const data = await fetchGiftClaims({ status: claimStatus, perPage: 50 });
      setClaims(data.claims || []);
    } catch (err) {
      setClaimsError(err.message || "Failed to load gift claims.");
      setClaims([]);
    } finally {
      setClaimsLoading(false);
    }
  }, [claimStatus]);

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
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveGift(values) {
    if (!values.title?.trim()) {
      setError("Gift title is required.");
      return;
    }
    if (!values.allowedLevels?.length) {
      setError("Select at least one allowed level.");
      return;
    }

    if (!values.audienceType) {
      setError("Select a customer type.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (giftModal?.mode === "edit") {
        await updateGift({
          id: giftModal.record.id,
          title: values.title.trim(),
          description: values.description?.trim() || "",
          audienceType: values.audienceType,
          allowedLevels: values.allowedLevels,
        });
      } else {
        await createGift({
          title: values.title.trim(),
          description: values.description?.trim() || "",
          audienceType: values.audienceType,
          allowedLevels: values.allowedLevels,
        });
      }
      setGiftModal(null);
      await loadGifts();
    } catch (err) {
      setError(err.message || "Failed to save gift.");
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove(claimId) {
    setBusy(true);
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

        {error ? <p className="px-5 pt-3 text-xs text-rose-400">{error}</p> : null}

        {section === "catalog" ? (
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">{gifts.length} gifts configured</p>
              <button
                type="button"
                onClick={() => setGiftModal({ mode: "create" })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2 text-sm font-semibold text-white"
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
                      <th className="px-3 py-3">Active</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gifts.map((gift) => (
                      <tr key={gift.id} className="border-t border-white/10 text-slate-300">
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
                          <ActiveCheckbox
                            checked={gift.is_active}
                            disabled={busy}
                            onChange={() =>
                              runAction(() =>
                                updateGiftState({ id: gift.id, isActive: !gift.is_active }),
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setGiftModal({ mode: "edit", record: gift })}
                              className="rounded-lg bg-theme-green-action/90 p-1.5 text-white disabled:opacity-60"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                runAction(() => deleteGift({ id: gift.id }))
                              }
                              className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!gifts.length ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-14 text-center text-slate-400">
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

            {claimsError ? <p className="mb-3 text-xs text-rose-400">{claimsError}</p> : null}

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
                                disabled={busy}
                                onClick={() => setRejectId(claim.id)}
                                className="rounded-lg bg-[#E11D48] p-1.5 text-white disabled:opacity-50"
                                title="Reject"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setApproveId(claim.id)}
                                className="rounded-lg bg-theme-green-action p-1.5 text-white disabled:opacity-50"
                                title="Approve"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : claim.status === "Approved" ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setDeliverId(claim.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#D1900F] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                              title="Mark delivered"
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
        onClose={() => setGiftModal(null)}
        onSave={handleSaveGift}
      />

      <DepositStatusConfirmModal
        open={Boolean(approveId)}
        title="Approve gift claim?"
        message={approveId ? `Claim #${approveId}` : undefined}
        confirmLabel="Approve"
        confirmClassName="bg-theme-green-action"
        busy={busy}
        onCancel={() => setApproveId(null)}
        onConfirm={() => handleApprove(approveId)}
      />

      <DepositStatusConfirmModal
        open={Boolean(deliverId)}
        title="Mark as delivered?"
        message={deliverId ? `Claim #${deliverId}` : undefined}
        confirmLabel="Confirm"
        confirmClassName="bg-[#D1900F]"
        busy={busy}
        onCancel={() => setDeliverId(null)}
        onConfirm={() => handleDeliver(deliverId)}
      />

      <RejectModal
        open={Boolean(rejectId)}
        title="Reject gift claim"
        onClose={() => setRejectId(null)}
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
