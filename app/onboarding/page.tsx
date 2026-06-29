import {
  UserPlus,
  ShieldCheck,
  BadgeCheck,
  Database,
  ArrowRight,
  Users,
  FileCheck,
  MapPin,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, ProgressBar, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { compactNumber, percent } from "@/lib/format";
import { parseList } from "@/lib/serialize";
import { meta, CREATOR_STATUS } from "@/lib/enums";
import { OnboardingActions } from "@/components/onboarding/OnboardingActions";

export const dynamic = "force-dynamic";

const FUNNEL = [
  { icon: UserPlus, label: "New Creator", desc: "Application received", tone: "blue" as const },
  { icon: ShieldCheck, label: "Internal Verification", desc: "Docs & profile review", tone: "amber" as const },
  { icon: BadgeCheck, label: "Approved", desc: "Cleared by talent team", tone: "green" as const },
  { icon: Database, label: "Added to Database", desc: "Live in the Creator CRM", tone: "violet" as const },
];

const FUNNEL_ICON_TONE: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
};

export default async function OnboardingPage() {
  const queue = await prisma.creator.findMany({
    where: { status: { in: ["PENDING", "IN_VERIFICATION"] } },
    include: { socials: true, _count: { select: { documents: true } } },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const approvedThisMonth = await prisma.creator.count({
    where: { status: "APPROVED", createdAt: { gte: monthStart } },
  });

  const pendingCount = queue.filter((c) => c.status === "PENDING").length;
  const inVerificationCount = queue.filter((c) => c.status === "IN_VERIFICATION").length;

  return (
    <div>
      <PageHeader
        title="Creator Onboarding"
        subtitle="Move new applicants through verification and into the live creator database."
        actions={
          <LinkButton href="/creators/new">
            <UserPlus className="h-4 w-4" /> New Creator Application
          </LinkButton>
        }
      />

      {/* Funnel explainer */}
      <Card className="card-pad mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {FUNNEL.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${FUNNEL_ICON_TONE[step.tone]}`}>
                  <step.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                  <p className="truncate text-xs text-slate-500">{step.desc}</p>
                </div>
              </div>
              {i < FUNNEL.length - 1 && (
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending"
          value={pendingCount}
          sub="Awaiting first review"
          icon={<UserPlus className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="In Verification"
          value={inVerificationCount}
          sub="Docs & profile in review"
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Approved This Month"
          value={approvedThisMonth}
          sub="Added to the database"
          icon={<BadgeCheck className="h-5 w-5" />}
          tone="green"
          href="/creators?status=APPROVED"
        />
      </div>

      {/* Verification queue */}
      {queue.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="The verification queue is clear"
          description="No creators are awaiting onboarding right now. New applications will appear here automatically."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {queue.map((c) => {
            const s = meta(CREATOR_STATUS, c.status);
            const cats = parseList(c.categories);
            const stepPct = Math.round((c.onboardingStep / 4) * 100);
            return (
              <Card key={c.id} className="card-pad">
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} color={c.avatarColor} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900">{c.name}</p>
                      <Badge tone={s.tone} dot>{s.label}</Badge>
                    </div>
                    {c.city && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {c.city}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cats.length === 0 ? (
                        <span className="text-xs text-slate-400">No categories listed</span>
                      ) : (
                        cats.slice(0, 4).map((cat) => <Badge key={cat} tone="gray">{cat}</Badge>)
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 px-4 py-3 text-center">
                  <div>
                    <p className="text-xs text-slate-400">Followers</p>
                    <p className="text-sm font-semibold text-slate-800">{compactNumber(c.totalFollowers)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Engagement</p>
                    <p className="text-sm font-semibold text-slate-800">{percent(c.engagementRate)}</p>
                  </div>
                  <div>
                    <p className="inline-flex items-center justify-center gap-1 text-xs text-slate-400">
                      <FileCheck className="h-3 w-3" /> Docs
                    </p>
                    <p className="text-sm font-semibold text-slate-800">{c._count.documents}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Onboarding progress</span>
                    <span className="font-semibold text-slate-700">Step {c.onboardingStep} of 4</span>
                  </div>
                  <ProgressBar
                    value={stepPct}
                    tone={c.status === "IN_VERIFICATION" ? "amber" : "brand"}
                  />
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <OnboardingActions creatorId={c.id} status={c.status} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
