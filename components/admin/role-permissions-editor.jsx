"use client";

import { Loader2 } from "lucide-react";

/**
 * Each permission category is a full-width row; activities flow horizontally within the row.
 */
export default function RolePermissionsEditor({
  categories = [],
  selected = [],
  onToggle,
  disabled = false,
}) {
  if (!categories.length) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">No permission activities found.</p>
    );
  }

  return (
    <div className="space-y-5">
      {categories.map((category) => (
        <section
          key={category.id}
          className="w-full border-b border-white/10 pb-5 last:border-b-0 last:pb-0"
        >
          <h4 className="mb-3 text-sm font-semibold text-white">{category.name}</h4>
          <div className="space-y-2">
            {category.activities?.map((activity) => {
              const checked = selected.includes(activity.identifier);
              return (
                <label
                  key={activity.identifier}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 transition hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggle(activity.identifier)}
                    className="h-4 w-4 shrink-0 rounded border-white/20 bg-transparent"
                  />
                  <span className="text-sm font-normal leading-snug text-slate-300">
                    {activity.name}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function RolePermissionsEditorSkeleton() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Loading permissions…
    </div>
  );
}
