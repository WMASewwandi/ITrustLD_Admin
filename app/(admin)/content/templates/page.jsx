"use client";

import { useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";

export default function TemplatesPage() {
  const [type, setType] = useState("Email");
  const [saved, setSaved] = useState(false);
  const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none";

  return (
    <div>
      <Breadcrumb items={[{ label: "Content", href: "/content/templates" }, { label: "SMS & Email Templates" }]} />
      <h1 className="mb-5 text-2xl font-bold text-slate-900">SMS / Email Templates</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
        className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <label className="block text-sm text-slate-600">
          Template Type
          <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
            <option>Email</option>
            <option>SMS</option>
          </select>
        </label>
        {type === "Email" ? <label className="block text-sm text-slate-600">Subject<input className={field} /></label> : null}
        <label className="block text-sm text-slate-600">
          Body
          <textarea rows={5} className={field} placeholder="Hi {{username}}, your transaction {{transaction_id}}..." />
        </label>
        <p className="text-xs text-slate-400">Placeholders: username, transaction details, promotional codes</p>
        <label className="block text-sm text-slate-600">
          Target Audience
          <select className={field}>
            <option>Normal Users</option>
            <option>Affiliate Users</option>
            <option>Both</option>
          </select>
        </label>
        <button type="submit" className="rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white">
          Save Template
        </button>
        {saved ? <p className="text-sm text-theme-green-action">Template saved (frontend demo).</p> : null}
      </form>
    </div>
  );
}
