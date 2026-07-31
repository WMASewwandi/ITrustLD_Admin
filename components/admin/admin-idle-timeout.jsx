"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut } from "lucide-react";
import { logoutAdmin } from "@/lib/auth";
import {
  IDLE_LOGOUT_COUNTDOWN_SEC,
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
} from "@/lib/idle-timeout";

export default function AdminIdleTimeout() {
  const router = useRouter();
  const [phase, setPhase] = useState("active");
  const [countdown, setCountdown] = useState(IDLE_LOGOUT_COUNTDOWN_SEC);

  const phaseRef = useRef("active");
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const loggingOutRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const performLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    phaseRef.current = "expired";
    setPhase("expired");
    clearTimers();

    try {
      await logoutAdmin();
    } finally {
      router.replace("/login?reason=inactive");
    }
  }, [clearTimers, router]);

  const startCountdown = useCallback(() => {
    setCountdown(IDLE_LOGOUT_COUNTDOWN_SEC);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
  }, []);

  const showWarning = useCallback(() => {
    if (phaseRef.current !== "active") return;
    phaseRef.current = "warning";
    setPhase("warning");
    startCountdown();
  }, [startCountdown]);

  const scheduleTimers = useCallback(() => {
    clearTimers();
    lastActivityRef.current = Date.now();

    warningTimerRef.current = setTimeout(showWarning, IDLE_WARNING_MS);
    logoutTimerRef.current = setTimeout(() => {
      performLogout();
    }, IDLE_TIMEOUT_MS);
  }, [clearTimers, performLogout, showWarning]);

  const resetIdleTimer = useCallback(() => {
    if (phaseRef.current !== "active") return;
    scheduleTimers();
  }, [scheduleTimers]);

  const handleStayLoggedIn = useCallback(() => {
    phaseRef.current = "active";
    setPhase("active");
    setCountdown(IDLE_LOGOUT_COUNTDOWN_SEC);
    scheduleTimers();
  }, [scheduleTimers]);

  useEffect(() => {
    scheduleTimers();

    let lastReset = 0;
    const throttleMs = 2000;
    let scrollDebounce = null;

    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset < throttleMs) return;
      lastReset = now;
      resetIdleTimer();
    };

    const onScroll = () => {
      if (scrollDebounce) clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(onActivity, 1000);
    };

    const events = ["mousedown", "keydown", "keypress", "touchstart", "click"];
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("focus", onActivity);

    const onVisibility = () => {
      if (document.hidden) return;
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor >= IDLE_TIMEOUT_MS) {
        performLogout();
        return;
      }
      if (idleFor >= IDLE_WARNING_MS && phaseRef.current === "active") {
        showWarning();
      }
      resetIdleTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimers();
      if (scrollDebounce) clearTimeout(scrollDebounce);
      events.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("focus", onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [clearTimers, performLogout, resetIdleTimer, scheduleTimers, showWarning]);

  if (phase === "active") return null;

  if (phase === "warning") {
    return (
      <div className="admin-modal-overlay z-[100]" role="dialog" aria-modal="true" aria-labelledby="idle-warning-title">
        <div className="admin-card w-full max-w-md p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
            <Clock className="h-6 w-6" />
          </div>
          <h3 id="idle-warning-title" className="text-lg font-semibold text-white">
            Session timeout warning
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Your session is about to expire due to inactivity. You will be logged out automatically in{" "}
            <span className="font-semibold text-white">{countdown}</span> seconds.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => performLogout()}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-white/5"
            >
              Log out now
            </button>
            <button
              type="button"
              onClick={handleStayLoggedIn}
              className="rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Stay signed in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-modal-overlay z-[100]" role="dialog" aria-modal="true" aria-labelledby="idle-expired-title">
      <div className="admin-card w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
          <LogOut className="h-6 w-6" />
        </div>
        <h3 id="idle-expired-title" className="text-lg font-semibold text-white">
          Session expired
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          You were logged out due to 30 minutes of inactivity. Redirecting to sign in…
        </p>
      </div>
    </div>
  );
}
