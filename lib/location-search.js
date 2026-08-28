"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

function readWindowSearch() {
  if (typeof window === "undefined") return "";
  return window.location.search.replace(/^\?/, "");
}

/**
 * Read the query string without useSearchParams() or history patching.
 * Next.js Suspense remounts and replaceState hooks were restarting admin pages.
 *
 * First server + client render both return "" so hydration matches. After mount
 * we read window.location.search on each render.
 */
export function useLocationSearchString() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const sync = () => setTick((n) => n + 1);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  void pathname;
  if (!mounted) return "";
  return readWindowSearch();
}

export function useLocationSearchParams() {
  const search = useLocationSearchString();
  return useMemo(() => new URLSearchParams(search), [search]);
}
