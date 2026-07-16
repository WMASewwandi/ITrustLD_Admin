"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const authed = window.localStorage.getItem("itrustld_admin_auth") === "1";
    router.replace(authed ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="admin-canvas flex min-h-screen items-center justify-center text-slate-500">
      Redirecting…
    </div>
  );
}
