"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";
import CopyCell, { inputCls } from "@/components/admin/queue-ui";
import { SYSTEM_USER_GROUPS, SYSTEM_USERS } from "@/lib/mock-data";
import { Pencil, Plus, Search, X } from "lucide-react";

export default function SystemUsersPage() {
  const [users, setUsers] = useState(SYSTEM_USERS);
  const [q, setQ] = useState("");
  const [editUser, setEditUser] = useState(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.toLowerCase();
    return users.filter((u) => [u.name, u.email, u.role, u.shift].join(" ").toLowerCase().includes(s));
  }, [users, q]);

  function saveEdit() {
    if (!editUser) return;
    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...editUser } : u)));
    setEditUser(null);
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "System & Scammer", href: "/system/users" },
          { label: "Manage System Users" },
        ]}
      />

      <div className="admin-fade-up mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-title">Manage System Users</h1>
          <p className="admin-subtitle mt-1">Staff accounts grouped by role · shift assignment</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email…"
              className={`${inputCls} pl-9 sm:w-64`}
            />
          </div>
          <Link href="/system/users/new" className="admin-btn-primary">
            <Plus className="h-4 w-4" />
            Create System User
          </Link>
        </div>
      </div>

      <div className="space-y-5">
        {SYSTEM_USER_GROUPS.map((group, gi) => {
          const rows = filtered.filter((u) => u.role === group.key);
          return (
            <section
              key={group.key}
              className={`admin-card admin-fade-up admin-fade-up-delay-${Math.min(gi + 1, 4)} overflow-visible p-0`}
            >
              <div className="admin-section-bar">
                <h2 className="title uppercase">{group.title}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[13px]">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Shift</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                          No users
                        </td>
                      </tr>
                    ) : (
                      rows.map((u, i) => (
                        <tr
                          key={u.id}
                          className={`border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.04] ${
                            i % 2 === 1 ? "bg-[#F7F8FB]" : "bg-admin-surface"
                          }`}
                        >
                          <td className="px-4 py-3.5 font-medium text-white">
                            <div className="flex items-center gap-2">
                              {u.name}
                              {u.online ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-theme-green-action" title="Online" />
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <CopyCell value={u.email} />
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">{u.shift || "—"}</td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => setEditUser({ ...u })}
                              className="rounded-lg border border-white/10 bg-admin-surface p-1.5 text-slate-500 shadow-sm transition hover:border-admin-teal/40 hover:text-admin-teal"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      {editUser ? (
        <div className="admin-modal-overlay" onClick={() => setEditUser(null)}>
          <div className="admin-card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit System User</h3>
                <p className="mt-1 text-sm text-slate-500">{editUser.role}</p>
              </div>
              <button type="button" onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Name
                <input
                  value={editUser.name}
                  onChange={(e) => setEditUser((u) => ({ ...u, name: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
                <input
                  value={editUser.email}
                  onChange={(e) => setEditUser((u) => ({ ...u, email: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Shift
                <select
                  value={editUser.shift}
                  onChange={(e) => setEditUser((u) => ({ ...u, shift: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                >
                  {["-", "Shift A", "Shift B"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditUser(null)} className="admin-btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={saveEdit} className="admin-btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
