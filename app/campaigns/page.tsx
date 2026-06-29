import Link from "next/link";
import { Plus, Users2, CalendarRange } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton } from "@/components/ui/misc";
import { Badge } from "@/components/ui/Badge";
import { inr, dateShort } from "@/lib/format";
import { meta, CAMPAIGN_STAGES, CAMPAIGN_STAGE_ORDER } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      brand: true,
      _count: { select: { creators: true, deliverables: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byStage = (stage: string) => campaigns.filter((c) => c.stage === stage);

  return (
    <div>
      <PageHeader
        title="Campaign Pipeline"
        subtitle="Every campaign, from draft to payment closure — drag through the funnel."
        actions={
          <LinkButton href="/campaigns/new">
            <Plus className="h-4 w-4" /> New Campaign
          </LinkButton>
        }
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {CAMPAIGN_STAGE_ORDER.map((stage) => {
          const m = meta(CAMPAIGN_STAGES, stage);
          const items = byStage(stage);
          return (
            <div key={stage} className="flex w-72 shrink-0 flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Badge tone={m.tone} className="px-2">{m.label}</Badge>
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 rounded-xl bg-slate-100/60 p-2">
                {items.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-slate-400">Empty</p>
                ) : (
                  items.map((c) => (
                    <Link
                      key={c.id}
                      href={`/campaigns/${c.id}`}
                      className="focus-ring block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                          style={{ backgroundColor: c.brand.logoColor }}
                        >
                          {c.brand.companyName.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="truncate text-xs font-medium text-slate-500">{c.brand.companyName}</span>
                      </div>
                      <p className="text-sm font-semibold leading-snug text-slate-900">{c.name}</p>
                      <p className="mt-1 text-sm font-bold text-brand-700">{inr(c.budget, { compact: true })}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1"><Users2 className="h-3 w-3" /> {c._count.creators}</span>
                        <span className="inline-flex items-center gap-1"><CalendarRange className="h-3 w-3" /> {dateShort(c.endDate)}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Tip: open a campaign to advance it through the pipeline. Drag-and-drop lands in Phase 2.
      </p>
    </div>
  );
}
