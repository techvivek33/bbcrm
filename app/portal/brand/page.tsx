import {
  Megaphone,
  Eye,
  Sparkles,
  Radio,
  ReceiptText,
  TrendingUp,
  Users,
  Building2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar, EmptyState } from "@/components/ui/misc";
import { inr, compactNumber, dateShort } from "@/lib/format";
import { meta, CAMPAIGN_STAGES, CAMPAIGN_STAGE_ORDER, INVOICE_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function BrandPortalPage() {
  const user = await getCurrentUser();

  // Resolve which brand this portal is showing.
  // BRAND_POC sees their own brand; an internal user (e.g. ADMIN preview)
  // gets the first ACTIVE brand so the white-labelled view is never empty.
  let brandId = user?.role === "BRAND_POC" ? user?.brandId ?? null : null;
  if (!brandId) {
    const active = await prisma.brand.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    brandId = active?.id ?? null;
  }

  const brand = brandId
    ? await prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          campaigns: {
            orderBy: { createdAt: "desc" },
            include: {
              deliverables: {
                orderBy: { dueDate: "asc" },
                include: { creator: { select: { name: true, avatarColor: true } } },
              },
            },
          },
          invoices: { orderBy: { issuedDate: "desc" } },
          payments: { orderBy: { dueDate: "asc" } },
          contracts: { orderBy: { createdAt: "desc" } },
        },
      })
    : null;

  if (!brand) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="No brand workspace yet"
        description="Once your account is linked to an active brand, your campaigns, content and reports will appear here in real time."
      />
    );
  }

  // ---- Derived metrics -------------------------------------------------------
  const totalStages = CAMPAIGN_STAGE_ORDER.length;

  const activeCampaigns = brand.campaigns.filter(
    (c) => c.stage !== "COMPLETED" && c.stage !== "DRAFT",
  ).length;

  const awaitingApproval = brand.campaigns.flatMap((c) =>
    c.deliverables
      .filter((d) => d.status === "BRAND_REVIEW")
      .map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type,
        creator: d.creator?.name ?? "—",
        creatorColor: d.creator?.avatarColor ?? "#64748b",
        campaign: c.name,
      })),
  );

  const liveDeliverables = brand.campaigns
    .flatMap((c) => c.deliverables)
    .filter((d) => d.status === "POSTED").length;

  const openInvoices = brand.invoices.filter(
    (i) => i.status === "SENT" || i.status === "OVERDUE",
  );
  const outstanding = openInvoices.reduce((sum: number, i) => sum + i.total, 0);

  // Performance totals across the brand's campaigns.
  const perf = brand.campaigns.reduce(
    (acc: { reach: number; impressions: number; views: number; engagement: number }, c) => {
      acc.reach += c.reach;
      acc.impressions += c.impressions;
      acc.views += c.views;
      acc.engagement += c.engagement;
      return acc;
    },
    { reach: 0, impressions: 0, views: 0, engagement: 0 },
  );

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="card card-pad flex flex-wrap items-center gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
          style={{ backgroundColor: brand.logoColor }}
        >
          {brand.companyName.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {brand.companyName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your campaigns, content and reports — live.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live workspace
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Campaigns"
          value={activeCampaigns}
          sub={`${brand.campaigns.length} total`}
          icon={<Megaphone className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="Awaiting Your Approval"
          value={awaitingApproval.length}
          sub="Content to review"
          icon={<Eye className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Live Deliverables"
          value={liveDeliverables}
          sub="Posted & published"
          icon={<Radio className="h-5 w-5" />}
          tone="green"
        />
        <StatCard
          label="Outstanding Invoices"
          value={openInvoices.length}
          sub={inr(outstanding, { compact: true })}
          icon={<ReceiptText className="h-5 w-5" />}
          tone="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* (1) Campaign Progress */}
          <Card>
            <CardHeader
              title="Campaign Progress"
              subtitle={`${brand.campaigns.length} campaign${brand.campaigns.length === 1 ? "" : "s"}`}
            />
            {brand.campaigns.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Megaphone className="h-7 w-7" />}
                  title="No campaigns yet"
                  description="When a campaign launches with your brand, you'll track its progress here."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {brand.campaigns.map((c) => {
                  const cs = meta(CAMPAIGN_STAGES, c.stage);
                  const idx = CAMPAIGN_STAGE_ORDER.indexOf(
                    c.stage as (typeof CAMPAIGN_STAGE_ORDER)[number],
                  );
                  const pct =
                    idx >= 0 ? Math.round(((idx + 1) / totalStages) * 100) : 0;
                  const tone =
                    c.stage === "COMPLETED"
                      ? "green"
                      : c.stage === "POSTING" || c.stage === "REPORTING"
                        ? "amber"
                        : "brand";
                  return (
                    <div key={c.id} className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Megaphone className="h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {dateShort(c.startDate)} → {dateShort(c.endDate)}
                          </p>
                        </div>
                        <Badge tone={cs.tone}>{cs.label}</Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={pct} tone={tone} className="flex-1" />
                        <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-500">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* (2) Content Awaiting Your Approval */}
          <Card>
            <CardHeader
              title="Content Awaiting Your Approval"
              subtitle={`${awaitingApproval.length} item${awaitingApproval.length === 1 ? "" : "s"} in brand review`}
            />
            {awaitingApproval.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Sparkles className="h-7 w-7" />}
                  title="You're all caught up"
                  description="No content is currently waiting on your review."
                />
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {awaitingApproval.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                        style={{ backgroundColor: d.creatorColor }}
                      >
                        {d.creator.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {d.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {d.creator} · {d.campaign}
                        </p>
                      </div>
                      <Badge tone="gray">{d.type}</Badge>
                      <Badge tone="cyan">Brand Review</Badge>
                    </div>
                  ))}
                </div>
                <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                  Approvals are processed with your dedicated account manager — they will action
                  your decision the moment you confirm.
                </p>
              </>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* (3) Performance Reports */}
          <Card>
            <CardHeader title="Performance Reports" subtitle="Across all your campaigns" />
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl bg-slate-100">
              <PerfStat
                icon={<Users className="h-4 w-4" />}
                label="Total Reach"
                value={compactNumber(perf.reach)}
              />
              <PerfStat
                icon={<Eye className="h-4 w-4" />}
                label="Impressions"
                value={compactNumber(perf.impressions)}
              />
              <PerfStat
                icon={<TrendingUp className="h-4 w-4" />}
                label="Views"
                value={compactNumber(perf.views)}
              />
              <PerfStat
                icon={<Sparkles className="h-4 w-4" />}
                label="Engagement"
                value={compactNumber(perf.engagement)}
              />
            </dl>
          </Card>

          {/* (4) Invoices */}
          <Card>
            <CardHeader title="Invoices" subtitle={`${brand.invoices.length} on file`} />
            {brand.invoices.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<ReceiptText className="h-7 w-7" />}
                  title="No invoices yet"
                  description="Invoices raised for your campaigns will be listed here."
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {brand.invoices.map((i) => {
                  const is = meta(INVOICE_STATUS, i.status);
                  return (
                    <li
                      key={i.id}
                      className="flex items-center justify-between gap-2 px-5 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {i.number}
                        </p>
                        <p className="text-xs text-slate-500">
                          Due {dateShort(i.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-sm font-semibold text-slate-800">
                          {inr(i.total)}
                        </span>
                        <Badge tone={is.tone}>{is.label}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function PerfStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-xl font-bold tracking-tight text-slate-900">{value}</dd>
    </div>
  );
}
