"use client";

import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search-as-you-type…" }) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-teal/70" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-admin-teal/50 focus:ring-2 focus:ring-admin-teal/15"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
