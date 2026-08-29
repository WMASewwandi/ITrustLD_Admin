"use client";

import { getVisiblePageNumbers } from "@/lib/admin-pagination";

const btnBase =
  "inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed";

export default function AdminPagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  className = "",
}) {
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(Math.max(1, Number(page) || 1), total);
  const pages = getVisiblePageNumbers(current, total);
  const atStart = current <= 1 || disabled;
  const atEnd = current >= total || disabled;

  function goTo(next) {
    const target = Math.min(Math.max(1, next), total);
    if (target === current || disabled) return;
    onPageChange?.(target);
  }

  return (
    <nav className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-label="Pagination">
      <button
        type="button"
        disabled={atStart}
        onClick={() => goTo(current - 1)}
        className={`${btnBase} ${
          atStart
            ? "bg-theme-gray/35 text-theme-gray"
            : "bg-theme-blue-darkshade text-white hover:bg-theme-blue-panel"
        }`}
      >
        Previous
      </button>
      {pages.map((n) => {
        const active = n === current;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => goTo(n)}
            aria-current={active ? "page" : undefined}
            className={`${btnBase} min-w-9 ${
              active
                ? "bg-admin-teal text-white"
                : "border border-theme-gray-border bg-white text-theme-black hover:bg-theme-gray-white"
            }`}
          >
            {n}
          </button>
        );
      })}
      <button
        type="button"
        disabled={atEnd}
        onClick={() => goTo(current + 1)}
        className={`${btnBase} ${
          atEnd
            ? "bg-theme-gray/35 text-theme-gray"
            : "bg-theme-blue-dark text-white hover:bg-theme-blue-panel"
        }`}
      >
        Next
      </button>
    </nav>
  );
}
