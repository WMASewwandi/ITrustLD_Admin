"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { BLOGS } from "@/lib/mock-data";

export default function BlogsPage() {
  const [rows, setRows] = useState(BLOGS);

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
        <Link
          href="/content/blogs/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-theme-green-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Create New
        </Link>
      </div>

      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Blog ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Published State</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
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
                    <td className="px-4 py-3 font-medium text-white">{b.id}</td>
                    <td className="px-4 py-3 font-medium text-white">{b.title}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-admin-accent underline decoration-admin-accent/40 underline-offset-2">
                        {b.publishedState}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-400">{b.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Link
                          href={`/content/blogs/${b.id}`}
                          className="rounded-lg bg-theme-green-action/90 p-1.5 text-white shadow-sm transition hover:brightness-110"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setRows((prev) => prev.filter((x) => x.id !== b.id))}
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
