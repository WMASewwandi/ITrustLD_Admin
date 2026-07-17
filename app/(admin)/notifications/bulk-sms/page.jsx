"use client";

import { useState } from "react";
import { Clock, Send, Users } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";

const INITIAL_QUEUE = [
  {
    id: "q-1",
    recipients: "All users",
    message: "iTrustLD maintenance tonight 11 PM–1 AM. Services resume automatically.",
    scheduled: "2026-07-16 18:00",
    status: "Sent",
    sent: 1240,
    total: 1240,
  },
  {
    id: "q-2",
    recipients: "Affiliate users",
    message: "New affiliate tier rewards are live! Check your dashboard for details.",
    scheduled: "2026-07-17 10:00",
    status: "Sending",
    sent: 87,
    total: 156,
  },
  {
    id: "q-3",
    recipients: "Pending KYC segment",
    message: "Complete your KYC verification to unlock full deposit and withdrawal limits.",
    scheduled: "2026-07-17 20:00",
    status: "Queued",
    sent: 0,
    total: 312,
  },
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
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [queued, setQueued] = useState(false);
  const [form, setForm] = useState({ recipients: "All users", message: "", schedule: "" });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setQueued(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const entry = {
      id: `q-${Date.now()}`,
      recipients: form.recipients,
      message: form.message,
      scheduled: form.schedule || new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "Queued",
      sent: 0,
      total: Math.floor(Math.random() * 400) + 100,
    };
    setQueue((prev) => [entry, ...prev]);
    setForm((prev) => ({ ...prev, message: "", schedule: "" }));
    setQueued(true);
  }

  const stats = {
    queued: queue.filter((q) => q.status === "Queued").length,
    sending: queue.filter((q) => q.status === "Sending").length,
    sent: queue.filter((q) => q.status === "Sent").length,
  };

  return (
    <div className="pb-10">
      <Breadcrumb
        items={[
          { label: "Notifications", href: "/notifications/bulk-sms" },
          { label: "Bulk SMS" },
        ]}
      />

      <div className="admin-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Bulk SMS Queue</h1>
        <p className="mt-1 text-sm text-slate-400">
          Queue bulk SMS campaigns — messages send automatically in the background.
        </p>
      </div>

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
                <option>All users</option>
                <option>Normal users</option>
                <option>Affiliate users</option>
                <option>Pending KYC segment</option>
              </select>
            </label>

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
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Queue Bulk SMS
            </button>
            {queued ? (
              <p className="text-center text-sm text-theme-green-action">
                Message entered queue — will send automatically (frontend demo).
              </p>
            ) : null}
          </div>
        </form>

        <section className="admin-card admin-fade-up admin-fade-up-delay-1 overflow-visible p-0 xl:col-span-3">
          <div className="border-b border-white/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-100">Queue Status</h2>
            <p className="text-xs text-slate-500">{queue.length} job{queue.length !== 1 ? "s" : ""} in history</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-[13px]">
              <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Recipients</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
