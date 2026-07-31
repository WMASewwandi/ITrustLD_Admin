"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminMainNav from "@/components/admin/admin-main-nav";
import { fetchAdminMe, getAdminUser, hasAdminSession } from "@/lib/auth";

function formatRoleLabel(roles = []) {
  if (roles.includes("super-admin")) return "Super Admin";
  if (roles.includes("sub-admin")) return "Sub Admin";
  if (roles.includes("deposit-executive")) return "Deposit Executive";
  if (roles.includes("withdrawal-executive")) return "Withdrawal Executive";
  return roles[0] || "Admin";
}

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [roleLabel, setRoleLabel] = useState("Admin");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!hasAdminSession()) {
        router.replace("/login");
        return;
      }

      try {
        const { user } = await fetchAdminMe();
        if (cancelled) return;
        setRoleLabel(formatRoleLabel(user?.roles));
        setReady(true);
      } catch {
        if (cancelled) return;
        router.replace("/login");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  useEffect(() => {
    const cached = getAdminUser();
    if (cached?.roles?.length) {
      setRoleLabel(formatRoleLabel(cached.roles));
    }
  }, []);

  if (!ready) {
    return (
      <div className="admin-canvas flex min-h-dvh items-center justify-center text-slate-400">
        <div className="admin-card px-8 py-6 text-sm text-slate-300">Checking admin session…</div>
      </div>
    );
  }

  return (
    <div className="admin-canvas relative h-dvh overflow-hidden text-slate-200">
      <div className="admin-grid-overlay pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden />

      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0">
          <AdminMainNav />
        </div>

        <div className="shrink-0 border-b border-white/10 bg-admin-surface/80 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-3 px-4 py-2 text-[11px] text-slate-400 sm:px-6">
            <span className="inline-flex items-center gap-1.5">
              <span className="admin-live-dot h-1.5 w-1.5 rounded-full bg-theme-green-action" />
              Live ops · near real-time refresh
            </span>
            <span className="hidden text-white/20 sm:inline">|</span>
            <span className="hidden sm:inline">Role: {roleLabel} · Queue assignment active</span>
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
