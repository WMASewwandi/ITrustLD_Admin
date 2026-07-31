"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasAdminSession } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasAdminSession() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="admin-canvas flex min-h-screen items-center justify-center text-slate-500">
      Redirecting…
    </div>
  );
}
