"use client";

import { useEffect } from "react";
import { fetchAdminMe } from "@/lib/auth";
import { msUntilNextShiftGraceEnd } from "@/lib/sl-time";

const SHIFT_POLL_MS = 60_000;

/** After 00:15 SL grace, ended-shift executives are kicked on the next /me check. */
export default function AdminShiftSessionGuard() {
  useEffect(() => {
    let cancelled = false;
    let graceTimer = null;

    async function checkShift() {
      if (cancelled) return;
      try {
        await fetchAdminMe();
      } catch {
        // apiRequest kicks SHIFT_ENDED / SHIFT_MISMATCH sessions.
      }
    }

    const poll = setInterval(checkShift, SHIFT_POLL_MS);

    const delay = Math.max(0, msUntilNextShiftGraceEnd() + 1500);
    graceTimer = setTimeout(() => {
      checkShift();
    }, delay);

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (graceTimer) clearTimeout(graceTimer);
    };
  }, []);

  return null;
}
