"use client";

import { useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";

export default function LogosPage() {
  const [saved, setSaved] = useState(false);
  const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none";

  return (
    <div>
      <Breadcrumb items={[{ label: "Content", href: "/content/logos" }, { label: "Website Logo Upload" }]} />
      <h1 className="mb-5 text-2xl font-bold text-slate-900">Website Logo Upload</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
        className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <label className="block text-sm text-slate-600">Season / Campaign Name<input required className={field} /></label>
        <label className="block text-sm text-slate-600">Logo Upload (JPG/PNG/SVG)<input type="file" accept=".jpg,.jpeg,.png,.svg" className={field} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-slate-600">Active From<input type="date" className={field} /></label>
          <label className="block text-sm text-slate-600">Active To<input type="date" className={field} /></label>
        </div>
        <button type="submit" className="rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white">
          Save Logo
        </button>
        {saved ? <p className="text-sm text-theme-green-action">Logo scheduled (frontend demo).</p> : null}
      </form>
    </div>
  );
}
