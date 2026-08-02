"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Eye, Loader2, Mail, MessageSquare, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  duplicateMessageTemplate,
  fetchMessageTemplates,
  renderTemplatePreview,
  TEMPLATE_PLACEHOLDERS,
  toggleMessageTemplateStatus,
} from "@/lib/message-templates";

const EMPTY_FORM = {
  name: "",
  type: "Email",
  subject: "",
  body: "",
  audience: "Normal Users",
};

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-300">
      {children}
      {required ? <span className="ml-0.5 text-admin-danger">*</span> : null}
    </span>
  );
}

function TypeBadge({ type }) {
  const isEmail = type === "Email";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isEmail ? "bg-sky-500/20 text-sky-300" : "bg-violet-500/20 text-violet-300"
      }`}
    >
      {isEmail ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
      {type}
    </span>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [placeholders, setPlaceholders] = useState(TEMPLATE_PLACEHOLDERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formKey, setFormKey] = useState(0);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMessageTemplates();
      setTemplates(data.templates || []);
      if (data.placeholders?.length) {
        setPlaceholders(data.placeholders);
      }
    } catch (err) {
      setError(err.message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  }

  function insertPlaceholder(key) {
    setForm((prev) => ({ ...prev, body: `${prev.body}${key}` }));
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createMessageTemplate(form);
      setForm(EMPTY_FORM);
      setFormKey((key) => key + 1);
      setSuccess("Template saved.");
      await loadTemplates();
    } catch (err) {
      setError(err.message || "Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id) {
    setError("");
    try {
      const data = await toggleMessageTemplateStatus(id);
      if (data.template) {
        setTemplates((prev) => prev.map((t) => (t.id === id ? data.template : t)));
      } else {
        await loadTemplates();
      }
    } catch (err) {
      setError(err.message || "Failed to update template status.");
    }
  }

  async function handleDuplicate(id) {
    setError("");
    try {
      await duplicateMessageTemplate(id);
      setSuccess("Template duplicated.");
      await loadTemplates();
    } catch (err) {
      setError(err.message || "Failed to duplicate template.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this template?")) return;
    setError("");
    try {
      await deleteMessageTemplate(id);
      setSuccess("Template deleted.");
      await loadTemplates();
    } catch (err) {
      setError(err.message || "Failed to delete template.");
    }
  }

  return (
    <div className="pb-10">
      <Breadcrumb items={[{ label: "Content", href: "/content/templates" }, { label: "SMS & Email Templates" }]} />

      <div className="admin-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">SMS / Email Templates</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create reusable message templates with dynamic placeholders.
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

      <div className="grid gap-5 xl:grid-cols-2">
        <form key={formKey} onSubmit={handleSubmit} className="admin-card admin-fade-up p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-100">Create Template</h2>

          <div className="space-y-4">
            <label className="block">
              <FieldLabel required>Template Name</FieldLabel>
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Deposit Confirmation"
                className={inputCls}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Template Type</FieldLabel>
                <select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputCls}>
                  <option>Email</option>
                  <option>SMS</option>
                </select>
              </label>
              <label className="block">
                <FieldLabel>Target Audience</FieldLabel>
                <select value={form.audience} onChange={(e) => update("audience", e.target.value)} className={inputCls}>
                  <option>Normal Users</option>
                  <option>Affiliate Users</option>
                  <option>Both</option>
                </select>
              </label>
            </div>

            {form.type === "Email" ? (
              <label className="block">
                <FieldLabel required>Subject</FieldLabel>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  placeholder="Subject with {{placeholders}}"
                  className={inputCls}
                />
              </label>
            ) : null}

            <label className="block">
              <FieldLabel required>Body</FieldLabel>
              <textarea
                required
                rows={5}
                maxLength={form.type === "SMS" ? 160 : undefined}
                value={form.body}
                onChange={(e) => update("body", e.target.value)}
                placeholder="Hi {{username}}, your transaction {{transaction_id}}..."
                className={inputCls}
              />
              {form.type === "SMS" ? (
                <p className="mt-1 text-right text-[11px] text-slate-500">{form.body.length} / 160</p>
              ) : null}
            </label>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Insert Placeholders
              </p>
              <div className="flex flex-wrap gap-1.5">
                {placeholders.map(({ key }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => insertPlaceholder(key)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-teal-300 transition hover:bg-white/10"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Template
            </button>
          </div>
        </form>

        <div className="admin-card admin-fade-up admin-fade-up-delay-1 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Eye className="h-4 w-4 text-admin-teal" />
            Preview
          </h2>
          <div className="rounded-xl border border-white/10 bg-admin-chrome-deep p-4">
            <div className="mb-3 flex items-center gap-2">
              <TypeBadge type={form.type} />
              <span className="text-xs text-slate-500">{form.audience}</span>
            </div>
            {form.type === "Email" && form.subject ? (
              <p className="mb-2 text-sm font-semibold text-white">
                {renderTemplatePreview(form.subject, placeholders)}
              </p>
            ) : null}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {form.body
                ? renderTemplatePreview(form.body, placeholders)
                : "Template body preview will appear here."}
            </p>
            {form.type === "SMS" && form.body ? (
              <p className="mt-3 text-right text-[11px] text-slate-500">
                {renderTemplatePreview(form.body, placeholders).length} / 160 chars
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <section className="admin-card admin-fade-up admin-fade-up-delay-2 mt-5 overflow-visible p-0">
        <div className="border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Saved Templates</h2>
          <p className="text-xs text-slate-500">
            {loading ? "Loading…" : `${templates.length} template${templates.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading templates…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left text-[13px]">
              <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      No templates yet.
                    </td>
                  </tr>
                ) : (
                  templates.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.04]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{t.name}</p>
                        <p className="mt-0.5 max-w-xs truncate text-[11px] text-slate-500">{t.body}</p>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={t.type} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium">
                          {t.audience}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(t.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium transition hover:text-white"
                          title={t.active ? "Deactivate" : "Activate"}
                        >
                          {t.active ? (
                            <>
                              <ToggleRight className="h-5 w-5 text-theme-green-action" />
                              <span className="text-emerald-300">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-5 w-5 text-slate-500" />
                              <span className="text-slate-500">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(t.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/15"
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="rounded-lg bg-admin-danger p-1.5 text-white shadow-sm transition hover:brightness-110"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
  );
}
