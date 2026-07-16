"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white hover:text-admin-teal"
      >
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            {last || !item.href ? (
              <span className="rounded-lg bg-admin-teal/10 px-2 py-1 font-medium text-admin-teal">{item.label}</span>
            ) : (
              <Link href={item.href} className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white hover:text-admin-teal">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
