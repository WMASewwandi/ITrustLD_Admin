"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Pencil, Trash2, X } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import DepositStatusConfirmModal from "@/components/admin/deposit-status-confirm-modal";
import { FormError, inputCls } from "@/components/admin/queue-ui";
import {
  VIDEO_TUTORIAL_CATEGORIES,
  createVideoTutorial,
  deleteVideoTutorial,
  fetchVideoTutorials,
  updateVideoTutorial,
} from "@/lib/video-tutorials";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  youtubeUrl: "",
  category: "New and Trending",
  duration: "",
  isNew: false,
  sortOrder: 0,
  isActive: true,
};

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-300">
      {children}
      {required ? <span className="ml-0.5 text-admin-danger">*</span> : null}
    </span>
  );
}

function TutorialPreview({ tutorial }) {
  const thumb = tutorial.thumbnailUrl;
  const embed = tutorial.embedUrl;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg">
      <div className="border-b border-white/10 px-4 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Preview</p>
      </div>
      <div className="p-4">
        {embed ? (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <iframe
              title={tutorial.title || "Video preview"}
              src={embed}
              className="aspect-video w-full bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="aspect-video w-full rounded-lg object-cover" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-lg bg-white/5 text-sm text-slate-400">
            Enter a YouTube URL to preview
          </div>
        )}
        <p className="mt-3 text-base font-semibold text-white">{tutorial.title || "Tutorial title"}</p>
        {tutorial.subtitle ? <p className="mt-1 text-sm text-slate-400">{tutorial.subtitle}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
          <span className="rounded-full bg-white/10 px-2 py-0.5">{tutorial.category || "New and Trending"}</span>
          {tutorial.duration ? (
            <span className="rounded-full bg-white/10 px-2 py-0.5">{tutorial.duration}</span>
          ) : null}
          {tutorial.isNew ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">New</span>
          ) : null}
          {!tutorial.isActive ? (
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-300">Inactive</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function VideoTutorialsPage() {
  const [tutorials, setTutorials] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [flash, setFlash] = useState("");
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadTutorials = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const data = await fetchVideoTutorials();
      setTutorials(data.tutorials || []);
    } catch (err) {
      setPageError(err.message || "Failed to load video tutorials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTutorials();
  }, [loadTutorials]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFlash("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFlash("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFlash("");
    setPageError("");
    try {
      if (editId) {
        await updateVideoTutorial(editId, form);
        setFlash("updated");
      } else {
        await createVideoTutorial(form);
        setFlash("saved");
      }
      resetForm();
      await loadTutorials();
    } catch (err) {
      setPageError(err.message || "Failed to save video tutorial.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(tutorial) {
    setEditId(tutorial.id);
    setForm({
      title: tutorial.title,
      subtitle: tutorial.subtitle || "",
      youtubeUrl: tutorial.youtubeUrl || tutorial.youtubeId || "",
      category: tutorial.category || "New and Trending",
      duration: tutorial.duration || "",
      isNew: Boolean(tutorial.isNew),
      sortOrder: tutorial.sortOrder || 0,
      isActive: tutorial.isActive !== false,
    });
    setFlash("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    setPageError("");
    try {
      await deleteVideoTutorial(id);
      if (editId === id) resetForm();
      setDeleteConfirm(null);
      await loadTutorials();
    } catch (err) {
      setPageError(err.message || "Failed to delete video tutorial.");
    }
  }

  const previewTutorial = {
    ...form,
    thumbnailUrl: form.youtubeUrl
      ? `https://img.youtube.com/vi/${extractPreviewId(form.youtubeUrl)}/hqdefault.jpg`
      : "",
    embedUrl: form.youtubeUrl
      ? `https://www.youtube.com/embed/${extractPreviewId(form.youtubeUrl)}`
      : "",
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Content", href: "/content/video-tutorials" },
          { label: "Video Tutorials" },
        ]}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Video Tutorials</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage YouTube tutorials shown on the public homepage.
          </p>
        </div>
      </div>

      {pageError && !deleteConfirm ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {pageError}
        </div>
      ) : null}

      {flash ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {flash === "saved" ? "Video tutorial created." : "Video tutorial updated."}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit} className="admin-card space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              {editId ? "Edit Tutorial" : "Add Tutorial"}
            </h2>
            {editId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel required>Title</FieldLabel>
              <input
                className={inputCls}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Sign Up on ITrustLD"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Subtitle</FieldLabel>
              <input
                className={inputCls}
                value={form.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
                placeholder="Short description shown under the title"
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel required>YouTube URL or Video ID</FieldLabel>
              <input
                className={inputCls}
                value={form.youtubeUrl}
                onChange={(e) => update("youtubeUrl", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=bxhgIx_dHok"
                required
              />
            </div>

            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              >
                {VIDEO_TUTORIAL_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Duration</FieldLabel>
              <input
                className={inputCls}
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
                placeholder="3:12"
              />
            </div>

            <div>
              <FieldLabel>Sort order</FieldLabel>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", Number(e.target.value))}
              />
            </div>

            <div className="flex flex-col justify-end gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => update("isNew", e.target.checked)}
                  className="rounded border-white/20 bg-white/5"
                />
                Mark as new
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => update("isActive", e.target.checked)}
                  className="rounded border-white/20 bg-white/5"
                />
                Active
              </label>
            </div>
          </div>

          <FormError message={!deleteConfirm ? pageError : ""} />
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-admin-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editId ? "Update Tutorial" : "Create Tutorial"}
            </button>
          </div>
        </form>

        <TutorialPreview tutorial={previewTutorial} />
      </div>

      <div className="admin-card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">All Tutorials</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading tutorials...
          </div>
        ) : tutorials.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">No video tutorials yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Video</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tutorials.map((tutorial) => (
                  <tr key={tutorial.id} className="text-slate-200">
                    <td className="px-5 py-4">{tutorial.sortOrder}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tutorial.thumbnailUrl}
                          alt=""
                          className="h-10 w-16 rounded-md object-cover"
                        />
                        <a
                          href={tutorial.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 transition hover:text-white"
                          title="Open on YouTube"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{tutorial.title}</p>
                      {tutorial.subtitle ? (
                        <p className="mt-0.5 text-xs text-slate-400">{tutorial.subtitle}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">{tutorial.category}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {tutorial.isActive ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-300">
                            Inactive
                          </span>
                        )}
                        {tutorial.isNew ? (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                            New
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(tutorial)}
                          className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(tutorial)}
                          className="rounded-lg border border-rose-500/20 p-2 text-rose-300 transition hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DepositStatusConfirmModal
        open={Boolean(deleteConfirm)}
        title="Delete video tutorial?"
        message={
          deleteConfirm
            ? `Remove "${deleteConfirm.title}" from the homepage? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        confirmClassName="bg-rose-600"
        error={pageError}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        onCancel={() => {
          setDeleteConfirm(null);
          setPageError("");
        }}
      />
    </div>
  );
}

function extractPreviewId(value) {
  const raw = String(value || "").trim();
  if (/^[\w-]{11}$/.test(raw)) return raw;
  const match = raw.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i,
  );
  return match?.[1] || "";
}
