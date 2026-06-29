import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Star, FileCheck2, FileWarning, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, ProgressBar } from "@/components/ui/misc";
import { Timeline } from "@/components/detail/Timeline";
import { NoteList } from "@/components/detail/NoteList";
import { AddNoteForm, LogActivityForm } from "@/components/detail/Composers";
import { inr, compactNumber, percent, dateShort } from "@/lib/format";
import { parseList, parseRecord } from "@/lib/serialize";
import { meta, CREATOR_STATUS, PLATFORMS, CAMPAIGN_STAGES } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function CreatorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.creator.findUnique({
    where: { id },
    include: {
      socials: { orderBy: { followers: "desc" } },
      documents: true,
      activities: { orderBy: { occurredAt: "desc" }, include: { user: true } },
      noteItems: { include: { author: true } },
      campaignCreators: { include: { campaign: { include: { brand: true } } } },
      deliverables: true,
      payments: true,
    },
  });
  if (!c) notFound();

  const s = meta(CREATOR_STATUS, c.status);
  const cats = parseList(c.categories);
  const langs = parseList(c.languages);
  const prices = parseRecord<Record<string, number>>(c.priceList) ?? {};

  // Performance history
  const campaignsDone = c.campaignCreators.filter((cc) => cc.status === "COMPLETED").length;
  const totalCampaigns = c.campaignCreators.length;
  const deliverablesDone = c.deliverables.filter((d) => ["POSTED", "APPROVED"].includes(d.status)).length;
  const completionRate = c.deliverables.length ? Math.round((deliverablesDone / c.deliverables.length) * 100) : 0;
  const revenueGen = c.campaignCreators.reduce((x, cc) => x + cc.agreedAmount, 0);
  const paidOut = c.payments.filter((p) => p.status === "PAID").reduce((x, p) => x + p.paidAmount, 0);

  const target = { creatorId: c.id, revalidate: `/creators/${c.id}` };

  return (
    <div>
      <Link href="/creators" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Creators
      </Link>

      {/* Header */}
      <div className="card card-pad mb-6 flex flex-wrap items-start gap-4">
        <Avatar name={c.name} color={c.avatarColor} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{c.name}</h1>
            <Badge tone={s.tone} dot>{s.label}</Badge>
            {c.internalRating ? (
              <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-amber-500">
                <Star className="h-4 w-4 fill-amber-400" /> {c.internalRating.toFixed(1)}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {c.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {c.location}</span>}
            {c.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" /> {c.email}</span>}
            {c.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {c.phone}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {cats.map((cat) => <Badge key={cat} tone="violet">{cat}</Badge>)}
            {langs.map((l) => <Badge key={l} tone="gray">{l}</Badge>)}
          </div>
        </div>
      </div>

      {/* Audience snapshot */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Followers", value: compactNumber(c.totalFollowers) },
          { label: "Avg Views", value: compactNumber(c.avgViews) },
          { label: "Engagement Rate", value: percent(c.engagementRate) },
          { label: "Base Price", value: c.basePrice ? inr(c.basePrice, { compact: true }) : "—" },
        ].map((m) => (
          <div key={m.label} className="card card-pad">
            <p className="text-xs font-medium text-slate-500">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Social profiles */}
          <Card>
            <CardHeader title="Social Profiles" subtitle={`${c.socials.length} platforms`} />
            <div className="divide-y divide-slate-100">
              {c.socials.map((sp) => {
                const pm = meta(PLATFORMS, sp.platform);
                return (
                  <div key={sp.id} className="flex items-center gap-3 px-5 py-3">
                    <Badge tone={pm.tone}>{pm.label}</Badge>
                    <a href={sp.url ?? "#"} target="_blank" className="flex min-w-0 flex-1 items-center gap-1 text-sm font-medium text-slate-800 hover:text-brand-600">
                      {sp.handle} <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </a>
                    <div className="hidden gap-6 text-right sm:flex">
                      <div><p className="text-xs text-slate-400">Followers</p><p className="text-sm font-semibold">{compactNumber(sp.followers)}</p></div>
                      <div><p className="text-xs text-slate-400">Avg Views</p><p className="text-sm font-semibold">{compactNumber(sp.avgViews)}</p></div>
                      <div><p className="text-xs text-slate-400">ER</p><p className="text-sm font-semibold">{percent(sp.engagementRate)}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Campaign history */}
          <Card>
            <CardHeader title="Campaign History" subtitle={`${totalCampaigns} engagements`} />
            {c.campaignCreators.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No campaigns yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {c.campaignCreators.map((cc) => {
                  const cs = meta(CAMPAIGN_STAGES, cc.campaign.stage);
                  return (
                    <Link key={cc.id} href={`/campaigns/${cc.campaign.id}`} className="hover-row flex items-center gap-3 px-5 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: cc.campaign.brand.logoColor }}>
                        {cc.campaign.brand.companyName.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{cc.campaign.name}</p>
                        <p className="text-xs text-slate-500">{cc.campaign.brand.companyName}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{inr(cc.agreedAmount, { compact: true })}</span>
                      <Badge tone={cs.tone}>{cs.label}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Communication history */}
          <Card>
            <CardHeader title="Communication History" subtitle="Calls, emails, WhatsApp, meetings" />
            <LogActivityForm {...target} />
            <Timeline items={c.activities} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance */}
          <Card>
            <CardHeader title="Performance" />
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Campaigns Done">{campaignsDone}/{totalCampaigns}</Field>
                <Field label="Deliverables">{deliverablesDone}/{c.deliverables.length}</Field>
                <Field label="Revenue Generated">{inr(revenueGen, { compact: true })}</Field>
                <Field label="Paid Out">{inr(paidOut, { compact: true })}</Field>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs"><span className="text-slate-500">Completion rate</span><span className="font-semibold">{completionRate}%</span></div>
                <ProgressBar value={completionRate} tone="green" />
              </div>
            </div>
          </Card>

          {/* Commercials */}
          <Card>
            <CardHeader title="Commercials" subtitle="Per-deliverable pricing" />
            <ul className="divide-y divide-slate-100">
              {Object.entries(prices).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span className="capitalize text-slate-600">{k}</span>
                  <span className="font-semibold text-slate-900">{inr(v)}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Compliance + documents vault */}
          <Card>
            <CardHeader title="Documents Vault" subtitle="KYC, contracts & payouts" />
            <dl className="grid grid-cols-2 gap-3 border-b border-slate-100 px-5 py-4">
              <Field label="PAN">{c.panNumber}</Field>
              <Field label="GST Status">{c.gstStatus}</Field>
              <Field label="Bank">{c.bankName}</Field>
              <Field label="Account">{c.bankAccount}</Field>
            </dl>
            {c.documents.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No documents uploaded.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {c.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 px-5 py-2.5 text-sm">
                    {d.verified ? <FileCheck2 className="h-4 w-4 text-emerald-500" /> : <FileWarning className="h-4 w-4 text-amber-500" />}
                    <span className="flex-1 text-slate-700">{d.name}</span>
                    <Badge tone={d.verified ? "green" : "amber"}>{d.verified ? "Verified" : "Pending"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader title="Internal Notes" subtitle="Team-only" />
            <NoteList notes={c.noteItems} />
            <AddNoteForm {...target} />
          </Card>
        </div>
      </div>
    </div>
  );
}
