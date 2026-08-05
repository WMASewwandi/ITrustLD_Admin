"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";
import CopyCell, { inputCls } from "@/components/admin/queue-ui";
import { createSystemUser, fetchSystemUsers, updateSystemUser } from "@/lib/system-users";
import { useCan } from "@/contexts/admin-permissions";
import {
  Clock3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { formatDateSl } from "@/lib/sl-time";

function formatDate(value) {
  return formatDateSl(value);
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        active ? "bg-theme-green-action/20 text-theme-green-action" : "bg-rose-500/20 text-rose-300"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const SHIFT_OPTIONS = ["-", "Shift A", "Shift B"];

const EMPTY_CREATE_FORM = {
  name: "",
  email: "",
  password: "",
  role: "",
  shift: "-",
  pending_show_count: "",
  is_active: true,
};

export default function SystemUsersPage() {
  const [users, setUsers] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [saving, setSaving] = useState(false);
  const canManageUsers = useCan("system_user_manage_activity");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetchSystemUsers();
      setUsers(res.users ?? []);
      setAssignableRoles(res.assignable_roles ?? []);
    } catch (err) {
      setError(err.message || "Failed to load system users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.toLowerCase();
    return users.filter((user) =>
      [
        user.name,
        user.email,
        user.role_display_name,
        user.role,
        user.shift,
        user.pending_show_count,
        user.is_active ? "active" : "inactive",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [users, q]);

  function openCreate() {
    setCreateForm({
      ...EMPTY_CREATE_FORM,
      role: assignableRoles[0]?.name || "",
    });
    setShowCreate(true);
  }

  function openEdit(user) {
    setEditUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "",
      shift: user.shift || "-",
      pending_show_count:
        user.pending_show_count != null && user.pending_show_count !== ""
          ? String(user.pending_show_count)
          : "",
      is_active: user.is_active,
      password: "",
    });
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const res = await createSystemUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        shift: createForm.shift,
        pending_show_count: createForm.pending_show_count || null,
        is_active: createForm.is_active,
      });
      setUsers((prev) => [...prev, res.user].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE_FORM);
    } catch (err) {
      setError(err.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!editUser) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateSystemUser(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        shift: editUser.shift,
        pending_show_count: editUser.pending_show_count || null,
        is_active: editUser.is_active,
        password: editUser.password || undefined,
      });
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? res.user : u)));
      setEditUser(null);
    } catch (err) {
      setError(err.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading system users…
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "System & Scammer", href: "/system/users" },
          { label: "Manage System Users" },
        ]}
      />

      {error ? (
        <div className="admin-fade-up mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-2 text-xl font-bold text-white sm:text-2xl">Manage System Users</h1>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
              <Users className="h-3 w-3 text-admin-teal" />
              {users.length} users
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManageUsers ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              >
                <Plus className="h-3.5 w-3.5" />
                Create System User
              </button>
            ) : null}
          </div>
        </div>

        <div className="border-b border-white/10 bg-white/5 px-5 py-4">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Search
              </span>
              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-admin-surface">
                <input
                  type="search"
                  name="system-user-search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, email, role, status…"
                  className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center bg-admin-teal px-4 text-white transition hover:brightness-110"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Shift</th>
                <th className="px-3 py-3">Pending show</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Created On</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-admin-teal/10 text-admin-teal">
                        <UserRound className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{user.name}</span>
                        {user.is_online ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-theme-green-action"
                            title="Online"
                          />
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <CopyCell value={user.email} />
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-slate-200">
                      {user.role_display_name}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-400">{user.shift || "—"}</td>
                  <td className="px-3 py-3 text-slate-400">
                    {user.pending_show_count != null ? user.pending_show_count : "All"}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge active={user.is_active} />
                  </td>
                  <td className="px-3 py-3 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {canManageUsers ? (
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="inline-flex rounded-lg bg-admin-teal p-1.5 text-white shadow-sm transition hover:brightness-110"
                        title="Edit user"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-slate-400">
                    No results found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {editUser ? (
        <div className="admin-modal-overlay" onClick={() => !saving && setEditUser(null)}>
          <div
            className="admin-card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit System User</h3>
                <p className="mt-1 text-sm text-slate-400">{editUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setEditUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-4"
              autoComplete="off"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Name
                <input
                  name="system-user-edit-name"
                  autoComplete="off"
                  value={editUser.name}
                  onChange={(e) => setEditUser((u) => ({ ...u, name: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
                <input
                  type="email"
                  name="system-user-edit-email"
                  autoComplete="off"
                  value={editUser.email}
                  onChange={(e) => setEditUser((u) => ({ ...u, email: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Password
                <input
                  type="password"
                  name="system-user-edit-password"
                  autoComplete="new-password"
                  value={editUser.password}
                  onChange={(e) => setEditUser((u) => ({ ...u, password: e.target.value }))}
                  placeholder="Leave blank to keep current password"
                  className={`mt-1 ${inputCls}`}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Role
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser((u) => ({ ...u, role: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                >
                  {assignableRoles.map((role) => (
                    <option key={role.name} value={role.name} className="bg-admin-surface">
                      {role.display_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Shift
                <select
                  value={editUser.shift}
                  onChange={(e) => setEditUser((u) => ({ ...u, shift: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                >
                  {SHIFT_OPTIONS.map((shift) => (
                    <option key={shift} value={shift} className="bg-admin-surface">
                      {shift}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pending show count
                <input
                  type="number"
                  min="1"
                  max="1000"
                  inputMode="numeric"
                  placeholder="Optional — leave blank for all"
                  value={editUser.pending_show_count}
                  onChange={(e) =>
                    setEditUser((u) => ({
                      ...u,
                      pending_show_count: e.target.value.replace(/[^\d]/g, ""),
                    }))
                  }
                  className={`mt-1 ${inputCls}`}
                />
                <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-slate-500">
                  For deposit/withdrawal executives only. Caps how many pending rows load; total count
                  stays unchanged. Blank = load all.
                </span>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <span className="block text-sm font-medium text-slate-200">Account status</span>
                  <span className="block text-xs text-slate-500">
                    Inactive users cannot log in to the admin portal.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editUser.is_active}
                  onChange={(e) =>
                    setEditUser((u) => ({ ...u, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/20"
                />
              </label>
            </form>

            <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreate ? (
        <div className="admin-modal-overlay" onClick={() => !saving && setShowCreate(false)}>
          <div
            className="admin-card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Create System User</h3>
                <p className="mt-1 text-sm text-slate-400">Add a new staff account to the admin portal.</p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setShowCreate(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-4"
              autoComplete="off"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Name
                <input
                  name="system-user-create-name"
                  autoComplete="off"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
                <input
                  type="email"
                  name="system-user-create-email"
                  autoComplete="off"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Password
                <input
                  type="password"
                  name="system-user-create-password"
                  autoComplete="new-password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  className={`mt-1 ${inputCls}`}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Role
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                >
                  {assignableRoles.map((role) => (
                    <option key={role.name} value={role.name} className="bg-admin-surface">
                      {role.display_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Shift
                <select
                  value={createForm.shift}
                  onChange={(e) => setCreateForm((f) => ({ ...f, shift: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                >
                  {SHIFT_OPTIONS.map((shift) => (
                    <option key={shift} value={shift} className="bg-admin-surface">
                      {shift}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pending show count
                <input
                  type="number"
                  min="1"
                  max="1000"
                  inputMode="numeric"
                  placeholder="Optional — leave blank for all"
                  value={createForm.pending_show_count}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      pending_show_count: e.target.value.replace(/[^\d]/g, ""),
                    }))
                  }
                  className={`mt-1 ${inputCls}`}
                />
                <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-slate-500">
                  For deposit/withdrawal executives only. Caps how many pending rows load; total count
                  stays unchanged. Blank = load all.
                </span>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <span className="block text-sm font-medium text-slate-200">Account status</span>
                  <span className="block text-xs text-slate-500">
                    Inactive users cannot log in to the admin portal.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/20"
                />
              </label>
            </form>

            <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={
                    saving ||
                    !createForm.name.trim() ||
                    !createForm.email.trim() ||
                    !createForm.password.trim() ||
                    !createForm.role
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
