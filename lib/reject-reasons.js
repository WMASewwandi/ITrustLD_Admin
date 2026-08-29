"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

export const REJECT_REASON_CATEGORIES = [
  { id: "deposit", label: "Deposits", description: "Deposit rejects and proof status" },
  { id: "withdrawal", label: "Withdrawals", description: "Withdrawal rejects and proof status" },
  { id: "kyc_nic", label: "KYC NIC", description: "Identity document rejection" },
  { id: "kyc_address", label: "KYC Address", description: "Address document rejection" },
  { id: "voucher_claim", label: "Voucher Claims", description: "Loyalty voucher claim rejection" },
  { id: "gift_claim", label: "Gift Claims", description: "Loyalty gift claim rejection" },
];

export const CUSTOM_REJECT_REASON = "Custom Message";

export function isCustomRejectReason(value) {
  const key = String(value || "").trim().toLowerCase();
  return key === "custom" || key === "custom message" || key === "other";
}

export function withCustomRejectOption(reasons = []) {
  const list = (Array.isArray(reasons) ? reasons : [])
    .map((item) => (typeof item === "string" ? item : item?.message))
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  if (list.some(isCustomRejectReason)) return list;
  return [...list, CUSTOM_REJECT_REASON];
}

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchRejectReasons(category = "") {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const query = params.toString();
  return apiRequest(`/admin/reject-reasons${query ? `?${query}` : ""}`, withToken());
}

export async function createRejectReason(payload) {
  return apiRequest("/admin/reject-reasons", {
    ...withToken(),
    method: "POST",
    body: payload,
  });
}

export async function updateRejectReason(id, payload) {
  return apiRequest(`/admin/reject-reasons/${id}/update`, {
    ...withToken(),
    method: "POST",
    body: payload,
  });
}

export async function moveRejectReason(id, direction) {
  return apiRequest(`/admin/reject-reasons/${id}/move`, {
    ...withToken(),
    method: "POST",
    body: { direction },
  });
}

export async function deleteRejectReason(id) {
  return apiRequest(`/admin/reject-reasons/${id}/delete`, {
    ...withToken(),
    method: "POST",
  });
}

export function useRejectReasonOptions(category) {
  const [reasons, setReasons] = useState([CUSTOM_REJECT_REASON]);
  const [loading, setLoading] = useState(Boolean(category));

  const reload = useCallback(async () => {
    if (!category) {
      setReasons([CUSTOM_REJECT_REASON]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchRejectReasons(category);
      setReasons(withCustomRejectOption(data?.reasons || []));
    } catch {
      setReasons([CUSTOM_REJECT_REASON]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { reasons, loading, reload };
}
