"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  Headset,
  ShieldCheck,
  Users,
} from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { useAdminPermissions } from "@/contexts/admin-permissions";
import { formatRoleLabel, getAdminUser } from "@/lib/auth";
import { hasAnyLoyaltyRead, resolveFirstLoyaltyHref } from "@/lib/loyalty-permissions";
import { fetchNavCounts } from "@/lib/notifications";
import { hasPermission } from "@/lib/permissions";

const QUEUE_CARDS = [
  {
    id: "pending-authorization",
    label: "Pending Authorization",
    detail: "Withdrawals waiting for authorization",
    href: "/transactions?tab=withdrawals&status=Pending%20Authorization",
    permission: ["read_withdrawal_data", "authorize_withdrawal_data"],
    count: (c) => c?.withdrawals?.pending_authorization,
    icon: ShieldCheck,
  },
  {
    id: "loyalty-pending-authorization",
    label: "Loyalty Authorization",
    detail: "Loyalty orders waiting for authorization",
    href: "/loyalty?tab=orders&status=Pending%20Authorization",
    permission: ["read_loyalty_orders_data", "authorize_loyalty_orders_data"],
    count: (c) => c?.loyalty?.orders_pending_authorization,
    icon: ShieldCheck,
  },
  {
    id: "pending-withdrawals",
    label: "Pending Withdrawals",
    detail: "Cash-out requests in your queue",
    href: "/transactions?tab=withdrawals&status=Pending",
    permission: "read_withdrawal_data",
    count: (c) => c?.withdrawals?.pending,
    icon: ArrowUpFromLine,
  },
  {
    id: "pending-deposits",
    label: "Pending Deposits",
    detail: "Top-ups waiting for review",
    href: "/transactions?tab=deposits&status=Pending",
    permission: "read_deposit_data",
    count: (c) => c?.deposits?.pending,
    icon: ArrowDownToLine,
  },
  {
    id: "pending-kyc",
    label: "Pending KYC",
    detail: "Customer accounts to verify",
    href: "/users?filter=pending",
    permission: "read_customer_accounts_data",
    count: (c) => c?.users?.pending,
    icon: Users,
  },
  {
    id: "help-tickets",
    label: "Help Tickets",
    detail: "Unread support requests",
    href: "/help-tickets",
    permission: "read_help_requests",
    count: (c) => c?.help_tickets?.unread,
    icon: Headset,
  },
  {
    id: "loyalty",
    label: "Loyalty",
    detail: "Pending claims and orders",
    href: "/loyalty?tab=vouchers&status=Pending",
    loyalty: true,
    count: (c) =>
      (c?.loyalty?.orders || 0) +
      (c?.loyalty?.orders_pending_authorization || 0) +
      (c?.loyalty?.bonus || 0) +
      (c?.loyalty?.vouchers || 0) +
      (c?.loyalty?.gifts || 0),
    icon: Gift,
  },
];

function firstName(name) {
  const value = String(name || "").trim();
  if (!value) return "there";
  return value.split(/\s+/)[0];
}

export default function AdminHomePage() {
  const permissions = useAdminPermissions();
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    setUser(getAdminUser());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchNavCounts()
      .then((data) => {
        if (!cancelled) setCounts(data?.counts ?? null);
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const roleLabel = formatRoleLabel(user?.roles);

  const cards = useMemo(() => {
    return QUEUE_CARDS.filter((card) => {
      if (card.loyalty) return hasAnyLoyaltyRead(permissions);
      return hasPermission(permissions, card.permission);
    }).map((card) => ({
      ...card,
      href: card.loyalty ? resolveFirstLoyaltyHref(permissions) || card.href : card.href,
      value: counts == null ? "—" : Number(card.count(counts) || 0),
    }));
  }, [permissions, counts]);

  return (
    <div className="pb-10">
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome back, {firstName(user?.name)}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {roleLabel} · Open a queue below or use the menu to continue.
        </p>
      </div>

      {cards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className="admin-card group flex items-start justify-between gap-4 p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-admin-teal/20 text-teal-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-base font-semibold text-white">{card.label}</h2>
                  <p className="mt-1 text-sm text-slate-400">{card.detail}</p>
                </div>
                <div className="flex flex-col items-end gap-6">
                  <span className="text-2xl font-bold tabular-nums text-white">{card.value}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 opacity-80 group-hover:opacity-100">
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="admin-card p-6 text-sm text-slate-400">
          Use the navigation menu to open a module you have access to.
        </div>
      )}
    </div>
  );
}
