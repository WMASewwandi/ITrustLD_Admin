"use client";

import { useState } from "react";
import { Copy, Eye, Mail, MessageSquare, ToggleLeft, ToggleRight } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";

const PLACEHOLDERS = [
  { key: "{{username}}", sample: "John Doe" },
  { key: "{{transaction_id}}", sample: "TXN-88421" },
  { key: "{{amount}}", sample: "LKR 25,000" },
  { key: "{{promo_code}}", sample: "TRUST10" },
];

const INITIAL_TEMPLATES = [
  {
    id: "tpl-1",
    name: "Deposit Confirmation",
    type: "Email",
    subject: "Your deposit {{transaction_id}} is confirmed",
    body: "Hi {{username}}, your deposit of {{amount}} has been successfully processed. Transaction ref: {{transaction_id}}.",
    audience: "Normal Users",
    active: true,
  },
  {
    id: "tpl-2",
    name: "Withdrawal Approved SMS",
    type: "SMS",
    subject: "",
    body: "Hi {{username}}, withdrawal {{transaction_id}} for {{amount}} has been approved. — iTrustLD",
    audience: "Both",
    active: true,
  },
  {
    id: "tpl-3",
    name: "Affiliate Promo Blast",
    type: "Email",
    subject: "Exclusive offer — use code {{promo_code}}",
    body: "Hello {{username}}, share code {{promo_code}} with your referrals and earn bonus rewards this month!",
    audience: "Affiliate Users",
    active: false,
  },
];

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

function renderPreview(text) {
  let out = text;
  PLACEHOLDERS.forEach(({ key, sample }) => {
    out = out.split(key).join(sample);
  });
  return out;
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
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function insertPlaceholder(key) {
    setForm((prev) => ({ ...prev, body: `${prev.body}${key}` }));
    setSaved(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTemplates((prev) => [
      { id: `tpl-${Date.now()}`, ...form, active: true },
      ...prev,
    ]);
    setForm(EMPTY_FORM);
    setSaved(true);
  }

  function toggleActive(id) {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));
  }

  function duplicateTemplate(tpl) {
    setTemplates((prev) => [
      {
        ...tpl,
        id: `tpl-${Date.now()}`,
        name: `${tpl.name} (Copy)`,
        active: false,
      },
      ...prev,
    ]);
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

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleSubmit} className="admin-card admin-fade-up p-5">
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
                <FieldLabel>Subject</FieldLabel>
                <input
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
                value={form.body}
                onChange={(e) => update("body", e.target.value)}
                placeholder="Hi {{username}}, your transaction {{transaction_id}}..."
                className={inputCls}
              />
            </label>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Insert Placeholders
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map(({ key }) => (
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
              className="w-full rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Save Template
            </button>
            {saved ? (
              <p className="text-center text-sm text-theme-green-action">Template saved (frontend demo).</p>
            ) : null}
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
              <p className="mb-2 text-sm font-semibold text-white">{renderPreview(form.subject)}</p>
            ) : null}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {form.body ? renderPreview(form.body) : "Template body preview will appear here."}
            </p>
            {form.type === "SMS" && form.body ? (
              <p className="mt-3 text-right text-[11px] text-slate-500">
                {renderPreview(form.body).length} / 160 chars
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <section className="admin-card admin-fade-up admin-fade-up-delay-2 mt-5 overflow-visible p-0">
        <div className="border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Saved Templates</h2>
          <p className="text-xs text-slate-500">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
        </div>
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
              {templates.map((t) => (
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
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium">{t.audience}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(t.id)}
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
                    <button
                      type="button"
                      onClick={() => duplicateTemplate(t)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/15"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
