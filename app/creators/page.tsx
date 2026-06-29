import Link from "next/link";
import { Plus, Users, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Toolbar } from "@/components/ui/Toolbar";
import { inr, compactNumber, percent } from "@/lib/format";
import { meta, CREATOR_STATUS } from "@/lib/enums";
import { parseList } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const creators = await prisma.creator.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { city: { contains: q } }, { categories: { contains: q } }] } : {}),
    },
    include: { socials: true, _count: { select: { campaignCreators: true } } },
    orderBy: { totalFollowers: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Creator CRM"
        subtitle="Your influencer database — profiles, reach, performance & commercials."
        actions={
          <LinkButton href="/creators/new">
            <Plus className="h-4 w-4" /> Add Creator
          </LinkButton>
        }
      />

      <Toolbar
        placeholder="Search creators, cities, categories…"
        filters={{
          key: "status",
          label: "Status",
          values: Object.entries(CREATOR_STATUS).map(([value, m]) => ({ value, label: m.label })),
        }}
      />

      {creators.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No creators found" description="Adjust your filters or onboard a new creator." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Creator</th>
                <th className="hidden px-5 py-3 md:table-cell">Categories</th>
                <th className="px-5 py-3 text-right">Followers</th>
                <th className="hidden px-5 py-3 text-right sm:table-cell">Avg Views</th>
                <th className="hidden px-5 py-3 text-right sm:table-cell">ER</th>
                <th className="hidden px-5 py-3 text-right lg:table-cell">Base Price</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {creators.map((c) => {
                const s = meta(CREATOR_STATUS, c.status);
                const cats = parseList(c.categories);
                return (
                  <tr key={c.id} className="hover-row">
                    <td className="px-5 py-3">
                      <Link href={`/creators/${c.id}`} className="flex items-center gap-3">
                        <Avatar name={c.name} color={c.avatarColor} size="md" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                            {c.name}
                            {c.internalRating ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-500">
                                <Star className="h-3 w-3 fill-amber-400" /> {c.internalRating.toFixed(1)}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-slate-500">{c.city ?? "—"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {cats.slice(0, 2).map((cat) => <Badge key={cat} tone="gray">{cat}</Badge>)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{compactNumber(c.totalFollowers)}</td>
                    <td className="hidden px-5 py-3 text-right text-slate-600 sm:table-cell">{compactNumber(c.avgViews)}</td>
                    <td className="hidden px-5 py-3 text-right text-slate-600 sm:table-cell">{percent(c.engagementRate)}</td>
                    <td className="hidden px-5 py-3 text-right font-semibold text-slate-700 lg:table-cell">{c.basePrice ? inr(c.basePrice, { compact: true }) : "—"}</td>
                    <td className="px-5 py-3"><Badge tone={s.tone} dot>{s.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
