import Link from "next/link";
import { Eye, Play, Heart, Radio, Trophy, Repeat, Building2, BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { inr, compactNumber, percent } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Safe ratio: returns null when the denominator is zero/missing. */
function safeRatio(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return numerator / denominator;
}

export default async function AnalyticsPage() {
  const [campaigns, creators, brands, payments] = await Promise.all([
    prisma.campaign.findMany({
      include: { brand: { select: { id: true, companyName: true, logoColor: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creator.findMany({
      include: { campaignCreators: { select: { agreedAmount: true } } },
    }),
    prisma.brand.findMany({
      include: { campaigns: { select: { id: true } } },
    }),
    prisma.payment.findMany({
      where: { direction: "BRAND" },
      select: { brandId: true, status: true, paidAmount: true },
    }),
  ]);

  // ---- Aggregate totals across all campaigns -------------------------------
  const totals = campaigns.reduce(
    (acc, c) => {
      acc.reach += c.reach;
      acc.impressions += c.impressions;
      acc.views += c.views;
      acc.engagement += c.engagement;
      return acc;
    },
    { reach: 0, impressions: 0, views: 0, engagement: 0 },
  );

  // ---- Creator revenue + repeat count --------------------------------------
  type CreatorRow = {
    id: string;
    name: string;
    avatarColor: string;
    engagementRate: number;
    revenue: number;
    campaignCount: number;
  };
  const creatorRows: CreatorRow[] = creators.map((cr) => ({
    id: cr.id,
    name: cr.name,
    avatarColor: cr.avatarColor,
    engagementRate: cr.engagementRate,
    revenue: cr.campaignCreators.reduce((s, cc) => s + cc.agreedAmount, 0),
    campaignCount: cr.campaignCreators.length,
  }));
  const topCreators = [...creatorRows].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const repeatCreators = creatorRows.filter((cr) => cr.campaignCount > 1).length;

  // ---- Brand revenue (sum of PAID brand payments) --------------------------
  type BrandRow = {
    id: string;
    name: string;
    logoColor: string;
    revenue: number;
    campaignCount: number;
  };
  const brandRevenue = new Map<string, number>();
  for (const p of payments) {
    if (p.status === "PAID" && p.brandId) {
      brandRevenue.set(p.brandId, (brandRevenue.get(p.brandId) ?? 0) + p.paidAmount);
    }
  }
  const brandRows: BrandRow[] = brands
    .map((b) => ({
      id: b.id,
      name: b.companyName,
      logoColor: b.logoColor,
      revenue: brandRevenue.get(b.id) ?? 0,
      campaignCount: b.campaigns.length,
    }))
    .sort((a, b) => b.revenue - a.revenue);
  const maxBrandRevenue = brandRows.reduce((m, b) => Math.max(m, b.revenue), 0);
  const totalBrandRevenue = brandRows.reduce((s, b) => s + b.revenue, 0);

  return (
    <div>
      <PageHeader
        title="Reporting & Analytics"
        subtitle="Cross-portfolio performance — reach, efficiency, top talent, and revenue by brand."
      />

      {/* Aggregate reach / impressions / views / engagement */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Reach" value={compactNumber(totals.reach)} sub="Across all campaigns" icon={<Radio className="h-5 w-5" />} tone="violet" />
        <StatCard label="Total Impressions" value={compactNumber(totals.impressions)} sub="Served to audiences" icon={<Eye className="h-5 w-5" />} tone="blue" />
        <StatCard label="Total Views" value={compactNumber(totals.views)} sub="Video & content plays" icon={<Play className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Total Engagement" value={compactNumber(totals.engagement)} sub="Likes, comments, shares" icon={<Heart className="h-5 w-5" />} tone="pink" />
      </div>

      {/* Campaign reports */}
      <Card className="mb-6">
        <CardHeader title="Campaign Reports" subtitle="Per-campaign efficiency: CPM, CPV and CTR" />
        {campaigns.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<BarChart3 className="h-8 w-8" />}
              title="No campaigns yet"
              description="Performance metrics appear here once campaigns start running."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Brand</th>
                  <th className="px-5 py-3 text-right">Reach</th>
                  <th className="px-5 py-3 text-right">Impressions</th>
                  <th className="px-5 py-3 text-right">Views</th>
                  <th className="px-5 py-3 text-right">Engagement</th>
                  <th className="px-5 py-3 text-right">CPM</th>
                  <th className="px-5 py-3 text-right">CPV</th>
                  <th className="px-5 py-3 text-right">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const cpmBase = safeRatio(c.budget, c.impressions);
                  const cpm = cpmBase === null ? null : cpmBase * 1000;
                  const cpv = safeRatio(c.budget, c.views);
                  const ctrBase = safeRatio(c.engagement, c.impressions);
                  const ctr = ctrBase === null ? null : ctrBase * 100;
                  return (
                    <tr key={c.id} className="hover-row">
                      <td className="px-5 py-3">
                        <Link href={`/campaigns/${c.id}`} className="font-semibold text-slate-900 hover:text-brand-600">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        {c.brand ? (
                          <Link href={`/brands/${c.brand.id}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-brand-600">
                            <span
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
                              style={{ backgroundColor: c.brand.logoColor }}
                            >
                              {c.brand.companyName.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="truncate">{c.brand.companyName}</span>
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{compactNumber(c.reach)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{compactNumber(c.impressions)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{compactNumber(c.views)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{compactNumber(c.engagement)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-900">{cpm === null ? "—" : inr(Math.round(cpm))}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-900">{cpv === null ? "—" : inr(Math.round(cpv))}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-900">{ctr === null ? "—" : percent(ctr, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Creator reports — top performers */}
        <Card>
          <CardHeader
            title="Top Creators"
            subtitle="Ranked by revenue generated"
            action={
              <Badge tone="violet">
                <Repeat className="mr-0.5 h-3 w-3" />
                {repeatCreators} repeat
              </Badge>
            }
          />
          {topCreators.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<Trophy className="h-8 w-8" />} title="No creators yet" description="Revenue rankings appear once creators are assigned to campaigns." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topCreators.map((cr, i) => (
                <Link key={cr.id} href={`/creators/${cr.id}`} className="hover-row flex items-center gap-3 px-5 py-3">
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                    style={{ backgroundColor: cr.avatarColor }}
                  >
                    {cr.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{cr.name}</p>
                    <p className="text-xs text-slate-500">
                      {cr.campaignCount} campaign{cr.campaignCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{inr(cr.revenue, { compact: true })}</p>
                    <p className="text-xs text-slate-400">{percent(cr.engagementRate)} ER</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Brand reports — revenue by brand bar chart */}
        <Card>
          <CardHeader title="Revenue by Brand" subtitle={`${inr(totalBrandRevenue, { compact: true })} collected lifetime`} />
          {brandRows.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<Building2 className="h-8 w-8" />} title="No brands yet" description="Brand revenue appears once payments are collected." />
            </div>
          ) : (
            <div className="space-y-4 p-5">
              {brandRows.map((b) => {
                const width = maxBrandRevenue ? Math.max(2, Math.round((b.revenue / maxBrandRevenue) * 100)) : 0;
                return (
                  <div key={b.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <Link href={`/brands/${b.id}`} className="inline-flex min-w-0 items-center gap-2 font-medium text-slate-700 hover:text-brand-600">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
                          style={{ backgroundColor: b.logoColor }}
                        >
                          {b.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="truncate">{b.name}</span>
                        <span className="shrink-0 text-xs text-slate-400">· {b.campaignCount} camp.</span>
                      </Link>
                      <span className="shrink-0 font-semibold text-slate-900">{inr(b.revenue, { compact: true })}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${width}%`, backgroundColor: b.logoColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
