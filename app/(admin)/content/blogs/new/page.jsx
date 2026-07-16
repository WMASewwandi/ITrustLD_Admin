"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-0.5 text-admin-danger">*</span> : null}
    </span>
  );
}

export default function NewBlogPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Blogs Management", href: "/content/blogs" },
          { label: "New Blog Post" },
        ]}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          window.setTimeout(() => router.push("/content/blogs"), 800);
        }}
        className="admin-card admin-fade-up mx-auto max-w-4xl p-6 sm:p-8"
      >
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
          Create a New Blog Post
        </h1>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block min-w-0">
            <FieldLabel required>Title</FieldLabel>
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Enter Title"
              className={inputCls}
            />
          </label>

          <label className="block min-w-0">
            <FieldLabel required>Banner Image</FieldLabel>
            <input
              required
              type="file"
              accept="image/*"
              onChange={() => setSaved(false)}
              className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700`}
            />
          </label>

          <label className="block min-w-0 sm:col-span-2">
            <FieldLabel required>Description</FieldLabel>
            <textarea
              required
              rows={6}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Enter Description"
              className={inputCls}
            />
          </label>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <button
            type="submit"
            className="rounded-xl bg-theme-green-action px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            Create Blog Post
          </button>
        </div>

        {saved ? (
          <p className="mt-4 text-right text-sm font-medium text-theme-green-action">
            Blog post created (frontend demo). Redirecting…
          </p>
        ) : null}
      </form>
    </div>
  );
}
