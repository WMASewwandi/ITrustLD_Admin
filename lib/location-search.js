"use client";

import { useMemo, useSyncExternalStore } from "react";

const listeners = new Set();
let patched = false;

function currentSearch() {
  if (typeof window === "undefined") return "";
  return window.location.search.replace(/^\?/, "");
}

function notify() {
  listeners.forEach((listener) => listener());
}

function ensureHistoryPatch() {
  if (patched || typeof window === "undefined") return;
  patched = true;

  const wrap = (method) => {
    const original = history[method].bind(history);
    history[method] = (...args) => {
      const result = original(...args);
      notify();
      return result;
    };
  };

  wrap("pushState");
  wrap("replaceState");
  window.addEventListener("popstate", notify);
}

function subscribe(onStoreChange) {
  ensureHistoryPatch();
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

/** Search string without Next.js Suspense remounts (those look like a reload loop). */
export function useLocationSearchString() {
  return useSyncExternalStore(subscribe, currentSearch, () => "");
}

export function useLocationSearchParams() {
  const search = useLocationSearchString();
  return useMemo(() => new URLSearchParams(search), [search]);
}
