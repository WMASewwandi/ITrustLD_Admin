"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Loader2, Send, Users, XCircle } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { useAppDialog } from "@/components/admin/app-dialog";
import { inputCls } from "@/components/admin/queue-ui";
import {
  cancelBulkSmsCampaign,
  createBulkSmsCampaign,
  fetchBulkSmsCampaigns,
} from "@/lib/bulk-sms";
import { fetchMessageTemplates } from "@/lib/message-templates";

const RECIPIENT_OPTIONS = [
  "All users",
  "Normal users",
  "Affiliate users",
  "Pending KYC segment",
];

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-300">
      {children}
      {required ? <span className="ml-0.5 text-admin-danger">*</span> : null}
    </span>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === "Sent"
      ? "bg-theme-green-action/20 text-emerald-300 ring-1 ring-theme-green-action/30"
      : status === "Sending"
        ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
        : status === "Failed" || status === "Cancelled"
          ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
          : "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function ProgressBar({ sent, total }) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  return (
    <div className="min-w-[100px]">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-admin-teal transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] tabular-nums text-slate-500">
        {sent}/{total} ({pct}%)
      </p>
    </div>
  );
}

export default function BulkSmsPage() {
  const { confirm } = useAppDialog();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ queued: 0, sending: 0, sent: 0 });
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ recipients: "All users", message: "", schedule: "", templateId: "" });

  const loadQueue = useCallback(async () => {
    setError("");
    try {
      const data = await fetchBulkSmsCampaigns();
      setQueue(data.campaigns || []);
      setStats(data.stats || { queued: 0, sending: 0, sent: 0 });
    } catch (err) {
      setError(err.message || "Failed to load bulk SMS queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await fetchMessageTemplates();
      const templates = (data.templates || []).filter((t) => t.type === "SMS" && t.active);
      setSmsTemplates(templates);
    } catch {
      setSmsTemplates([]);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    loadTemplates();
  }, [loadQueue, loadTemplates]);

  useEffect(() => {
    const hasActiveJobs = queue.some((job) => job.status === "Queued" || job.status === "Sending");
    if (!hasActiveJobs) return undefined;

    const intervalId = window.setInterval(loadQueue, 5000);
    return () => window.clearInterval(intervalId);
  }, [queue, loadQueue]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  }

  function handleTemplateSelect(templateId) {
    const template = smsTemplates.find((t) => String(t.id) === String(templateId));
    setForm((prev) => ({
      ...prev,
      templateId,
      message: template?.body || prev.message,
    }));
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createBulkSmsCampaign({
        recipients: form.recipients,
        message: form.message,
        schedule: form.schedule || null,
      });
      setForm((prev) => ({ ...prev, message: "", schedule: "", templateId: "" }));
      setSuccess("Bulk SMS queued successfully.");
      await loadQueue();
    } catch (err) {
      setError(err.message || "Failed to queue bulk SMS.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id) {
    if (!(await confirm("Cancel this bulk SMS campaign?", { title: "Cancel campaign", confirmLabel: "Cancel campaign" }))) return;
    setError("");
    try {
      await cancelBulkSmsCampaign(id);
      setSuccess("Campaign cancelled.");
      await loadQueue();
    } catch (err) {
      setError(err.message || "Failed to cancel campaign.");
    }
  }

  return (
    <div className="pb-10">
      <Breadcrumb
        items={[
          { label: "Content", href: "/content/templates" },
          { label: "Bulk SMS Queue" },
        ]}
      />

      <div className="admin-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Bulk SMS Queue</h1>
        <p className="mt-1 text-sm text-slate-400">
          Queue bulk SMS campaigns — messages send automatically in the background.
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

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Queued", count: stats.queued, tone: "text-sky-300", bg: "bg-sky-500/10" },
          { label: "Sending", count: stats.sending, tone: "text-amber-300", bg: "bg-amber-500/10" },
          { label: "Sent", count: stats.sent, tone: "text-emerald-300", bg: "bg-theme-green-action/10" },
        ].map((s) => (
          <div key={s.label} className={`admin-card flex items-center gap-3 p-4 ${s.bg}`}>
            <span className={`text-2xl font-bold tabular-nums ${s.tone}`}>{s.count}</span>
            <span className="text-sm font-medium text-slate-300">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <form onSubmit={handleSubmit} className="admin-card admin-fade-up p-5 xl:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Send className="h-4 w-4 text-admin-teal" />
            New Bulk SMS
          </h2>

          <div className="space-y-4">
            <label className="block">
              <FieldLabel required>Recipients</FieldLabel>
              <select
                value={form.recipients}
                onChange={(e) => update("recipients", e.target.value)}
                className={inputCls}
              >
                {RECIPIENT_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            {smsTemplates.length > 0 ? (
              <label className="block">
                <FieldLabel>Use SMS Template (optional)</FieldLabel>
                <select
                  value={form.templateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Custom message</option>
                  {smsTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="block">
              <FieldLabel required>Message</FieldLabel>
              <textarea
                required
                rows={4}
                maxLength={160}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="SMS content (max 160 chars)"
                className={inputCls}
              />
              <p className="mt-1 text-right text-[11px] text-slate-500">{form.message.length} / 160</p>
            </label>

            <label className="block">
              <FieldLabel>Schedule (optional)</FieldLabel>
              <input
                type="datetime-local"
                value={form.schedule}
                onChange={(e) => update("schedule", e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-slate-500">Leave empty to send immediately.</p>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Queue Bulk SMS
            </button>
          </div>
        </form>

        <section className="admin-card admin-fade-up admin-fade-up-delay-1 overflow-visible p-0 xl:col-span-3">
          <div className="border-b border-white/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-100">Queue Status</h2>
            <p className="text-xs text-slate-500">
              {loading ? "Loading…" : `${queue.length} job${queue.length !== 1 ? "s" : ""} in history`}
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading queue…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Recipients</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Scheduled</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                        No queued messages yet.
                      </td>
                    </tr>
                  ) : (
                    queue.map((job) => (
                      <tr
                        key={job.id}
                        className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.04]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                            <span className="font-medium text-white">{job.recipients}</span>
                          </div>
                        </td>
                        <td className="max-w-[200px] px-4 py-3">
                          <p className="truncate text-slate-400" title={job.message}>
                            {job.message}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 tabular-nums text-slate-400">
                            <Clock className="h-3 w-3 shrink-0" />
                            {job.scheduled}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ProgressBar sent={job.sent} total={job.total} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3">
                          {job.status === "Queued" || job.status === "Sending" ? (
                            <button
                              type="button"
                              onClick={() => handleCancel(job.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/15"
                              title="Cancel campaign"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancel
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
