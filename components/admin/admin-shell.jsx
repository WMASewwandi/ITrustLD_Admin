"use client";

import { useEffect, useRef, useState } from "react";
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

const SNAPSHOT_KEY = "itrustld_admin_shell_snapshot";

let shellSnapshot = null;

function readPersistedSnapshot() {
  if (shellSnapshot) return shellSnapshot;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user) {
      shellSnapshot = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function applySnapshot(next) {
  shellSnapshot = next;
  try {
    window.sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

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

function snapshotFromUser(user) {
  return {
    user,
    roleLabel: formatRoleLabel(user?.roles),
    permissions: user?.permissions ?? [],
  };
}

export default function AdminShell({ children }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState("Admin");
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!hasAdminSession()) {
        shellSnapshot = null;
        try {
          window.sessionStorage.removeItem(SNAPSHOT_KEY);
        } catch {
          // ignore
        }
        routerRef.current.replace("/login");
        return;
      }

      const cached = getAdminUser() || readPersistedSnapshot()?.user || null;
      if (cached) {
        const next = applySnapshot(snapshotFromUser(cached));
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
        const next = applySnapshot(snapshotFromUser(nextUser));
        setUser(next.user);
        setRoleLabel(next.roleLabel);
        setPermissions(next.permissions);
        updateAdminUser(nextUser);
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        if (error?.status === 401 && !cached) {
          shellSnapshot = null;
          clearAdminSession();
          routerRef.current.replace("/login");
          return;
        }
        if (cached) {
          setReady(true);
          return;
        }
        routerRef.current.replace("/login");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminPermissionsProvider permissions={permissions}>
      <AppDialogProvider>
      <div className="admin-canvas relative h-dvh overflow-hidden text-slate-200">
      <div className="admin-grid-overlay pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden />

      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0">
          {user ? <AdminMainNav user={user} roleLabel={roleLabel} /> : <div className="h-14 border-b border-white/10" />}
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
          {!ready ? (
            <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
              <div className="admin-card px-8 py-6 text-sm text-slate-300">Checking admin session…</div>
            </div>
          ) : null}
          {/* Always keep the App Router page slot mounted. Returning without
              children after login made production retry the first page forever. */}
          <div className={ready ? "contents" : "hidden"}>
            {children}
          </div>
        </main>
      </div>
      </div>
      {ready ? <AdminIdleTimeout /> : null}
      </AppDialogProvider>
    </AdminPermissionsProvider>
  );
}
