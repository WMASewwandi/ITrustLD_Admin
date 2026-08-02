"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, Pencil, Trash2, X } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import DepositStatusConfirmModal from "@/components/admin/deposit-status-confirm-modal";
import { inputCls } from "@/components/admin/queue-ui";
import {
  createPromotionalBanner,
  deletePromotionalBanner,
  fetchPromotionalBanners,
  updatePromotionalBanner,
} from "@/lib/promotional-banners";

const EMPTY_FORM = {
  title: "",
  description: "",
  color: "#0D9F1B",
  ctaLink: "",
  ctaLabel: "Learn More",
  displayType: "Static Banner",
  audience: "Normal Users",
  activeFrom: "",
  activeTo: "",
  isActive: true,
  sortOrder: 0,
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
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function BannerPreview({ banner }) {
  const mediaUrl = banner.mediaPreviewUrl || banner.mediaUrl;
  const isVideo = mediaUrl && /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl);

  return (
    <div
      className="overflow-hidden rounded-xl border border-white/10 shadow-lg"
      style={{ background: `linear-gradient(135deg, ${banner.color}22 0%, ${banner.color}44 100%)` }}
    >
      <div className="border-b border-white/10 px-4 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Live Preview</p>
      </div>
      <div className="p-5">
        {mediaUrl ? (
          <div className="mb-4 overflow-hidden rounded-lg border border-white/10">
            {isVideo ? (
              <video src={mediaUrl} className="max-h-40 w-full object-cover" muted playsInline controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="" className="max-h-40 w-full object-cover" />
            )}
          </div>
        ) : null}
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
              {banner.ctaLabel || "Learn More"} →
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
          <span className="rounded-full bg-white/10 px-2 py-0.5">{banner.displayType}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5">{banner.audience}</span>
          {!banner.isActive ? (
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-300">Inactive</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [existingMediaUrl, setExistingMediaUrl] = useState("");
  const [removeMedia, setRemoveMedia] = useState(false);
  const [flash, setFlash] = useState("");
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const data = await fetchPromotionalBanners();
      setBanners(data.banners || []);
    } catch (err) {
      setPageError(err.message || "Failed to load promotional banners.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    };
  }, [mediaPreviewUrl]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFlash("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setMediaFile(null);
    setRemoveMedia(false);
    setExistingMediaUrl("");
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl("");
    setFlash("");
  }

  function handleMediaChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaFile(file);
    setRemoveMedia(false);
    setMediaPreviewUrl(URL.createObjectURL(file));
    setFlash("");
  }

  function clearMedia() {
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaFile(null);
    setMediaPreviewUrl("");
    setRemoveMedia(true);
    setExistingMediaUrl("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFlash("");
    setPageError("");
    try {
      const payload = { ...form, removeMedia };
      if (editId) {
        await updatePromotionalBanner(editId, payload, mediaFile);
        setFlash("updated");
      } else {
        await createPromotionalBanner(payload, mediaFile);
        setFlash("saved");
      }
      resetForm();
      await loadBanners();
    } catch (err) {
      setPageError(err.message || "Failed to save banner.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(banner) {
    setForm({
      title: banner.title,
      description: banner.description,
      color: banner.color,
      ctaLink: banner.ctaLink,
      ctaLabel: banner.ctaLabel || "Learn More",
      displayType: banner.displayType,
      audience: banner.audience,
      activeFrom: banner.activeFrom || "",
      activeTo: banner.activeTo || "",
      isActive: banner.isActive !== false,
      sortOrder: banner.sortOrder || 0,
    });
    setEditId(banner.id);
    setMediaFile(null);
    setRemoveMedia(false);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl("");
    setExistingMediaUrl(banner.mediaUrl || "");
    setFlash("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await deletePromotionalBanner(deleteConfirm.id);
      setDeleteConfirm(null);
      if (editId === deleteConfirm.id) resetForm();
      await loadBanners();
      setFlash("deleted");
    } catch (err) {
      setPageError(err.message || "Failed to delete banner.");
    } finally {
      setSaving(false);
    }
  }

  const previewBanner = {
    ...form,
    mediaPreviewUrl: mediaPreviewUrl || (!removeMedia ? existingMediaUrl : ""),
  };

  return (
    <div className="pb-10">
      <Breadcrumb items={[{ label: "Content", href: "/content/banners" }, { label: "Promotions & Banners" }]} />

      <div className="admin-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Promotions & Banners</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create promotional banners with audience targeting, scheduling, and live preview.
        </p>
      </div>

      {pageError ? (
        <div className="admin-card mb-4 px-5 py-3 text-sm text-rose-300">{pageError}</div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleSubmit} className="admin-card admin-fade-up p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-100">{editId ? "Edit Banner" : "Create Banner"}</h2>
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
                  <input value={form.color} onChange={(e) => update("color", e.target.value)} className={inputCls} />
                </div>
              </label>
              <label className="block">
                <FieldLabel>Sort Order</FieldLabel>
                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => update("sortOrder", Number(e.target.value) || 0)}
                  className={inputCls}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>CTA Link</FieldLabel>
                <input
                  value={form.ctaLink}
                  onChange={(e) => update("ctaLink", e.target.value)}
                  placeholder="/dashboard/loyalty"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <FieldLabel>CTA Label</FieldLabel>
                <input
                  value={form.ctaLabel}
                  onChange={(e) => update("ctaLabel", e.target.value)}
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

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => update("isActive", e.target.checked)}
                className="rounded border-white/20 bg-admin-surface"
              />
              Active
            </label>

            <div className="block">
              <FieldLabel>Media (Image / GIF / Video)</FieldLabel>
              {mediaPreviewUrl || existingMediaUrl ? (
                <div className="mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <span className="truncate">{mediaFile?.name || "Current media attached"}</span>
                  <button type="button" onClick={clearMedia} className="text-rose-300 hover:text-rose-200">
                    Remove
                  </button>
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*,video/*,.gif"
                onChange={handleMediaChange}
                className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-300`}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editId ? "Update Banner" : "Save Banner"}
            </button>
            {flash ? (
              <p className="text-center text-sm text-theme-green-action">
                Banner {flash} successfully.
              </p>
            ) : null}
          </div>
        </form>

        <div className="admin-card admin-fade-up admin-fade-up-delay-1 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Eye className="h-4 w-4 text-admin-teal" />
            Preview
          </h2>
          <BannerPreview banner={previewBanner} />
        </div>
      </div>

      <section className="admin-card admin-fade-up admin-fade-up-delay-2 mt-5 overflow-visible p-0">
        <div className="border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-100">All Banners</h2>
          <p className="text-xs text-slate-500">
            {loading ? "Loading…" : `${banners.length} promotion${banners.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Display</th>
                <th className="px-4 py-3">Active Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
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
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          b.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"
                        }`}
                      >
                        {b.isActive ? "Active" : "Inactive"}
                      </span>
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
                          onClick={() => setDeleteConfirm({ id: b.id, title: b.title })}
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

      <DepositStatusConfirmModal
        open={Boolean(deleteConfirm)}
        title="Delete promotional banner?"
        message={
          deleteConfirm
            ? `This will permanently delete "${deleteConfirm.title}".`
            : ""
        }
        confirmLabel="Delete"
        confirmClassName="bg-[#E11D48]"
        busy={saving}
        onCancel={() => {
          if (!saving) setDeleteConfirm(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
