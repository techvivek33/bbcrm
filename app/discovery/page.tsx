import Link from "next/link";
import { Sparkles, Users, Eye, Heart, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LinkRow } from "@/components/ui/LinkRow";
import { DiscoveryFilters } from "@/components/discovery/DiscoveryFilters";
import { inr, compactNumber, percent } from "@/lib/format";
import { parseList } from "@/lib/serialize";
import { meta, PLATFORMS, type BadgeTone } from "@/lib/enums";

export const dynamic = "force-dynamic";

type SearchParams = {
  category?: string;
  platform?: string;
  minFollowers?: string;
  maxFollowers?: string;
  minER?: string;
  language?: string;
  city?: string;
  maxPrice?: string;
  q?: string;
};

/** Parse a string query param to a finite number, else null. */
function num(v: string | undefined): number | null {
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Badge tone for a 0-99 AI Fit Score. */
function fitTone(score: number): BadgeTone {
  if (score >= 80) return "green";
  if (score >= 65) return "blue";
  if (score >= 50) return "amber";
  return "gray";
}

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const q = sp.q?.trim().toLowerCase() ?? "";
  const category = sp.category?.trim() ?? "";
  const platform = sp.platform?.trim() ?? "";
  const language = sp.language?.trim().toLowerCase() ?? "";
  const city = sp.city?.trim().toLowerCase() ?? "";
  const minFollowers = num(sp.minFollowers);
  const maxFollowers = num(sp.maxFollowers);
  const minER = num(sp.minER);
  const maxPrice = num(sp.maxPrice);

  // Only approved creators are discoverable.
  const creators = await prisma.creator.findMany({
    where: { status: "APPROVED" },
    include: { socials: true },
    orderBy: { totalFollowers: "desc" },
  });

  // In-memory filtering so JSON list fields can be matched flexibly.
  const filtered = creators.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q)) return false;

    if (category) {
      const cats = parseList(c.categories).map((x) => x.toLowerCase());
      if (!cats.includes(category.toLowerCase())) return false;
    }

    if (language) {
      const langs = parseList(c.languages).map((x) => x.toLowerCase());
      if (!langs.some((l) => l.includes(language))) return false;
    }

    if (city && !(c.city ?? "").toLowerCase().includes(city)) return false;

    if (platform && !c.socials.some((s) => s.platform === platform)) return false;

    if (minFollowers !== null && c.totalFollowers < minFollowers) return false;
    if (maxFollowers !== null && c.totalFollowers > maxFollowers) return false;
    if (minER !== null && c.engagementRate < minER) return false;
    if (maxPrice !== null && (c.basePrice ?? 0) > maxPrice) return false;

    return true;
  });

  // AI Fit Score: weight engagement heavily, add a reach bonus and a category match boost.
  const scored = filtered
    .map((c) => {
      const erComponent = c.engagementRate * 3;
      const reachBonus = Math.min(25, c.totalFollowers / 250_000);
      const cats = parseList(c.categories).map((x) => x.toLowerCase());
      const categoryBoost = category && cats.includes(category.toLowerCase()) ? 15 : 0;
      const raw = erComponent + reachBonus + categoryBoost;
      const fit = Math.max(0, Math.min(99, Math.round(raw)));
      return { creator: c, fit };
    })
    .sort((a, b) => b.fit - a.fit);

  const totalReach = filtered.reduce((sum: number, c) => sum + c.totalFollowers, 0);
  const avgER =
    filtered.length > 0
      ? filtered.reduce((sum: number, c) => sum + c.engagementRate, 0) / filtered.length
      : 0;
  const topFit = scored.length > 0 ? scored[0].fit : 0;

  return (
    <div>
      <PageHeader
        title="Influencer Discovery"
        subtitle="Search the approved talent pool and let the AI Fit Score surface your best matches."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Matches"
          value={scored.length}
          sub={`of ${creators.length} approved`}
          icon={<Users className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="Combined Reach"
          value={compactNumber(totalReach)}
          sub="Across matches"
          icon={<Eye className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label="Avg Engagement"
          value={percent(avgER)}
          sub="Of matched creators"
          icon={<Heart className="h-5 w-5" />}
          tone="pink"
        />
        <StatCard
          label="Top Fit Score"
          value={topFit}
          sub="Best match"
          icon={<Sparkles className="h-5 w-5" />}
          tone="green"
        />
      </div>

      <DiscoveryFilters />

      {/* AI Fit Score explainer */}
      <div className="card card-pad mb-6 flex items-start gap-3 border-brand-100 bg-brand-50/40">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">How the AI Fit Score works</p>
          <p className="mt-1 text-sm text-slate-600">
            Each creator is scored 0–99 to rank fit for your brief. It weights{" "}
            <span className="font-medium text-slate-700">engagement rate</span> most heavily, adds a{" "}
            <span className="font-medium text-slate-700">reach bonus</span> for larger audiences (capped
            so mega-accounts don&apos;t dominate), and grants a{" "}
            <span className="font-medium text-slate-700">category match boost</span> when a creator&apos;s
            niche matches your selected category. Higher is better.
          </p>
        </div>
      </div>

      {scored.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No creators match your filters"
          description="Loosen a filter, widen the follower range, or clear everything to browse the full approved pool."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Creator</th>
                <th className="hidden px-5 py-3 md:table-cell">Platforms</th>
                <th className="px-5 py-3 text-right">Followers</th>
                <th className="hidden px-5 py-3 text-right sm:table-cell">Avg Views</th>
                <th className="hidden px-5 py-3 text-right sm:table-cell">ER</th>
                <th className="hidden px-5 py-3 text-right lg:table-cell">Base Price</th>
                <th className="px-5 py-3 text-right">Fit Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scored.map(({ creator: c, fit }) => (
                <LinkRow key={c.id} href={`/creators/${c.id}`}>
                  <td className="px-5 py-3">
                    <Link href={`/creators/${c.id}`} className="flex items-center gap-3">
                      <Avatar name={c.name} color={c.avatarColor} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.city ?? "—"}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3 md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.socials.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        c.socials.slice(0, 3).map((s) => {
                          const p = meta(PLATFORMS, s.platform);
                          return (
                            <Badge key={s.id} tone={p.tone}>
                              {p.label}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">
                    {compactNumber(c.totalFollowers)}
                  </td>
                  <td className="hidden px-5 py-3 text-right text-slate-600 sm:table-cell">
                    {compactNumber(c.avgViews)}
                  </td>
                  <td className="hidden px-5 py-3 text-right text-slate-600 sm:table-cell">
                    {percent(c.engagementRate)}
                  </td>
                  <td className="hidden px-5 py-3 text-right font-semibold text-slate-700 lg:table-cell">
                    {c.basePrice ? inr(c.basePrice, { compact: true }) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Badge tone={fitTone(fit)}>
                      <Sparkles className="mr-0.5 h-3 w-3" />
                      {fit}
                    </Badge>
                  </td>
                </LinkRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
