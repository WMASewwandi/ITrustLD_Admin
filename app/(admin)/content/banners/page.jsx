"use client";

import { useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";

export default function BannersPage() {
  const [saved, setSaved] = useState(false);
  const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none";

  return (
    <div>
      <Breadcrumb items={[{ label: "Content", href: "/content/banners" }, { label: "Promotions & Banners" }]} />
      <h1 className="mb-5 text-2xl font-bold text-slate-900">Promotions & Banners</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
        className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <label className="block text-sm text-slate-600">Title<input required className={field} /></label>
        <label className="block text-sm text-slate-600">Description<textarea rows={3} className={field} /></label>
        <label className="block text-sm text-slate-600">Banner Color<input type="color" defaultValue="#0D9F1B" className={field} /></label>
        <label className="block text-sm text-slate-600">CTA Link<input className={field} placeholder="https://" /></label>
        <label className="block text-sm text-slate-600">
          Display Type
          <select className={field}>
            <option>Static Banner</option>
            <option>Slider</option>
          </select>
        </label>
        <label className="block text-sm text-slate-600">
          Target Audience
          <select className={field}>
            <option>Normal Users</option>
            <option>Affiliate Users</option>
            <option>Both</option>
          </select>
        </label>
        <label className="block text-sm text-slate-600">Media (Image/GIF/Video)<input type="file" className={field} /></label>
        <button type="submit" className="rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white">
          Save Banner
        </button>
        {saved ? <p className="text-sm text-theme-green-action">Banner saved (frontend demo).</p> : null}
      </form>
    </div>
  );
}
