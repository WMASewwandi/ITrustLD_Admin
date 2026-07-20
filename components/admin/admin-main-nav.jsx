"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  Bell,
  Bookmark,
  ChevronDown,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { DEFAULT_BOOKMARKS, TOP_NAV } from "@/lib/mock-data";

const NOTIFS = [
  ["Deposits", "4 pending approvals", "/transactions?tab=deposits&status=Pending"],
  ["Withdrawals", "7 awaiting processing", "/transactions?tab=withdrawals&status=Pending"],
  ["Users", "4 KYC pending", "/users?filter=pending"],
  ["Loyalty", "11 pending claims/orders", "/loyalty?tab=vouchers&status=Pending"],
];

function pathMatches(pathname, search, href) {
  if (!href) return false;
  const [path, query = ""] = href.split("?");
  if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
  if (!query) return true;
  const want = new URLSearchParams(query);
  for (const [k, v] of want.entries()) {
    if ((search.get(k) || "") !== v) return false;
  }
  return true;
}

function categoryActive(pathname, search, cat) {
  if (cat.href) {
    const [path] = cat.href.split("?");
    return pathname === path || pathname.startsWith(`${path}/`);
  }
  return (cat.groups || []).some((g) =>
    (g.items || []).some((item) => pathMatches(pathname, search, item.href))
  );
}

function itemActive(pathname, search, href) {
  return pathMatches(pathname, search, href);
}

function NavInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(null);
  const [mobile, setMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS);
  const wrapRef = useRef(null);

  useEffect(() => {
    setOpen(null);
    setMobile(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(null);
        setProfileOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function logout() {
    localStorage.removeItem("itrustld_admin_auth");
    router.replace("/login");
  }

  function toggleBookmark() {
    const href = `${pathname}${search.toString() ? `?${search}` : ""}`;
    const exists = bookmarks.some((b) => b.href === href);
    if (exists) {
      setBookmarks((prev) => prev.filter((b) => b.href !== href));
      return;
    }
    const label =
      TOP_NAV.find((c) => categoryActive(pathname, search, c))?.label || "Page";
    setBookmarks((prev) => [...prev, { label, href, badge: null }]);
  }

  const currentBookmarked = bookmarks.some(
    (b) => b.href === `${pathname}${search.toString() ? `?${search}` : ""}`
  );

  return (
    <header className="admin-topbar z-40 border-b border-white/10 text-white" ref={wrapRef}>
      {/* Bookmarks strip — concept 4.7 */}
      <div className="flex items-stretch border-b border-white/8 bg-gradient-to-r from-white/[0.04] via-transparent to-white/[0.03]">
        <div className="flex shrink-0 items-center gap-2 border-r border-white/8 bg-white/[0.03] px-3 py-2 sm:px-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-white/80">
            <Bookmark className="h-3.5 w-3.5" />
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Quick access</p>
            <p className="text-[11px] font-medium text-white/75">Bookmarks</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2 py-1.5 sm:px-3">
          {bookmarks.length === 0 ? (
            <p className="px-2 text-[11px] text-white/40">No bookmarks yet — pin a page to jump back fast.</p>
          ) : (
            bookmarks.map((b) => {
              const active = `${pathname}${search.toString() ? `?${search}` : ""}` === b.href;
              return (
                <Link
                  key={b.href}
                  href={b.href}
                  className={`group inline-flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition ${
                    active
                      ? "bg-white/12 text-white/90"
                      : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white/90" : "bg-white/30 group-hover:bg-white/60"}`} />
                  <span>{b.label}</span>
                  {b.badge ? (
                    <span className="rounded-md bg-admin-danger/90 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {b.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })
          )}
        </div>

        <div className="flex shrink-0 items-center border-l border-white/8 px-2 sm:px-3">
          <button
            type="button"
            onClick={toggleBookmark}
            title={currentBookmarked ? "Remove bookmark" : "Bookmark this page"}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
              currentBookmarked
                ? "bg-white/12 text-white/90"
                : "text-white/55 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${currentBookmarked ? "fill-white/90" : ""}`} />
            <span className="hidden sm:inline">{currentBookmarked ? "Pinned" : "Pin page"}</span>
          </button>
        </div>
      </div>

      <div className="relative flex h-[64px] items-center justify-between gap-3 px-3 sm:px-5">
        <div className="relative z-10 flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobile((v) => !v)}
            className="rounded-xl border border-white/15 bg-black/25 p-2.5 text-white xl:hidden"
            aria-label="Open menu"
          >
            {mobile ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link href="/dashboard" className="inline-flex shrink-0 items-center">
            <img
              src="/assets/img/logos/logo-itrustld-wide.png"
              alt="iTrustLD"
              className="h-8 w-auto object-contain sm:h-9"
            />
          </Link>
        </div>

        {/* Horizontal top nav — centered between logo and controls */}
        <nav className="hidden min-w-0 flex-1 justify-center xl:flex">
          <div className="flex items-center gap-0.5">
            {TOP_NAV.map((cat, catIndex) => {
              const active = categoryActive(pathname, search, cat);
              const isOpen = open === cat.id;
              const groupCount = cat.groups?.length || 0;
              const multiColumn = groupCount > 1;
              const alignRight = catIndex >= TOP_NAV.length - 3;
              if (cat.href) {
                return (
                  <Link
                    key={cat.id}
                    href={cat.href}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[12.5px] font-medium transition ${
                      active
                        ? "bg-white/10 font-semibold text-white/90 shadow-[inset_0_-2px_0_0_rgba(255,255,255,0.9)]"
                        : "text-white/75 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </Link>
                );
              }
              return (
                <div key={cat.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : cat.id)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[12.5px] font-medium transition ${
                      active
                        ? "bg-white/10 font-semibold text-white/90 shadow-[inset_0_-2px_0_0_rgba(255,255,255,0.9)]"
                        : "text-white/75 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {cat.label}
                    {cat.badge ? (
                      <span className="admin-badge-glow h-5 min-w-5 px-1.5 text-[10px]">{cat.badge}</span>
                    ) : null}
                    <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen ? (
                    <div
                      className={`absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/12 bg-[#1a1b2a]/98 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl ${
                        alignRight ? "right-0" : "left-0"
                      } ${multiColumn ? "w-[min(92vw,480px)]" : "w-56"}`}
                    >
                      {cat.summary ? (
                        <p className="border-b border-white/10 bg-black/25 px-4 py-2.5 text-xs text-white/65">
                          {cat.summary}
                        </p>
                      ) : null}
                      <div className={`grid gap-1 p-2 ${multiColumn ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                        {(cat.groups || []).map((group) => (
                          <div key={group.label} className="rounded-xl bg-white/[0.02] p-2">
                            <p className="mb-1.5 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                              {group.label}
                              {group.badge ? (
                                <span className="admin-badge-glow h-4 min-w-4 px-1 text-[9px]">{group.badge}</span>
                              ) : null}
                            </p>
                            {(group.items || []).map((item) => {
                              const activeItem = itemActive(pathname, search, item.href);
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setOpen(null)}
                                  className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition ${
                                    activeItem
                                      ? "bg-white/10 font-semibold text-white/90"
                                      : "text-white/85 hover:bg-white/5 hover:text-white"
                                  }`}
                                >
                                  {item.label}
                                  {item.badge ? (
                                    <span className="admin-badge-glow h-4 min-w-4 px-1 text-[9px]">{item.badge}</span>
                                  ) : null}
                                </Link>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
                setOpen(null);
              }}
              className="relative rounded-xl border border-white/15 bg-black/25 p-2.5 text-white/85 transition hover:border-teal-300/40 hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="admin-badge-glow absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]">26</span>
            </button>
            {notifOpen ? (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-white/12 bg-[#1a1b2a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="border-b border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-xs text-white/50">Section queues · live alerts</p>
                </div>
                <div className="max-h-64 overflow-auto py-1">
                  {NOTIFS.map(([title, body, href]) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setNotifOpen(false)}
                      className="block border-b border-white/5 px-4 py-3 transition hover:bg-white/[0.06]"
                    >
                      <p className="text-sm font-medium text-white">{title}</p>
                      <p className="text-xs text-white/55">{body}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setNotifOpen(false);
                setOpen(null);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-admin-teal text-white transition hover:border-teal-300/40"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
              <User className="h-4 w-4" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#1a1b2a] bg-theme-green-action" />
            </button>
            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/12 bg-[#1a1b2a]/95 py-1 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-semibold text-white">Super Admin</p>
                  <p className="text-[11px] text-white/50">System Admin</p>
                </div>
                <Link href="/performance" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-white/90 hover:bg-white/5">
                  My Performance
                </Link>
                <Link href="/team-performance" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-white/90 hover:bg-white/5">
                  Team Performance
                </Link>
                <button type="button" onClick={logout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-300 hover:bg-white/5">
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile / tablet accordion menu */}
      {mobile ? (
        <div className="max-h-[70vh] overflow-y-auto border-t border-white/10 bg-[#141625] px-3 py-3 xl:hidden">
          {TOP_NAV.map((cat) => {
            const active = categoryActive(pathname, search, cat);
            if (cat.href) {
              return (
                <Link
                  key={cat.id}
                  href={cat.href}
                  onClick={() => setMobile(false)}
                  className={`mb-1 block rounded-xl px-3 py-2.5 text-sm ${
                    active ? "bg-white/10 font-semibold text-white/90" : "text-white/85"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            }
            return (
              <details key={cat.id} className="mb-1 rounded-xl border border-white/10 bg-white/[0.03]" open={active}>
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium text-white">
                  <span className="inline-flex items-center gap-2">
                    {cat.label}
                    {cat.badge ? <span className="admin-badge-glow h-4 min-w-4 px-1 text-[9px]">{cat.badge}</span> : null}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/50" />
                </summary>
                <div className="space-y-2 px-2 pb-3">
                  {(cat.groups || []).map((group) => (
                    <div key={group.label}>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        {group.label}
                      </p>
                      {(group.items || []).map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobile(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-white/85 hover:bg-white/5"
                        >
                          {item.label}
                          {item.badge ? (
                            <span className="admin-badge-glow h-4 min-w-4 px-1 text-[9px]">{item.badge}</span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}

export default function AdminMainNav() {
  return (
    <Suspense fallback={<div className="admin-topbar h-[104px]" />}>
      <NavInner />
    </Suspense>
  );
}
