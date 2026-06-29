"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** URL-synced search box + optional status filter chips for list pages. */
export function Toolbar({
  placeholder = "Search…",
  filters,
}: {
  placeholder?: string;
  filters?: { key: string; label: string; values: { value: string; label: string }[] };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (!value) next.delete(key);
      else next.set(key, value);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const activeFilter = filters ? params.get(filters.key) : null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value || null)}
          placeholder={placeholder}
          className="focus-ring w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>
      {filters && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active={!activeFilter} onClick={() => setParam(filters.key, null)}>
            All
          </Chip>
          {filters.values.map((v) => (
            <Chip
              key={v.value}
              active={activeFilter === v.value}
              onClick={() => setParam(filters.key, v.value)}
            >
              {v.label}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "focus-ring rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}
