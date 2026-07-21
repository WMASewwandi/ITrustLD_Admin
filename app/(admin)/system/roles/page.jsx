"use client";

import { useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { Check, Shield, X } from "lucide-react";

const INITIAL_ROLES = [
  {
    id: "customer",
    title: "Customer Role",
    description: "End-user portal permissions",
    permissions: [
      { id: "c1", label: "Customer Deposit Activity", enabled: true },
      { id: "c2", label: "Customer Withdrawal Activity", enabled: true },
      { id: "c3", label: "Customer Profile Activity", enabled: true },
      { id: "c4", label: "Customer Account Activity", enabled: true },
      { id: "c5", label: "Customer Loyalty Activity", enabled: true },
      { id: "c6", label: "Customer Help Activity", enabled: true },
    ],
  },
  {
    id: "sub-admin",
    title: "Sub Admin Role",
    description: "Read-focused operations access",
    permissions: [
      { id: "s1", label: "Read Customer Deposit Information", enabled: true },
      { id: "s2", label: "Read Customer Withdrawal Information", enabled: true },
      { id: "s3", label: "Read Customer Profile Data", enabled: true },
      { id: "s4", label: "Read Customer Accounts Data", enabled: true },
      { id: "s5", label: "Read Customer Loyalty Requests", enabled: true },
      { id: "s6", label: "Read Customer Help Request", enabled: true },
      { id: "s7", label: "SMS-Email Customer", enabled: true },
    ],
  },
  {
    id: "deposit-exec",
    title: "Deposit Executive Role",
    description: "Deposit queue operations",
    permissions: [
      { id: "d1", label: "View Pending Deposits", enabled: true },
      { id: "d2", label: "Approve Deposit Requests", enabled: true },
      { id: "d3", label: "Reject Deposit Requests", enabled: true },
      { id: "d4", label: "Assign Deposit Cases", enabled: true },
      { id: "d5", label: "View Deposit Proofs", enabled: true },
    ],
  },
  {
    id: "withdraw-exec",
    title: "Withdrawal Executive Role",
    description: "Withdrawal queue operations",
    permissions: [
      { id: "w1", label: "View Pending Withdrawals", enabled: true },
      { id: "w2", label: "Approve for Authorizer", enabled: true },
      { id: "w3", label: "Reject Withdrawal Requests", enabled: true },
      { id: "w4", label: "Assign Withdrawal Cases", enabled: true },
    ],
  },
  {
    id: "authorizer",
    title: "Withdrawal Authorizer Role",
    description: "Maker-checker final authorization",
    permissions: [
      { id: "a1", label: "Authorize Pending Withdrawals", enabled: true },
      { id: "a2", label: "Reject Authorizer Queue", enabled: true },
      { id: "a3", label: "View Withdrawal History", enabled: true },
    ],
  },
  {
    id: "super-admin",
    title: "Super Admin Role",
    description: "Full platform control",
    permissions: [
      { id: "sa1", label: "Manage System Users & Roles", enabled: true },
      { id: "sa2", label: "Manage Configurations & Rates", enabled: true },
      { id: "sa3", label: "Manage Content & Templates", enabled: true },
      { id: "sa4", label: "View Team Performance", enabled: true },
      { id: "sa5", label: "Scammer Management", enabled: true },
      { id: "sa6", label: "Bulk SMS / Notifications", enabled: true },
    ],
  },
];

export default function RolesPage() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [editRole, setEditRole] = useState(null);

  const editing = editRole ? roles.find((r) => r.id === editRole) : null;

  function togglePermission(roleId, permId) {
    setRoles((prev) =>
      prev.map((role) =>
        role.id !== roleId
          ? role
          : {
              ...role,
              permissions: role.permissions.map((p) =>
                p.id === permId ? { ...p, enabled: !p.enabled } : p
              ),
            }
      )
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "System & Scammer", href: "/system/roles" },
          { label: "Manage System Roles" },
        ]}
      />

      <div className="admin-fade-up mb-6">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-admin-teal/25 bg-admin-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-teal">
          <Shield className="h-3 w-3" />
          Access control
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white">Manage System Roles</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure role activities and permissions for customer and admin personas.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((role, i) => (
          <article
            key={role.id}
            className={`admin-card admin-fade-up admin-fade-up-delay-${Math.min(i + 1, 4)} flex flex-col p-5`}
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-admin-teal/10 text-admin-teal">
                <Shield className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">{role.title}</h2>
                <p className="text-xs text-slate-400">{role.description}</p>
              </div>
            </div>

            <ul className="mb-5 flex-1 space-y-2">
              {role.permissions.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-400"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                      p.enabled
                        ? "bg-theme-green-action/20 text-theme-green-action"
                        : "bg-white/5 text-slate-300"
                    }`}
                  >
                    {p.enabled ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <span className={p.enabled ? "" : "text-slate-400 line-through"}>{p.label}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setEditRole(role.id)}
              className="inline-flex w-full items-center justify-center rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Change Permissions
            </button>
          </article>
        ))}
      </div>

      {editing ? (
        <div
          className="admin-modal-overlay"
          onClick={() => setEditRole(null)}
        >
          <div className="admin-card max-h-[85vh] w-full max-w-lg overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{editing.title}</h3>
                <p className="mt-1 text-sm text-slate-500">Toggle permissions for this role.</p>
              </div>
              <button type="button" onClick={() => setEditRole(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {editing.permissions.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-admin-teal/30"
                >
                  <span className="text-sm text-slate-300">{p.label}</span>
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={() => togglePermission(editing.id, p.id)}
                    className="h-4 w-4 rounded border-white/20"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRole(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setEditRole(null)}
                className="rounded-xl bg-theme-green-action px-4 py-2 text-sm font-semibold text-white"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
