"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-teal-300"
      >
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            {last || !item.href ? (
              <span className="rounded-lg bg-teal-400/15 px-2 py-1 font-medium text-teal-300">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-teal-300"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
