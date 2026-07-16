"use client";

import { useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";

export default function BulkSmsPage() {
  const [queued, setQueued] = useState(false);
  const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none";

  return (
    <div>
      <Breadcrumb items={[{ label: "Content", href: "/content/templates" }, { label: "Bulk SMS" }]} />
      <h1 className="mb-5 text-2xl font-bold text-slate-900">Bulk SMS Queue</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQueued(true);
        }}
        className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <label className="block text-sm text-slate-600">
          Recipients
          <select className={field}>
            <option>All users</option>
            <option>Normal users</option>
            <option>Affiliate users</option>
            <option>Pending KYC segment</option>
          </select>
        </label>
        <label className="block text-sm text-slate-600">
          Message
          <textarea required rows={4} maxLength={160} className={field} placeholder="SMS content (max 160 chars)" />
        </label>
        <label className="block text-sm text-slate-600">Schedule (optional)<input type="datetime-local" className={field} /></label>
        <button type="submit" className="rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white">
          Queue Bulk SMS
        </button>
        {queued ? (
          <p className="text-sm text-theme-green-action">
            Messages entered queue — will send automatically (frontend demo). Status: Queued 0/sent.
          </p>
        ) : null}
      </form>
    </div>
  );
}
