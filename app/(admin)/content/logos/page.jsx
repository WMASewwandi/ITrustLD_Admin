"use client";

import { useState } from "react";
import { ImageIcon, Info, Plus, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";

const INITIAL_LOGOS = [
  {
    id: "lg-1",
    campaign: "Default Brand",
    fileName: "itrustld-logo.svg",
    activeFrom: "2025-01-01",
    activeTo: "2099-12-31",
  },
  {
    id: "lg-2",
    campaign: "Christmas 2025",
    fileName: "itrustld-xmas.png",
    activeFrom: "2025-12-01",
    activeTo: "2025-12-31",
  },
  {
    id: "lg-3",
    campaign: "New Year 2026",
    fileName: "itrustld-ny2026.png",
    activeFrom: "2026-01-01",
    activeTo: "2026-01-15",
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

function logoStatus(from, to) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(from);
  const end = new Date(to);
  if (today < start) return { label: "Scheduled", tone: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30" };
  if (today > end) return { label: "Expired", tone: "bg-white/10 text-slate-400 ring-1 ring-white/10" };
  return { label: "Active", tone: "bg-theme-green-action/20 text-emerald-300 ring-1 ring-theme-green-action/30" };
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function LogosPage() {
  const [logos, setLogos] = useState(INITIAL_LOGOS);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ campaign: "", activeFrom: "", activeTo: "", fileName: "" });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const entry = {
      id: `lg-${Date.now()}`,
      campaign: form.campaign,
      fileName: form.fileName || "uploaded-logo.png",
      activeFrom: form.activeFrom,
      activeTo: form.activeTo,
    };
    setLogos((prev) => [entry, ...prev]);
    setForm({ campaign: "", activeFrom: "", activeTo: "", fileName: "" });
    setSaved(true);
  }

  return (
    <div className="pb-10">
      <Breadcrumb items={[{ label: "Content", href: "/content/logos" }, { label: "Website Logo Upload" }]} />

      <div className="admin-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Website Logo Upload</h1>
        <p className="mt-1 text-sm text-slate-400">
          Schedule seasonal logos — the default logo restores automatically when a campaign ends.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <form onSubmit={handleSubmit} className="admin-card admin-fade-up p-5 xl:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Plus className="h-4 w-4 text-admin-teal" />
            Schedule New Logo
          </h2>

          <div className="space-y-4">
            <label className="block">
              <FieldLabel required>Season / Campaign Name</FieldLabel>
              <input
                required
                value={form.campaign}
                onChange={(e) => update("campaign", e.target.value)}
                placeholder="e.g. Vesak 2026"
                className={inputCls}
              />
            </label>

            <label className="block">
              <FieldLabel required>Logo Upload (JPG / PNG / SVG)</FieldLabel>
              <input
                required
                type="file"
                accept=".jpg,.jpeg,.png,.svg"
                onChange={(e) => update("fileName", e.target.files?.[0]?.name || "")}
                className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-300`}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel required>Active From</FieldLabel>
                <input
                  required
                  type="date"
                  value={form.activeFrom}
                  onChange={(e) => update("activeFrom", e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <FieldLabel required>Active To</FieldLabel>
                <input
                  required
                  type="date"
                  value={form.activeTo}
                  onChange={(e) => update("activeTo", e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Save Logo Schedule
            </button>
            {saved ? (
              <p className="text-center text-sm text-theme-green-action">Logo scheduled (frontend demo).</p>
            ) : null}
          </div>
        </form>

        <div className="space-y-4 xl:col-span-3">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <p className="text-sm text-amber-100/90">
              <span className="font-semibold text-amber-200">Auto-restore:</span> When a scheduled logo&apos;s active
              period ends, the website automatically reverts to the default brand logo.
            </p>
          </div>

          <section className="admin-card admin-fade-up admin-fade-up-delay-1 overflow-visible p-0">
            <div className="border-b border-white/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-100">Scheduled Logos</h2>
              <p className="text-xs text-slate-500">{logos.length} campaign{logos.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-left text-[13px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Active Period</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logos.map((logo) => {
                    const status = logoStatus(logo.activeFrom, logo.activeTo);
                    return (
                      <tr
                        key={logo.id}
                        className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.04]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                              <ImageIcon className="h-4 w-4 text-slate-400" />
                            </span>
                            <span className="font-medium text-white">{logo.campaign}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{logo.fileName}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-400">
                          {formatDate(logo.activeFrom)} — {formatDate(logo.activeTo)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.tone}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setLogos((prev) => prev.filter((x) => x.id !== logo.id))}
                            className="rounded-lg bg-admin-danger p-1.5 text-white shadow-sm transition hover:brightness-110"
                            title="Remove schedule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
