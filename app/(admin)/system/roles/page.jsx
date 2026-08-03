"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";
import RolePermissionsEditor, {
  RolePermissionsEditorSkeleton,
} from "@/components/admin/role-permissions-editor";
import { inputCls } from "@/components/admin/queue-ui";
import {
  createRole,
  fetchRoleActivities,
  fetchRoles,
  updateRolePermissions,
} from "@/lib/roles";
import { useCan } from "@/contexts/admin-permissions";
import { Loader2, Pencil, Plus, RefreshCw, Search, Shield, X, Clock3 } from "lucide-react";

import { formatDateSl } from "@/lib/sl-time";

function formatDate(value) {
  return formatDateSl(value);
}

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [editRole, setEditRole] = useState(null);
  const [draftPermissions, setDraftPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [creating, setCreating] = useState(false);
  const canManageRoles = useCan("role_manage_activity");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [rolesRes, activitiesRes] = await Promise.all([
        fetchRoles(),
        fetchRoleActivities(),
      ]);
      setRoles(rolesRes.roles ?? []);
      setCategories(activitiesRes.categories ?? []);
    } catch (err) {
      setError(err.message || "Failed to load roles.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const editing = editRole ? roles.find((r) => r.name === editRole) : null;

  const filtered = useMemo(() => {
    if (!q.trim()) return roles;
    const s = q.toLowerCase();
    return roles.filter((role) =>
      [role.display_name, role.name, ...role.permissions].join(" ").toLowerCase().includes(s)
    );
  }, [roles, q]);

  function openEdit(roleName) {
    const role = roles.find((r) => r.name === roleName);
    if (!role) return;
    setEditRole(roleName);
    setDraftPermissions([...role.permissions]);
    setError(null);
  }

  function togglePermission(identifier) {
    setDraftPermissions((prev) =>
      prev.includes(identifier)
        ? prev.filter((entry) => entry !== identifier)
        : [...prev, identifier],
    );
  }

  async function handleSave() {
    if (!editRole) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateRolePermissions(editRole, draftPermissions);
      setRoles((prev) => prev.map((r) => (r.name === editRole ? res.role : r)));
      setEditRole(null);
    } catch (err) {
      setError(err.message || "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!newRoleName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createRole(newRoleName.trim());
      setRoles((prev) => [...prev, res.role].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      setNewRoleName("");
      openEdit(res.role.name);
    } catch (err) {
      setError(err.message || "Failed to create role.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading roles…
      </div>
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

      {error && !editRole ? (
        <div className="admin-fade-up mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-2 text-xl font-bold text-white sm:text-2xl">Manage System Roles</h1>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
              <Shield className="h-3 w-3 text-admin-teal" />
              {roles.length} roles
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManageRoles ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-admin-teal px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Role
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
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search role name, slug, permissions…"
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
          <table className="w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Created On</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((role) => (
                <tr
                  key={role.name}
                  className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.05]"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-admin-teal/10 text-admin-teal">
                        <Shield className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-white">{role.display_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {formatDate(role.created_at)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {canManageRoles ? (
                      <button
                        type="button"
                        onClick={() => openEdit(role.name)}
                        className="inline-flex rounded-lg bg-admin-teal p-1.5 text-white shadow-sm transition hover:brightness-110"
                        title="Edit permissions"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-14 text-center text-slate-400">
                    No results found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <div className="admin-modal-overlay z-[80]" onClick={() => !saving && setEditRole(null)}>
          <div
            className="admin-card flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden p-0 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {editing.display_name} Permission Settings
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Role slug: <span className="font-mono text-xs">{editing.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setEditRole(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
              {categories.length ? (
                <RolePermissionsEditor
                  categories={categories}
                  selected={draftPermissions}
                  onToggle={togglePermission}
                  disabled={saving}
                />
              ) : (
                <RolePermissionsEditorSkeleton />
              )}
              {error && editRole ? (
                <p className="mt-3 text-sm text-rose-300">{error}</p>
              ) : null}
            </div>

            <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditRole(null)}
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
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreate ? (
        <div className="admin-modal-overlay z-[80]" onClick={() => !creating && setShowCreate(false)}>
          <div className="admin-card w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Create New Role</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Use a lowercase slug, e.g.{" "}
                  <code className="text-admin-teal">withdrawal-authorizer</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => !creating && setShowCreate(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="role-name"
              className={inputCls}
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !newRoleName.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-theme-green-action px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
