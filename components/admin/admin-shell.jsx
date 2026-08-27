"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminMainNav from "@/components/admin/admin-main-nav";
import AdminIdleTimeout from "@/components/admin/admin-idle-timeout";
import { AdminPermissionsProvider } from "@/contexts/admin-permissions";
import { AppDialogProvider } from "@/components/admin/app-dialog";
import {
  clearAdminSession,
  fetchAdminMe,
  formatRoleLabel,
  getAdminUser,
  hasAdminSession,
  updateAdminUser,
} from "@/lib/auth";

let shellSnapshot = null;
let verifyStarted = false;

function mergeAdminUser(remote, cached) {
  const remotePerms = Array.isArray(remote?.permissions) ? remote.permissions : null;
  const cachedPerms = Array.isArray(cached?.permissions) ? cached.permissions : null;
  const permissions = remotePerms?.length ? remotePerms : cachedPerms ?? remotePerms ?? [];
  return {
    ...(cached || {}),
    ...(remote || {}),
    roles: remote?.roles?.length ? remote.roles : cached?.roles ?? remote?.roles ?? [],
    permissions,
  };
}

function applySnapshot(next) {
  shellSnapshot = next;
  return next;
}

export default function AdminShell({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(() => Boolean(shellSnapshot));
  const [user, setUser] = useState(() => shellSnapshot?.user ?? null);
  const [roleLabel, setRoleLabel] = useState(() => shellSnapshot?.roleLabel ?? "Admin");
  const [permissions, setPermissions] = useState(() => shellSnapshot?.permissions ?? []);

  useEffect(() => {
    if (shellSnapshot) {
      setUser(shellSnapshot.user);
      setRoleLabel(shellSnapshot.roleLabel);
      setPermissions(shellSnapshot.permissions);
      setReady(true);
      return undefined;
    }

    if (verifyStarted) return undefined;
    verifyStarted = true;
    let cancelled = false;

    async function verify() {
      if (!hasAdminSession()) {
        verifyStarted = false;
        router.replace("/login");
        return;
      }

      const cached = getAdminUser();
      if (cached) {
        const next = applySnapshot({
          user: cached,
          roleLabel: cached.roles?.length ? formatRoleLabel(cached.roles) : "Admin",
          permissions: cached.permissions ?? [],
        });
        if (!cancelled) {
          setUser(next.user);
          setRoleLabel(next.roleLabel);
          setPermissions(next.permissions);
          setReady(true);
        }
      }

      try {
        const { user: remote } = await fetchAdminMe();
        if (cancelled) return;
        const nextUser = mergeAdminUser(remote, cached);
        const next = applySnapshot({
          user: nextUser,
          roleLabel: formatRoleLabel(nextUser?.roles),
          permissions: nextUser?.permissions ?? [],
        });
        setUser(next.user);
        setRoleLabel(next.roleLabel);
        setPermissions(next.permissions);
        updateAdminUser(nextUser);
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        if (error?.status === 401) {
          shellSnapshot = null;
          verifyStarted = false;
          clearAdminSession();
          router.replace("/login");
          return;
        }
        if (cached) {
          setReady(true);
          return;
        }
        verifyStarted = false;
        router.replace("/login");
      }
    }

    verify();
    return () => {
      cancelled = true;
      if (!shellSnapshot) verifyStarted = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="admin-canvas flex min-h-dvh items-center justify-center text-slate-400">
        <div className="admin-card px-8 py-6 text-sm text-slate-300">Checking admin session…</div>
      </div>
    );
  }

  return (
    <AdminPermissionsProvider permissions={permissions}>
      <AppDialogProvider>
      <div className="admin-canvas relative h-dvh overflow-hidden text-slate-200">
      <div className="admin-grid-overlay pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden />

      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0">
          <AdminMainNav user={user} roleLabel={roleLabel} />
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
      <AdminIdleTimeout />
      </AppDialogProvider>
    </AdminPermissionsProvider>
  );
}
