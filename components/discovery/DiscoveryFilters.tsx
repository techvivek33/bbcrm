"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { CREATOR_CATEGORIES, PLATFORMS } from "@/lib/enums";

const baseInput =
  "focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400";

/** Keys this filter panel owns in the URL. */
const KEYS = [
  "q",
  "category",
  "platform",
  "language",
  "city",
  "minFollowers",
  "maxFollowers",
  "minER",
  "maxPrice",
] as const;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-slate-600">{children}</label>;
}

/** A richer, URL-synced filter bar for the discovery engine. */
export function DiscoveryFilters() {
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

  const clearAll = useCallback(() => {
    router.replace(pathname);
  }, [pathname, router]);

  const get = (k: string) => params.get(k) ?? "";
  const activeCount = KEYS.filter((k) => params.get(k)).length;

  const platformOptions = Object.entries(PLATFORMS).map(([value, m]) => ({
    value,
    label: m.label,
  }));

  return (
    <div className="card card-pad mb-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {activeCount} active
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="focus-ring inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          key={`q-${get("q")}`}
          defaultValue={get("q")}
          onChange={(e) => setParam("q", e.target.value || null)}
          placeholder="Search creators by name…"
          className="focus-ring w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Category</Label>
          <select
            value={get("category")}
            onChange={(e) => setParam("category", e.target.value || null)}
            className={baseInput}
          >
            <option value="">Any category</option>
            {CREATOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Platform</Label>
          <select
            value={get("platform")}
            onChange={(e) => setParam("platform", e.target.value || null)}
            className={baseInput}
          >
            <option value="">Any platform</option>
            {platformOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Language</Label>
          <input
            key={`language-${get("language")}`}
            defaultValue={get("language")}
            onChange={(e) => setParam("language", e.target.value || null)}
            placeholder="e.g. Hindi"
            className={baseInput}
          />
        </div>

        <div>
          <Label>City</Label>
          <input
            key={`city-${get("city")}`}
            defaultValue={get("city")}
            onChange={(e) => setParam("city", e.target.value || null)}
            placeholder="e.g. Mumbai"
            className={baseInput}
          />
        </div>

        <div>
          <Label>Min Followers</Label>
          <input
            key={`minFollowers-${get("minFollowers")}`}
            type="number"
            min={0}
            defaultValue={get("minFollowers")}
            onChange={(e) => setParam("minFollowers", e.target.value || null)}
            placeholder="0"
            className={baseInput}
          />
        </div>

        <div>
          <Label>Max Followers</Label>
          <input
            key={`maxFollowers-${get("maxFollowers")}`}
            type="number"
            min={0}
            defaultValue={get("maxFollowers")}
            onChange={(e) => setParam("maxFollowers", e.target.value || null)}
            placeholder="No limit"
            className={baseInput}
          />
        </div>

        <div>
          <Label>Min Engagement %</Label>
          <input
            key={`minER-${get("minER")}`}
            type="number"
            min={0}
            step="0.1"
            defaultValue={get("minER")}
            onChange={(e) => setParam("minER", e.target.value || null)}
            placeholder="0"
            className={baseInput}
          />
        </div>

        <div>
          <Label>Max Base Price (₹)</Label>
          <input
            key={`maxPrice-${get("maxPrice")}`}
            type="number"
            min={0}
            defaultValue={get("maxPrice")}
            onChange={(e) => setParam("maxPrice", e.target.value || null)}
            placeholder="No limit"
            className={baseInput}
          />
        </div>
      </div>
    </div>
  );
}
