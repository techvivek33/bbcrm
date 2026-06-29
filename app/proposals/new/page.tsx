import { ArrowLeft, Users, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createProposal } from "@/lib/crud-actions";
import { PageHeader, LinkButton, EmptyState } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TextField, TextareaField, SelectField, SubmitButton } from "@/components/ui/form";
import { inr, compactNumber, percent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const [brands, creators] = await Promise.all([
    prisma.brand.findMany({
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
    prisma.creator.findMany({
      where: { status: "APPROVED" },
      orderBy: { totalFollowers: "desc" },
      select: {
        id: true,
        name: true,
        avatarColor: true,
        totalFollowers: true,
        engagementRate: true,
        basePrice: true,
        city: true,
      },
    }),
  ]);

  const brandOptions = brands.map(function (b) {
    return { value: b.id, label: b.companyName };
  });

  return (
    <div>
      <PageHeader
        title="Build a Proposal"
        subtitle="Shortlist approved creators and assemble a client-ready pitch in minutes."
        actions={
          <LinkButton href="/proposals" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to Proposals
          </LinkButton>
        }
      />

      <form action={createProposal}>
        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader title="Proposal Overview" subtitle="The brief and budget you're pitching" />
            <div className="card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Proposal Title"
                name="title"
                required
                placeholder="Summer 2026 — Lifestyle Creator Line-up"
                className="sm:col-span-2"
              />
              <SelectField
                label="Brand"
                name="brandId"
                options={brandOptions}
                hint={brands.length ? "Who is this proposal for?" : "No brands yet — you can still save a draft"}
              />
              <TextField
                label="Budget"
                name="budget"
                type="number"
                placeholder="500000"
                hint="Total budget in INR"
              />
              <TextField
                label="Target Audience"
                name="audience"
                placeholder="Gen-Z, metro cities, 18–28"
                className="sm:col-span-2"
              />
              <TextareaField
                label="Brief"
                name="brief"
                rows={4}
                placeholder="Campaign goals, tone, deliverables, must-haves and do's & don'ts…"
                className="sm:col-span-2"
              />
            </div>
          </Card>

          {/* Creator picker */}
          <Card>
            <CardHeader
              title="Shortlist Creators"
              subtitle="Pick approved creators to include — each becomes a line item with an AI fit score"
            />
            <div className="card-pad">
              {creators.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No approved creators"
                  description="Only APPROVED creators can be added to a proposal. Approve creators in onboarding first."
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {creators.map((c) => (
                    <label
                      key={c.id}
                      className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/30 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/60 has-[:checked]:ring-1 has-[:checked]:ring-brand-500"
                    >
                      <input
                        type="checkbox"
                        name="creatorIds"
                        value={c.id}
                        className="absolute right-3 top-3 h-4 w-4 accent-brand-600"
                      />
                      <div className="flex items-center gap-3 pr-6">
                        <Avatar name={c.name} color={c.avatarColor} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="truncate text-xs text-slate-500">{c.city ?? "—"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Reach</p>
                          <p className="text-sm font-bold text-slate-800">{compactNumber(c.totalFollowers)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">ER</p>
                          <p className="text-sm font-bold text-slate-800">{percent(c.engagementRate)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Rate</p>
                          <p className="text-sm font-bold text-slate-800">{inr(c.basePrice ?? 0, { compact: true })}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="h-3.5 w-3.5" /> Fit scores and proposed amounts are auto-filled from each creator's profile.
            </p>
            <div className="flex items-center gap-3">
              <LinkButton href="/proposals" variant="secondary">
                Cancel
              </LinkButton>
              <SubmitButton>
                <Sparkles className="h-4 w-4" /> Build Proposal
              </SubmitButton>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
