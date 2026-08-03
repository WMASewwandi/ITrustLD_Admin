"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, Info, Loader2, Plus, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";
import {
  createWebsiteLogoSchedule,
  DEFAULT_WIDE_LOGO_URL,
  deleteWebsiteLogoSchedule,
  fetchWebsiteLogos,
  validateLogoFile,
  validateLogoSchedule,
} from "@/lib/website-logos";

const EMPTY_FORM = {
  campaign: "",
  activeFrom: "",
  activeTo: "",
};

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-300">
      {children}
      {required ? <span className="ml-0.5 text-admin-danger">*</span> : null}
    </span>
  );
}

function statusMeta(status) {
  switch (status) {
    case "default":
      return { label: "Default", tone: "bg-admin-teal/20 text-admin-teal ring-1 ring-admin-teal/30" };
    case "scheduled":
      return { label: "Scheduled", tone: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30" };
    case "expired":
      return { label: "Expired", tone: "bg-white/10 text-slate-400 ring-1 ring-white/10" };
    default:
      return { label: "Active", tone: "bg-theme-green-action/20 text-emerald-300 ring-1 ring-theme-green-action/30" };
  }
}

export default function LogosPage() {
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [formKey, setFormKey] = useState(0);

  const loadLogos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWebsiteLogos();
      setLogos(data.logos || []);
    } catch (err) {
      setError(err.message || "Failed to load logo schedules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogos();
  }, [loadLogos]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setLogoFile(file);
    setFileError("");
    setSuccess("");
    if (!file) return;

    const validation = validateLogoFile(file);
    if (validation) {
      setFileError(validation);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setFileError("");

    const validation = validateLogoSchedule({
      campaign: form.campaign,
      activeFrom: form.activeFrom,
      activeTo: form.activeTo,
      file: logoFile,
    });
    if (validation) {
      if (validation.includes("JPG") || validation.includes("2MB") || validation.includes("choose")) {
        setFileError(validation);
      } else {
        setError(validation);
      }
      return;
    }

    setSaving(true);
    try {
      await createWebsiteLogoSchedule(form, logoFile);
      setForm(EMPTY_FORM);
      setLogoFile(null);
      setFileError("");
      setFormKey((key) => key + 1);
      setSuccess("Logo schedule saved.");
      await loadLogos();
    } catch (err) {
      setError(err.message || "Failed to save logo schedule.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    setSuccess("");
    try {
      await deleteWebsiteLogoSchedule(id);
      setSuccess("Logo schedule removed.");
      await loadLogos();
    } catch (err) {
      setError(err.message || "Failed to delete logo schedule.");
    }
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

      <div className="grid gap-5 xl:grid-cols-5">
        <form key={formKey} onSubmit={handleSubmit} className="admin-card admin-fade-up p-5 xl:col-span-2">
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
              <FieldLabel required>Logo Upload (JPG / PNG / SVG, max 2MB)</FieldLabel>
              <input
                required
                type="file"
                accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
                onChange={handleFileChange}
                className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-300`}
              />
              {fileError ? <p className="mt-1.5 text-xs text-red-400">{fileError}</p> : null}
              {logoFile ? <p className="mt-1.5 text-xs text-slate-500">{logoFile.name}</p> : null}
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
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Logo Schedule
            </button>
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
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading logos…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full text-left text-[13px]">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Campaign</th>
                      <th className="px-4 py-3">Preview</th>
                      <th className="px-4 py-3">Active Period</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logos.map((logo) => {
                      const status = statusMeta(logo.status);
                      const previewUrl = logo.isDefault ? DEFAULT_WIDE_LOGO_URL : logo.logoUrl;
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
                          <td className="px-4 py-3">
                            {previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={previewUrl} alt="" className="h-8 w-auto max-w-[120px] object-contain" />
                            ) : (
                              <span className="text-slate-500">{logo.fileName}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-slate-400">
                            {logo.activeFromDisplay} — {logo.activeToDisplay}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.tone}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {logo.isDefault ? (
                              <span className="text-xs text-slate-500">Protected</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDelete(logo.id)}
                                className="rounded-lg bg-admin-danger p-1.5 text-white shadow-sm transition hover:brightness-110"
                                title="Remove schedule"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
