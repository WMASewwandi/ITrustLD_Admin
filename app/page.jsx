"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminUser, hasAdminSession } from "@/lib/auth";
import { resolvePostLoginHref } from "@/lib/permissions";
import { TOP_NAV } from "@/lib/mock-data";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/login");
      return;
    }
    const user = getAdminUser();
    const permissions = user?.permissions ?? [];
    const roles = user?.roles ?? [];
    const landing = resolvePostLoginHref(roles, permissions, TOP_NAV);
    router.replace(landing || "/login");
  }, [router]);

  return (
    <div className="admin-canvas flex min-h-screen items-center justify-center text-slate-500">
      Redirecting…
    </div>
  );
}
