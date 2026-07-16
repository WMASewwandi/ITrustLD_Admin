"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bookmark,
  ChevronDown,
  Command,
  LogOut,
  Menu,
  Search,
  User,
  X,
} from "lucide-react";
import { NAV } from "@/lib/mock-data";

function isActiveCategory(pathname, category) {
  if (category.href && pathname.startsWith(category.href.split("?")[0])) return true;
  return category.items?.some((item) => pathname.startsWith(item.href.split("?")[0]));
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(null);
  const [mobile, setMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setOpen(null);
    setMobile(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

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

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6" ref={wrapRef}>
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/dashboard" className="inline-flex shrink-0 items-center gap-2">
            <img
              src="/assets/img/logos/logo-itrustld-wide.png"
              alt="iTrustLD"
              className="h-8 w-auto object-contain sm:h-9"
            />
            <span className="hidden rounded-md border border-[#6898FF]/30 bg-admin-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-admin-teal lg:inline">
              Admin
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 2xl:flex">
            {NAV.map((cat) => {
              const active = isActiveCategory(pathname, cat);
              return (
                <div key={cat.label} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpen(open === cat.label ? null : cat.label)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-medium transition ${
                      active
                        ? "bg-admin-teal/10 text-admin-teal shadow-[0_0_0_1px_rgba(104,152,255,0.25)]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {cat.label}
                    {cat.badge ? (
                      <span className="admin-badge-glow px-1.5 py-0.5 text-[10px]">
                        {cat.badge}
                      </span>
                    ) : null}
                    <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition ${open === cat.label ? "rotate-180" : ""}`} />
                  </button>
                  {open === cat.label ? (
                    <div className="absolute left-0 mt-2 min-w-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                      <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {cat.label}
                      </p>
                      {cat.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="mx-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-admin-teal/12 hover:text-white"
                        >
                          {item.label}
                          <span className="text-[10px] text-slate-300">↵</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 transition hover:border-white/20 hover:text-slate-600 lg:inline-flex"
            title="Command palette (demo)"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Quick search</span>
            <span className="ml-2 inline-flex items-center gap-0.5 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </button>

          <Link
            href="/performance"
            className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-admin-teal/40 hover:text-slate-900 sm:inline-flex"
          >
            My Performance
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:text-slate-900"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="admin-badge-glow absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]">
                7
              </span>
            </button>
            {notifOpen ? (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-400">Section badges · last 50 events</p>
                </div>
                <div className="max-h-64 overflow-auto py-1">
                  {[
                    ["Deposits", "3 pending approvals", "/transactions?tab=deposits&status=Pending"],
                    ["Withdrawals", "2 awaiting authorizer", "/transactions?tab=withdrawals&status=Pending"],
                    ["Users", "4 KYC pending", "/users?filter=pending"],
                    ["Loyalty", "1 order pending", "/loyalty?tab=orders&status=Pending"],
                  ].map(([title, body, href]) => (
                    <Link
                      key={href}
                      href={href}
                      className="block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">{title}</p>
                      <p className="text-xs text-slate-500">{body}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:text-slate-900"
            title="Bookmarks"
          >
            <Bookmark className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-gradient-to-r from-white/[0.06] to-white/[0.02] py-1.5 pl-1.5 pr-3 text-sm text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-admin-teal to-[#A855F7] text-white shadow-[0_0_16px_rgba(104,152,255,0.4)]">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="hidden sm:inline">
                <span className="block text-xs font-semibold leading-tight">Admin</span>
                <span className="block text-[10px] text-slate-400">Super Admin</span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-2xl">
                <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  Dashboard
                </Link>
                <Link href="/team-performance" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  Team Performance
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-300 hover:bg-slate-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2.5 text-slate-900 2xl:hidden"
            onClick={() => setMobile((v) => !v)}
          >
            {mobile ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobile ? (
        <div className="max-h-[70vh] overflow-auto border-t border-slate-200 bg-white px-4 py-3 2xl:hidden">
          {NAV.map((cat) => (
            <div key={cat.label} className="mb-4">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-admin-teal">
                {cat.label}
              </p>
              <div className="space-y-1">
                {cat.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}
