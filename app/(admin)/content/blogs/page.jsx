"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageOff, Pencil, Plus, Trash2, X } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";
import { BLOG_PUBLISHED_STATES } from "@/lib/mock-data";
import {
  createBlog,
  deleteBlog,
  fetchBlogs,
  getBlogBannerUrl,
  updateBlog,
} from "@/lib/blogs";

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-300">
      {children}
      {required ? <span className="ml-0.5 text-admin-danger">*</span> : null}
    </span>
  );
}

function BannerThumb({ blog, onView }) {
  const [failed, setFailed] = useState(false);
  const bannerUrl = blog?.banner ? getBlogBannerUrl(blog) : null;

  if (bannerUrl && !failed) {
    return (
      <button
        type="button"
        onClick={() => onView(bannerUrl)}
        className="block h-10 w-16 overflow-hidden rounded-lg border border-white/15 bg-white/5 transition hover:ring-2 hover:ring-admin-accent/50"
        title="View banner"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onView(null)}
      className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-white/5 text-white/35 transition hover:ring-2 hover:ring-admin-accent/50"
      title="No banner image"
    >
      <ImageOff className="h-4 w-4" aria-hidden />
    </button>
  );
}

function ImageViewerModal({ open, imageUrl, onClose }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl, open]);

  if (!open) return null;

  const showPlaceholder = !imageUrl || failed;

  return (
    <div className="admin-modal-overlay z-[90]" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="admin-card relative max-h-[90vh] w-full max-w-3xl overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-black/70"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {showPlaceholder ? (
          <div className="flex h-64 items-center justify-center bg-[#141A2E] sm:h-80">
            <ImageOff className="h-12 w-12 text-white/30" aria-hidden />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Blog banner"
            className="max-h-[85vh] w-full object-contain"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}

function emptyForm() {
  return {
    title: "",
    publishedState: "published",
    description: "",
  };
}

function formFromBlog(blog) {
  return {
    title: blog.title,
    publishedState: blog.publishedState === "published" ? "published" : "unpublished",
    description: blog.description,
  };
}

function BannerPreview({ src }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="relative flex h-36 items-center justify-center bg-[#141A2E]">
        <ImageOff className="h-10 w-10 text-white/30" aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-36 w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function BlogFormModal({ open, mode, blog, saving, error, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && blog) {
      setForm(formFromBlog(blog));
      setExistingBannerUrl(blog.banner ? getBlogBannerUrl(blog) : null);
    } else {
      setForm(emptyForm());
      setExistingBannerUrl(null);
    }
    setBannerFile(null);
    setLocalError("");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [open, mode, blog]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!open) return null;

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setLocalError("");
  }

  function onBannerChange(e) {
    const file = e.target.files?.[0] ?? null;
    setBannerFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setLocalError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === "create" && !bannerFile) {
      setLocalError("Banner image is required.");
      return;
    }
    onSave({
      ...form,
      bannerFile,
    });
  }

  const displayPreview = previewUrl || existingBannerUrl;
  const displayError = localError || error;

  return (
    <div className="admin-modal-overlay z-[80]" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="admin-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-white">
            {mode === "edit" ? "Edit Blog Post" : "Create Blog Post"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"
            aria-label="Close"
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <BannerPreview src={displayPreview} />
          </div>

          <label className="block min-w-0">
            <FieldLabel required>Title</FieldLabel>
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Enter title"
              className={inputCls}
              disabled={saving}
            />
          </label>

          <label className="block min-w-0">
            <FieldLabel required={mode === "create"}>Banner Image</FieldLabel>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml,image/webp"
              onChange={onBannerChange}
              className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-300`}
              disabled={saving}
            />
          </label>

          {mode === "edit" ? (
            <label className="block min-w-0">
              <FieldLabel required>Published State</FieldLabel>
              <select
                required
                value={form.publishedState}
                onChange={(e) => update("publishedState", e.target.value)}
                className={inputCls}
                disabled={saving}
              >
                {BLOG_PUBLISHED_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state.charAt(0).toUpperCase() + state.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block min-w-0">
            <FieldLabel required>Description</FieldLabel>
            <textarea
              required
              rows={6}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Enter description"
              className={inputCls}
              disabled={saving}
            />
          </label>

          {displayError ? (
            <p className="text-sm text-admin-danger">{displayError}</p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="admin-btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-theme-green-action px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Saving…" : mode === "edit" ? "Update Blog Post" : "Create Blog Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BlogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formModal, setFormModal] = useState(null);
  const [formError, setFormError] = useState("");
  const [imageViewer, setImageViewer] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { blogs } = await fetchBlogs();
      setRows(blogs || []);
    } catch (err) {
      setError(err?.message || "Failed to load blog posts.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  function openCreate() {
    setFormError("");
    setFormModal({ mode: "create", blog: null });
  }

  function openEdit(blog) {
    setFormError("");
    setFormModal({ mode: "edit", blog });
  }

  async function handleSave(formData) {
    setSaving(true);
    setFormError("");
    try {
      if (formModal?.mode === "edit" && formModal.blog) {
        const { blog } = await updateBlog(formModal.blog.id, {
          title: formData.title,
          description: formData.description,
          publishedState: formData.publishedState,
          bannerFile: formData.bannerFile,
        });
        setRows((prev) => prev.map((row) => (row.id === blog.id ? blog : row)));
        showToast("Blog post updated.");
      } else {
        if (!formData.bannerFile) {
          setFormError("Banner image is required.");
          return;
        }
        const { blog } = await createBlog({
          title: formData.title,
          description: formData.description,
          bannerFile: formData.bannerFile,
        });
        setRows((prev) => [blog, ...prev]);
        showToast("Blog post created.");
      }
      setFormModal(null);
      await loadBlogs();
    } catch (err) {
      setFormError(err?.message || "Could not save blog post.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(blog) {
    try {
      await deleteBlog(blog.id);
      setRows((prev) => prev.filter((row) => row.id !== blog.id));
      showToast("Blog post deleted.");
    } catch (err) {
      showToast(err?.message || "Could not delete blog post.");
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Blogs Management", href: "/content/blogs" },
          { label: "Blog Posts" },
        ]}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-white">Blog Posts</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Create New
        </button>
      </div>

      {toast ? (
        <p className="admin-fade-up mb-4 text-sm font-medium text-theme-green-action">{toast}</p>
      ) : null}

      {error ? (
        <p className="admin-fade-up mb-4 text-sm font-medium text-admin-danger">{error}</p>
      ) : null}

      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Banner</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Published State</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    Loading blog posts…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    No blog posts yet.
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t border-white/10 text-slate-300 transition hover:bg-admin-teal/[0.04]"
                  >
                    <td className="px-4 py-3">
                      <BannerThumb
                        blog={b}
                        onView={(url) => setImageViewer({ url })}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{b.title}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-admin-accent underline decoration-admin-accent/40 underline-offset-2">
                        {b.publishedState}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-400">{b.createdAt}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          className="rounded-lg bg-theme-green-action/90 p-1.5 text-white shadow-sm transition hover:brightness-110"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
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

      <BlogFormModal
        open={!!formModal}
        mode={formModal?.mode}
        blog={formModal?.blog}
        saving={saving}
        error={formError}
        onClose={() => !saving && setFormModal(null)}
        onSave={handleSave}
      />

      <ImageViewerModal
        open={!!imageViewer}
        imageUrl={imageViewer?.url}
        onClose={() => setImageViewer(null)}
      />
    </div>
  );
}
