import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Mail, Phone, Linkedin, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field } from "@/components/ui/misc";
import { Timeline } from "@/components/detail/Timeline";
import { NoteList } from "@/components/detail/NoteList";
import { AddNoteForm, LogActivityForm } from "@/components/detail/Composers";
import { inr, dateShort } from "@/lib/format";
import { parseList } from "@/lib/serialize";
import { meta, BRAND_STATUS, CAMPAIGN_STAGES, PAYMENT_STATUS, CONTRACT_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function BrandDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      campaigns: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { occurredAt: "desc" }, include: { user: true } },
      noteItems: { include: { author: true } },
      payments: { orderBy: { dueDate: "asc" } },
      contracts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!brand) notFound();

  const s = meta(BRAND_STATUS, brand.status);
  const cats = parseList(brand.preferredCategories);
  const portfolio = brand.campaigns.reduce((sum, c) => sum + c.budget, 0);
  const collected = brand.payments.filter((p) => p.status === "PAID").reduce((x, p) => x + p.paidAmount, 0);
  const target = { brandId: brand.id, revalidate: `/brands/${brand.id}` };

  return (
    <div>
      <Link href="/brands" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Brands
      </Link>

      {/* Header */}
      <div className="card card-pad mb-6 flex flex-wrap items-start gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
          style={{ backgroundColor: brand.logoColor }}
        >
          {brand.companyName.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{brand.companyName}</h1>
            <Badge tone={s.tone} dot>{s.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{brand.industry}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {brand.website && (
              <a href={`https://${brand.website}`} target="_blank" className="inline-flex items-center gap-1.5 hover:text-brand-600">
                <Globe className="h-4 w-4" /> {brand.website}
              </a>
            )}
            {brand.email && (
              <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" /> {brand.email}</span>
            )}
            {brand.phone && (
              <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {brand.phone}</span>
            )}
            {brand.linkedin && (
              <span className="inline-flex items-center gap-1.5"><Linkedin className="h-4 w-4" /> LinkedIn</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl bg-slate-50 px-5 py-3 text-right">
          <div>
            <p className="text-xs text-slate-400">Portfolio</p>
            <p className="text-lg font-bold text-slate-900">{inr(portfolio, { compact: true })}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Collected</p>
            <p className="text-lg font-bold text-emerald-600">{inr(collected, { compact: true })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Campaigns */}
          <Card>
            <CardHeader title="Campaigns" subtitle={`${brand.campaigns.length} total`} />
            {brand.campaigns.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No campaigns yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {brand.campaigns.map((c) => {
                  const cs = meta(CAMPAIGN_STAGES, c.stage);
                  return (
                    <Link key={c.id} href={`/campaigns/${c.id}`} className="hover-row flex items-center gap-3 px-5 py-3">
                      <Megaphone className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{dateShort(c.startDate)} → {dateShort(c.endDate)}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{inr(c.budget, { compact: true })}</span>
                      <Badge tone={cs.tone}>{cs.label}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader title="Brand Timeline" subtitle="Every interaction, logged" />
            <LogActivityForm {...target} />
            <Timeline items={brand.activities} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Account Details" />
            <dl className="grid grid-cols-2 gap-4 p-5">
              <Field label="Contact">{brand.contactPerson}</Field>
              <Field label="Designation">{brand.designation}</Field>
              <Field label="Payment Terms">{brand.paymentTerms}</Field>
              <Field label="Budget Range">
                {brand.budgetRangeMin ? `${inr(brand.budgetRangeMin, { compact: true })} – ${inr(brand.budgetRangeMax, { compact: true })}` : "—"}
              </Field>
              <div className="col-span-2">
                <Field label="Preferred Categories">
                  <div className="flex flex-wrap gap-1">
                    {cats.map((c) => <Badge key={c} tone="gray">{c}</Badge>)}
                  </div>
                </Field>
              </div>
            </dl>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader title="Payments" subtitle={`${brand.payments.length} records`} />
            {brand.payments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No payments tracked.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {brand.payments.map((p) => {
                  const ps = meta(PAYMENT_STATUS, p.status);
                  return (
                    <li key={p.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{inr(p.agreedAmount)}</p>
                        <p className="text-xs text-slate-500">Due {dateShort(p.dueDate)}</p>
                      </div>
                      <Badge tone={ps.tone}>{ps.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Contracts */}
          <Card>
            <CardHeader title="Contracts" subtitle={`${brand.contracts.length} documents`} />
            {brand.contracts.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No contracts on file.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {brand.contracts.map((c) => {
                  const cs = meta(CONTRACT_STATUS, c.status);
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-2 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{c.title}</p>
                        <p className="text-xs text-slate-500">{c.type}{c.expiryDate ? ` · expires ${dateShort(c.expiryDate)}` : ""}</p>
                      </div>
                      <Badge tone={cs.tone}>{cs.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader title="Internal Notes" subtitle="Team-only" />
            <NoteList notes={brand.noteItems} />
            <AddNoteForm {...target} />
          </Card>
        </div>
      </div>
    </div>
  );
}
