"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const LOCATION_CHANGE_EVENT = "itrustld:locationchange";

function readWindowSearch() {
  if (typeof window === "undefined") return "";
  return window.location.search.replace(/^\?/, "");
}

function readWindowKey() {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
}

let historyPatched = false;

/**
 * Next.js Link / router.replace on the same path uses pushState/replaceState
 * and does not fire popstate. Without this, query-only navigations leave the
 * address bar updated while the page (and nav highlight) stay on the old tab.
 */
function ensureHistoryPatch() {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;

  const notify = () => {
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
  };

  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function patchedHistory() {
      const before = readWindowKey();
      const result = original.apply(this, arguments);
      const after = readWindowKey();
      if (after !== before) {
        queueMicrotask(notify);
      }
      return result;
    };
  }

  window.addEventListener("popstate", notify);
}

/**
 * Read the query string without useSearchParams() (Suspense remounts).
 * First server + client render both return "" so hydration matches. After mount
 * we track window.location.search, including same-path query changes.
 */
export function useLocationSearchString() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  useEffect(() => {
    ensureHistoryPatch();
    const sync = () => {
      const next = readWindowSearch();
      setSearch((prev) => (prev === next ? prev : next));
    };
    sync();
    window.addEventListener(LOCATION_CHANGE_EVENT, sync);
    return () => window.removeEventListener(LOCATION_CHANGE_EVENT, sync);
  }, []);

  useEffect(() => {
    setSearch(readWindowSearch());
  }, [pathname]);

  return search;
}

export function useLocationSearchParams() {
  const search = useLocationSearchString();
  return useMemo(() => new URLSearchParams(search), [search]);
}
