"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";
import { BLOG_PUBLISHED_STATES, getBlogById } from "@/lib/mock-data";

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-0.5 text-admin-danger">*</span> : null}
    </span>
  );
}

function BannerPreview({ label, previewUrl }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <p className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Banner Preview
      </p>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Banner preview" className="h-44 w-full object-cover" />
      ) : (
        <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-[#0B1F3A] via-[#1A4A7A] to-[#0D9F1B]">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_30%,#fff_0,transparent_40%),radial-gradient(circle_at_80%_70%,#3B82F6_0,transparent_45%)]" />
          <span className="relative text-2xl font-bold tracking-[0.12em] text-white drop-shadow-md sm:text-3xl">
            {label || "XM / 15 YEARS"}
          </span>
        </div>
      )}
    </div>
  );
}

function emptyForm() {
  return {
    title: "",
    publishedState: "published",
    description: "",
    bannerLabel: "XM / 15 YEARS",
  };
}

function formFromBlog(blog) {
  return {
    title: blog.title,
    publishedState: blog.publishedState,
    description: blog.description,
    bannerLabel: blog.bannerLabel || "XM / 15 YEARS",
  };
}

export default function UpdateBlogPage() {
  const params = useParams();
  const blog = useMemo(() => getBlogById(params?.id), [params?.id]);

  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (blog) setForm(formFromBlog(blog));
    else setForm(emptyForm());
    setSaved(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [blog]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function onBannerChange(e) {
    const file = e.target.files?.[0];
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setSaved(false);
  }

  if (!blog) {
    return (
      <div>
        <Breadcrumb
          items={[
            { label: "Blogs Management", href: "/content/blogs" },
            { label: "Blog Posts", href: "/content/blogs" },
            { label: "Update Blog Post" },
          ]}
        />
        <section className="admin-card admin-fade-up p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Blog post not found</h1>
          <p className="mt-2 text-sm text-slate-500">This post may have been deleted or the ID is invalid.</p>
          <Link
            href="/content/blogs"
            className="mt-6 inline-flex rounded-xl bg-theme-green-action px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Blog Posts
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Blogs Management", href: "/content/blogs" },
          { label: "Blog Posts", href: "/content/blogs" },
          { label: "Update Blog Post" },
        ]}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
        className="admin-card admin-fade-up mx-auto max-w-3xl space-y-5 p-6 sm:p-8"
      >
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Update Blog Post</h1>

        <BannerPreview label={form.bannerLabel} previewUrl={previewUrl} />

        <label className="block min-w-0">
          <FieldLabel required>Title</FieldLabel>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="block min-w-0">
          <FieldLabel>Banner Image</FieldLabel>
          <input
            type="file"
            accept="image/*"
            onChange={onBannerChange}
            className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700`}
          />
        </label>

        <label className="block min-w-0">
          <FieldLabel required>Published State</FieldLabel>
          <select
            required
            value={form.publishedState}
            onChange={(e) => update("publishedState", e.target.value)}
            className={inputCls}
          >
            {BLOG_PUBLISHED_STATES.map((state) => (
              <option key={state} value={state}>
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <FieldLabel required>Description</FieldLabel>
          <textarea
            required
            rows={7}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputCls}
          />
        </label>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Link href="/content/blogs" className="admin-btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-xl bg-theme-green-action px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            Update Blog Post
          </button>
        </div>

        {saved ? (
          <p className="text-right text-sm font-medium text-theme-green-action">
            Blog post updated (frontend demo).
          </p>
        ) : null}
      </form>
    </div>
  );
}
