import { redirect } from "next/navigation";
import {
  Megaphone,
  CalendarClock,
  Wallet,
  ClipboardCheck,
  FileText,
  Inbox,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar, EmptyState } from "@/components/ui/misc";
import { inr, dateShort, isOverdue } from "@/lib/format";
import {
  meta,
  DELIVERABLE_STATUS,
  PAYMENT_STATUS,
  CONTRACT_STATUS,
  type BadgeTone,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

const DONE_STATES = ["POSTED", "APPROVED"];
const REVIEW_STATES = ["INTERNAL_REVIEW", "BRAND_REVIEW"];
const ACTIVE_ASSIGN = ["ACTIVE", "APPROVED"];

export default async function CreatorPortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Determine which creator we're viewing. Creators see themselves; an admin
  // previewing the portal lands on the first approved creator.
  let creatorId = user.role === "CREATOR" ? user.creatorId : null;
  if (!creatorId) {
    const preview = await prisma.creator.findFirst({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    creatorId = preview?.id ?? null;
  }

  const creator = creatorId
    ? await prisma.creator.findUnique({
        where: { id: creatorId },
        include: {
          campaignCreators: {
            include: { campaign: { include: { brand: true } } },
          },
          deliverables: {
            include: { campaign: { select: { id: true, name: true } } },
          },
          payments: { orderBy: { dueDate: "asc" } },
          contracts: { orderBy: { createdAt: "desc" } },
        },
      })
    : null;

  if (!creator) {
    return (
      <EmptyState
        icon={<Inbox className="h-8 w-8" />}
        title="No creator profile linked"
        description="Once your creator profile is set up, your campaigns, deadlines, and payouts will appear here."
      />
    );
  }

  // ---- Derived metrics ----
  const activeCampaigns = creator.campaignCreators.filter((cc) =>
    ACTIVE_ASSIGN.includes(cc.status),
  ).length;

  const now = new Date();
  const upcomingDeadlines = creator.deliverables.filter(
    (d) => d.dueDate && d.dueDate > now && !DONE_STATES.includes(d.status),
  ).length;

  const creatorPayments = creator.payments.filter((p) => p.direction === "CREATOR");
  const pendingPayment = creatorPayments
    .filter((p) => p.status !== "PAID")
    .reduce((s, p) => s + (p.agreedAmount - p.paidAmount), 0);

  const inReview = creator.deliverables.filter((d) =>
    REVIEW_STATES.includes(d.status),
  ).length;

  // ---- Sorted lists ----
  const deliverables = [...creator.deliverables].sort((a, b) => {
    const av = a.dueDate ? a.dueDate.getTime() : Infinity;
    const bv = b.dueDate ? b.dueDate.getTime() : Infinity;
    return av - bv;
  });

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
          style={{ backgroundColor: creator.avatarColor }}
        >
          {creator.name.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hi, {creator.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s everything happening across your collaborations.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Campaigns"
          value={activeCampaigns}
          sub="In progress"
          icon={<Megaphone className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="Upcoming Deadlines"
          value={upcomingDeadlines}
          sub="Deliverables due"
          icon={<CalendarClock className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Pending Payment"
          value={inr(pendingPayment, { compact: true })}
          sub="Owed to you"
          icon={<Wallet className="h-5 w-5" />}
          tone="green"
        />
        <StatCard
          label="In Review"
          value={inReview}
          sub="Awaiting approval"
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Campaigns Assigned */}
        <Card>
          <CardHeader
            title="Campaigns Assigned"
            subtitle={`${creator.campaignCreators.length} collaboration${creator.campaignCreators.length === 1 ? "" : "s"}`}
          />
          {creator.campaignCreators.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No campaigns assigned yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {creator.campaignCreators.map((cc) => {
                const cs = meta(CREATOR_CC_TONE_MAP, cc.status);
                const brand = cc.campaign?.brand;
                return (
                  <div key={cc.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                      style={{ backgroundColor: brand?.logoColor ?? "#64748b" }}
                    >
                      {(brand?.companyName ?? "—").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {cc.campaign?.name ?? "Untitled campaign"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {brand?.companyName ?? "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {cc.agreedAmount ? inr(cc.agreedAmount) : "—"}
                      </p>
                      <div className="mt-1">
                        <Badge tone={cs.tone}>{cs.label}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Deadlines */}
        <Card>
          <CardHeader
            title="Deadlines"
            subtitle="Your deliverables, sorted by due date"
          />
          {deliverables.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No deliverables assigned.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {deliverables.map((d) => {
                const ds = meta(DELIVERABLE_STATUS, d.status);
                const overdue =
                  d.dueDate && isOverdue(d.dueDate) && !DONE_STATES.includes(d.status);
                return (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {d.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {d.campaign?.name ?? "—"} · {d.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={
                          overdue
                            ? "text-sm font-semibold text-rose-600"
                            : "text-sm font-medium text-slate-700"
                        }
                      >
                        {dateShort(d.dueDate)}
                      </p>
                      <div className="mt-1">
                        <Badge tone={ds.tone}>{ds.label}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader
            title="Payments"
            subtitle="Your payouts and their progress"
          />
          {creatorPayments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No payouts recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {creatorPayments.map((p) => {
                const ps = meta(PAYMENT_STATUS, p.status);
                const pct = p.agreedAmount
                  ? Math.round((p.paidAmount / p.agreedAmount) * 100)
                  : 0;
                return (
                  <div key={p.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {inr(p.agreedAmount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Due {dateShort(p.dueDate)}
                        </p>
                      </div>
                      <Badge tone={ps.tone}>{ps.label}</Badge>
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        value={pct}
                        tone={
                          p.status === "OVERDUE"
                            ? "red"
                            : p.status === "PAID"
                              ? "green"
                              : "brand"
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Contracts */}
        <Card>
          <CardHeader
            title="Contracts"
            subtitle={`${creator.contracts.length} agreement${creator.contracts.length === 1 ? "" : "s"}`}
          />
          {creator.contracts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No agreements on file.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {creator.contracts.map((c) => {
                const cs = meta(CONTRACT_STATUS, c.status);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {c.title}
                      </p>
                      <p className="text-xs text-slate-500">{c.type}</p>
                    </div>
                    <Badge tone={cs.tone}>{cs.label}</Badge>
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

// Local tone map for CampaignCreator status. This enum isn't exported from
// @/lib/enums, so we keep a module-local map and use the safe meta() accessor.
const CREATOR_CC_TONE_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  SHORTLISTED: { label: "Shortlisted", tone: "gray" },
  PROPOSED: { label: "Proposed", tone: "blue" },
  APPROVED: { label: "Approved", tone: "cyan" },
  DECLINED: { label: "Declined", tone: "red" },
  ACTIVE: { label: "Active", tone: "green" },
  COMPLETED: { label: "Completed", tone: "violet" },
};
