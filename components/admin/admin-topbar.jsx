"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  Clock3,
  Gift,
  Home,
  LogOut,
  Menu,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
} from "lucide-react";

const QUICK = [
  {
    label: "Trust Points",
    count: 2,
    href: "/loyalty?tab=bonus&status=Pending",
    icon: Gift,
  },
  {
    label: "Deposits",
    count: 4,
    href: "/transactions?tab=deposits&status=Pending",
    icon: ArrowDownToLine,
  },
  {
    label: "Withdrawals",
    count: 7,
    href: "/transactions?tab=withdrawals&status=Pending",
    icon: ArrowUpFromLine,
  },
];

const NOTIFS = [
  ["Deposits", "3 pending approvals", "/transactions?tab=deposits&status=Pending"],
  ["Withdrawals", "2 awaiting authorizer", "/transactions?tab=withdrawals&status=Pending"],
  ["Users", "4 KYC pending", "/users?filter=pending"],
  ["Loyalty", "1 order pending", "/loyalty?tab=orders&status=Pending"],
];

export default function AdminTopbar({ onMenuClick, clock }) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
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
    <header className="admin-topbar z-30 border-b border-white/10 text-white">
      <div className="flex h-[72px] items-center justify-between gap-3 px-4 sm:px-6" ref={wrapRef}>
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-white/15 bg-black/25 p-2.5 text-white backdrop-blur-md lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden items-center gap-2 md:flex">
            {QUICK.map((q) => {
              const Icon = q.icon;
              return (
                <Link key={q.label} href={q.href} className="admin-topbar-chip">
                  <Icon className="h-3.5 w-3.5 text-teal-200" />
                  <span>{q.label}</span>
                  <span className="admin-badge-glow h-5 min-w-5 px-1.5 text-[10px]">{q.count}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {clock ? (
            <span className="hidden items-center gap-1.5 rounded-full border border-white/12 bg-black/20 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-md xl:inline-flex">
              <Clock3 className="h-3 w-3 text-teal-200" />
              {clock}
            </span>
          ) : null}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
              }}
              className="relative rounded-xl border border-white/15 bg-black/25 p-2.5 text-white/85 backdrop-blur-md transition hover:border-teal-300/40 hover:text-white hover:shadow-[0_0_16px_rgba(45,212,191,0.2)]"
            >
              <Bell className="h-4 w-4" />
              <span className="admin-badge-glow absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]">27</span>
            </button>
            {notifOpen ? (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-white/12 bg-[#1a1b2a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="border-b border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-xs text-white/50">Queue alerts · last events</p>
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
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 py-1.5 pl-1.5 pr-3 text-sm text-white backdrop-blur-md transition hover:border-teal-300/40 hover:shadow-[0_0_16px_rgba(45,212,191,0.18)]"
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-admin-teal text-white shadow-[0_0_14px_rgba(35,107,107,0.55)]">
                <User className="h-3.5 w-3.5" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#1a1b2a] bg-theme-green-action" />
              </span>
              <span className="hidden text-left sm:inline">
                <span className="block text-xs font-semibold leading-tight">System Admin</span>
                <span className="block text-[10px] text-white/55">Online</span>
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-white/55 transition ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/12 bg-[#1a1b2a]/95 py-1 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <Link
                  href="/dashboard"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/90 hover:bg-white/5"
                >
                  <Home className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
                <Link
                  href="/performance"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-2.5 text-sm text-white/90 hover:bg-white/5"
                >
                  My Performance
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-300 hover:bg-white/5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
