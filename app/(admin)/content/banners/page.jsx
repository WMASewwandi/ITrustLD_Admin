"use client";

import { useState } from "react";
import { Eye, Pencil, Trash2, X } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";

const INITIAL_BANNERS = [
  {
    id: "bn-1",
    title: "Welcome Bonus — 10% Extra",
    description: "Deposit this week and earn an extra 10% on your first transaction.",
    color: "#0D9F1B",
    ctaLink: "https://itrustld.com/promo/welcome",
    displayType: "Static Banner",
    audience: "Normal Users",
    activeFrom: "2026-07-01",
    activeTo: "2026-07-31",
    mediaName: "welcome-bonus.gif",
  },
  {
    id: "bn-2",
    title: "Affiliate Tier Upgrade",
    description: "Refer 5 new users this month to unlock Gold affiliate rewards.",
    color: "#6858FF",
    ctaLink: "https://itrustld.com/affiliate",
    displayType: "Slider",
    audience: "Affiliate Users",
    activeFrom: "2026-06-15",
    activeTo: "2026-08-15",
    mediaName: "affiliate-slider.mp4",
  },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  color: "#0D9F1B",
  ctaLink: "",
  displayType: "Static Banner",
  audience: "Normal Users",
  activeFrom: "",
  activeTo: "",
  mediaName: "",
};

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-300">
      {children}
      {required ? <span className="ml-0.5 text-admin-danger">*</span> : null}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function BannerPreview({ banner }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-white/10 shadow-lg"
      style={{ background: `linear-gradient(135deg, ${banner.color}22 0%, ${banner.color}44 100%)` }}
    >
      <div className="border-b border-white/10 px-4 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Live Preview</p>
      </div>
      <div className="p-5">
        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: `${banner.color}33`, borderLeft: `4px solid ${banner.color}` }}
        >
          <p className="text-lg font-bold text-white">{banner.title || "Banner Title"}</p>
          <p className="mt-1.5 text-sm text-slate-300">{banner.description || "Banner description appears here."}</p>
          {banner.ctaLink ? (
            <span
              className="mt-3 inline-block rounded-lg px-4 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: banner.color }}
            >
              Learn More →
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
          <span className="rounded-full bg-white/10 px-2 py-0.5">{banner.displayType}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5">{banner.audience}</span>
          {banner.mediaName ? (
            <span className="rounded-full bg-white/10 px-2 py-0.5">{banner.mediaName}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState(INITIAL_BANNERS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [flash, setFlash] = useState("");

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFlash("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFlash("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const wasEdit = !!editId;
    if (editId) {
      setBanners((prev) => prev.map((b) => (b.id === editId ? { ...b, ...form } : b)));
    } else {
      setBanners((prev) => [{ id: `bn-${Date.now()}`, ...form }, ...prev]);
    }
    resetForm();
    setFlash(wasEdit ? "updated" : "saved");
  }

  function startEdit(banner) {
    setForm({
      title: banner.title,
      description: banner.description,
      color: banner.color,
      ctaLink: banner.ctaLink,
      displayType: banner.displayType,
      audience: banner.audience,
      activeFrom: banner.activeFrom,
      activeTo: banner.activeTo,
      mediaName: banner.mediaName,
    });
    setEditId(banner.id);
    setFlash("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="pb-10">
      <Breadcrumb items={[{ label: "Content", href: "/content/banners" }, { label: "Promotions & Banners" }]} />

      <div className="admin-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Promotions & Banners</h1>
        <p className="mt-1 text-sm text-slate-400">Create promotional banners with audience targeting and live preview.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleSubmit} className="admin-card admin-fade-up p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-100">
              {editId ? "Edit Banner" : "Create Banner"}
            </h2>
            {editId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            <label className="block">
              <FieldLabel required>Title</FieldLabel>
              <input required value={form.title} onChange={(e) => update("title", e.target.value)} className={inputCls} />
            </label>

            <label className="block">
              <FieldLabel>Description</FieldLabel>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className={inputCls}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Banner Color</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => update("color", e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    value={form.color}
                    onChange={(e) => update("color", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </label>
              <label className="block">
                <FieldLabel>CTA Link</FieldLabel>
                <input
                  value={form.ctaLink}
                  onChange={(e) => update("ctaLink", e.target.value)}
                  placeholder="https://"
                  className={inputCls}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Display Type</FieldLabel>
                <select value={form.displayType} onChange={(e) => update("displayType", e.target.value)} className={inputCls}>
                  <option>Static Banner</option>
                  <option>Slider</option>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Active From</FieldLabel>
                <input type="date" value={form.activeFrom} onChange={(e) => update("activeFrom", e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <FieldLabel>Active To</FieldLabel>
                <input type="date" value={form.activeTo} onChange={(e) => update("activeTo", e.target.value)} className={inputCls} />
              </label>
            </div>

            <label className="block">
              <FieldLabel>Media (Image / GIF / Video)</FieldLabel>
              <input
                type="file"
                accept="image/*,video/*,.gif"
                onChange={(e) => update("mediaName", e.target.files?.[0]?.name || "")}
                className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-300`}
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              {editId ? "Update Banner" : "Save Banner"}
            </button>
            {flash ? (
              <p className="text-center text-sm text-theme-green-action">
                Banner {flash} (frontend demo).
              </p>
            ) : null}
          </div>
        </form>

        <div className="admin-card admin-fade-up admin-fade-up-delay-1 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Eye className="h-4 w-4 text-admin-teal" />
            Preview
          </h2>
          <BannerPreview banner={form} />
        </div>
      </div>

      <section className="admin-card admin-fade-up admin-fade-up-delay-2 mt-5 overflow-visible p-0">
        <div className="border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-100">All Banners</h2>
          <p className="text-xs text-slate-500">{banners.length} promotion{banners.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Display</th>
                <th className="px-4 py-3">Active Period</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    No banners yet.
                  </td>
                </tr>
              ) : (
                banners.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.04]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/10"
                          style={{ backgroundColor: b.color }}
                        />
                        <div>
                          <p className="font-medium text-white">{b.title}</p>
                          <p className="text-[11px] text-slate-500">{b.mediaName || "No media"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium">{b.audience}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{b.displayType}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-400">
                      {formatDate(b.activeFrom)} — {formatDate(b.activeTo)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(b)}
                          className="rounded-lg bg-theme-green-action/90 p-1.5 text-white shadow-sm transition hover:brightness-110"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBanners((prev) => prev.filter((x) => x.id !== b.id))}
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
      </section>
    </div>
  );
}
