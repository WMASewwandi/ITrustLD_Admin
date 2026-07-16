"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminTopbar from "@/components/admin/admin-topbar";

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [clock, setClock] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const authed = window.localStorage.getItem("itrustld_admin_auth") === "1";
    if (!authed) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router, pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(
        now.toLocaleString("en-LK", {
          timeZone: "Asia/Colombo",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!ready) {
    return (
      <div className="admin-canvas flex min-h-dvh items-center justify-center text-slate-500">
        <div className="admin-card px-8 py-6 text-sm text-slate-600">Checking admin session…</div>
      </div>
    );
  }

  return (
    <div className="admin-canvas relative h-dvh overflow-hidden text-slate-800">
      <div className="admin-grid-overlay pointer-events-none fixed inset-0 -z-10 opacity-40" aria-hidden />

      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex h-full min-h-0 flex-col transition-[padding] duration-200 ${
          collapsed ? "lg:pl-[72px]" : "lg:pl-[280px]"
        }`}
      >
        <div className="shrink-0">
          <AdminTopbar onMenuClick={() => setMobileOpen(true)} clock={clock} />
        </div>

        <div className="shrink-0 border-b border-slate-200/80 bg-white/70 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] text-slate-500 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="admin-live-dot h-1.5 w-1.5 rounded-full bg-theme-green-action" />
                Live ops · Shift A
              </span>
              <span className="hidden text-slate-300 sm:inline">|</span>
              <span className="hidden sm:inline">Role: Super Admin</span>
            </div>
            <span className="font-medium text-slate-600 sm:hidden">{clock} · Asia/Colombo</span>
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
