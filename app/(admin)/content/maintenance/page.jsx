"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Power } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";
import { fetchMaintenanceMode, saveMaintenanceMode } from "@/lib/maintenance-mode";

const DEFAULT_MESSAGE =
  "We are currently performing scheduled maintenance. Please check back shortly.";

export default function MaintenanceModePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMaintenanceMode();
      const maintenanceMode = data.maintenanceMode || {};
      setEnabled(Boolean(maintenanceMode.enabled));
      setMessage(maintenanceMode.message || DEFAULT_MESSAGE);
      setUpdatedAt(maintenanceMode.updatedAt || null);
    } catch (err) {
      setError(err.message || "Failed to load maintenance mode settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle() {
    const nextEnabled = !enabled;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await saveMaintenanceMode({ enabled: nextEnabled });
      const maintenanceMode = data.maintenanceMode || {};
      setEnabled(Boolean(maintenanceMode.enabled));
      setMessage(maintenanceMode.message || DEFAULT_MESSAGE);
      setUpdatedAt(maintenanceMode.updatedAt || null);
      setSuccess(
        maintenanceMode.enabled
          ? "Maintenance mode is ON. Users will see a blocking popup."
          : "Maintenance mode is OFF. The website is available to users.",
      );
    } catch (err) {
      setError(err.message || "Failed to update maintenance mode.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMessage(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await saveMaintenanceMode({ message });
      const maintenanceMode = data.maintenanceMode || {};
      setEnabled(Boolean(maintenanceMode.enabled));
      setMessage(maintenanceMode.message || DEFAULT_MESSAGE);
      setUpdatedAt(maintenanceMode.updatedAt || null);
      setSuccess("Maintenance message saved.");
    } catch (err) {
      setError(err.message || "Failed to save maintenance message.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-10">
      <Breadcrumb
        items={[
          { label: "Content", href: "/content/maintenance" },
          { label: "Maintenance Mode" },
        ]}
      />

      <div className="admin-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Maintenance Mode</h1>
        <p className="mt-1 text-sm text-slate-400">
          Turn maintenance on to block the public website with a non-closable popup until you turn it off.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      ) : null}

      {loading ? (
        <div className="admin-card flex items-center gap-2 p-8 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading maintenance settings…
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="admin-card admin-fade-up p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Power className="h-4 w-4 text-admin-teal" />
                  Maintenance Status
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  When enabled, users cannot browse or interact with the website.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                  enabled ? "bg-theme-green-action" : "bg-white/15"
                } disabled:opacity-60`}
                aria-pressed={enabled}
                aria-label={enabled ? "Turn maintenance mode off" : "Turn maintenance mode on"}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                    enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div
              className={`mt-5 rounded-xl border px-4 py-3 ${
                enabled
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-emerald-500/30 bg-emerald-500/10"
              }`}
            >
              <p className={`text-sm font-semibold ${enabled ? "text-amber-200" : "text-emerald-200"}`}>
                {enabled ? "Maintenance mode is ON" : "Maintenance mode is OFF"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {enabled
                  ? "Visitors see a blocking popup and cannot use the site."
                  : "The website is available to all users."}
              </p>
              {updatedAt ? (
                <p className="mt-2 text-[11px] text-slate-500">Last updated: {updatedAt}</p>
              ) : null}
            </div>
          </section>

          <section className="admin-card admin-fade-up admin-fade-up-delay-1 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              User Message
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Shown inside the popup when maintenance mode is enabled.
            </p>

            <form onSubmit={handleSaveMessage} className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setSuccess("");
                  }}
                  rows={5}
                  maxLength={500}
                  className={`${inputCls} min-h-[120px] resize-y`}
                  placeholder={DEFAULT_MESSAGE}
                />
                <span className="mt-1 block text-right text-[11px] text-slate-500">
                  {message.length}/500
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Message
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
