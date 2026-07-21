"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Lock,
} from "lucide-react";

const HIGHLIGHTS = [
  { icon: ShieldCheck, title: "Role-based access", body: "Super Admin, Executives, Authorizer" },
  { icon: Activity, title: "Live queues", body: "Deposits, withdrawals & loyalty claims" },
  { icon: Layers, title: "Ops modules", body: "Users, rates, content & performance" },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    window.localStorage.setItem("itrustld_admin_auth", "1");
    router.push("/dashboard");
  }

  return (
    <div className="admin-canvas-dark relative flex min-h-dvh w-full flex-col overflow-hidden text-white">
      <div className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-admin-teal/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[30rem] w-[30rem] rounded-full bg-admin-accent/15 blur-[130px]" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-theme-green-action/10 blur-[100px]" />

      <div className="relative grid min-h-dvh w-full flex-1 lg:grid-cols-2">
        {/* Brand panel — full-height left pane on desktop */}
        <section className="admin-fade-up relative hidden flex-col justify-center border-r border-white/10 px-10 py-12 xl:px-16 lg:flex">
          <img
            src="/assets/img/logos/logo-itrustld-wide.png"
            alt="iTrustLD"
            className="h-11 w-auto object-contain"
          />
          <p className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-admin-teal/40 bg-admin-teal/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200">
            <Lock className="h-3 w-3" />
            Secure operations console
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Command center for
            <span className="block bg-gradient-to-r from-teal-300 via-admin-teal to-theme-green-action bg-clip-text text-transparent">
              iTrustLD Admin
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/55">
            Monitor queues, approve transactions, manage KYC, loyalty, rates and content from one modern control panel.
          </p>

          <div className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm"
              >
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-admin-teal/25 text-teal-200">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/45">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sign-in — full window on mobile, full pane on desktop */}
        <section className="admin-fade-up admin-fade-up-delay-2 flex min-h-dvh w-full flex-col bg-admin-chrome/40 backdrop-blur-xl lg:min-h-0">
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-8 sm:px-8 lg:px-12">
            <div className="text-center lg:text-left">
              <div className="mb-6 flex justify-center lg:hidden">
                <img
                  src="/assets/img/logos/logo-itrustld-wide.png"
                  alt="iTrustLD"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <p className="inline-flex items-center gap-2 rounded-full border border-admin-teal/35 bg-admin-teal/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200">
                Admin Portal
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Welcome <span className="text-theme-green-action">Back</span>
              </h2>
              <p className="mt-2 text-sm text-white/55">Sign in to manage iTrustLD operations.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  defaultValue="admin@itrustld.com"
                  placeholder="admin@itrustld.com"
                  className="w-full rounded-xl border border-white/12 bg-admin-chrome-deep px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-admin-teal/60 focus:ring-2 focus:ring-admin-teal/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  defaultValue="admin123"
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-white/12 bg-admin-chrome-deep px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-admin-teal/60 focus:ring-2 focus:ring-admin-teal/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-admin-teal px-5 py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_14px_36px_rgba(35,107,107,0.4)] transition hover:bg-admin-teal-deep disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            </form>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                ["Queues", "Live"],
                ["Shift", "A / B"],
                ["Access", "RBAC"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-white/40">{k}</p>
                  <p className="mt-0.5 text-xs font-semibold text-white/85">{v}</p>
                </div>
              ))}
            </div>

            <p className="mt-auto pt-8 text-center text-xs text-white/40 lg:text-left">
              User site is separate.{" "}
              <Link href="http://localhost:3000" className="text-teal-300 transition hover:text-white">
                Open user web
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
