import Link from "next/link";
import {
  Megaphone,
  CheckCircle2,
  Wallet,
  UserPlus,
  TrendingUp,
  CalendarClock,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { getDashboardData } from "@/lib/queries";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar, EmptyState } from "@/components/ui/misc";
import { inr } from "@/lib/format";
import { dateShort, daysUntil } from "@/lib/format";
import { meta, BRAND_STATUS, DELIVERABLE_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const d = await getDashboardData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Master Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything that matters across your agency — live, in one place.
        </p>
      </div>

      {/* Top metric row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Active Campaigns"
          value={d.counts.activeCampaigns}
          sub="In flight right now"
          icon={<Megaphone className="h-5 w-5" />}
          tone="blue"
          href="/campaigns"
        />
        <StatCard
          label="Pending Approvals"
          value={d.counts.pendingApprovals}
          sub="Awaiting review"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="violet"
          href="/approvals"
        />
        <StatCard
          label="Pending Payments"
          value={d.counts.pendingPayments}
          sub={`${inr(d.revenue.outstandingReceivable, { compact: true })} receivable`}
          icon={<Wallet className="h-5 w-5" />}
          tone="amber"
          href="/payments"
        />
        <StatCard
          label="Creators This Month"
          value={d.counts.creatorsThisMonth}
          sub="Newly onboarded"
          icon={<UserPlus className="h-5 w-5" />}
          tone="pink"
          href="/creators"
        />
        <StatCard
          label="Revenue Collected"
          value={inr(d.revenue.total, { compact: true })}
          sub={`${inr(d.revenue.thisMonth, { compact: true })} this month`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="green"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: deliverables + brand status */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overdue */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Overdue Deliverables
                </span>
              }
              subtitle="Needs immediate attention"
              action={<Badge tone="red">{d.overdueDeliverables.length}</Badge>}
            />
            <DeliverableList items={d.overdueDeliverables} overdue />
          </Card>

          {/* Upcoming */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-brand-500" />
                  Upcoming Deliverables
                </span>
              }
              subtitle="Due soon"
            />
            <DeliverableList items={d.upcomingDeliverables} />
          </Card>

          {/* Brand-wise status */}
          <Card>
            <CardHeader title="Brand-wise Campaign Status" subtitle="Portfolio by account" />
            <div className="divide-y divide-slate-100">
              {d.campaignsByBrand.map((b) => {
                const s = meta(BRAND_STATUS, b.status);
                return (
                  <Link
                    key={b.id}
                    href={`/brands/${b.id}`}
                    className="hover-row flex items-center gap-3 px-5 py-3"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: b.color }}
                    >
                      {b.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{b.name}</p>
                      <p className="text-xs text-slate-500">
                        {b.activeCount} active · {b.campaignCount} total campaigns
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold text-slate-900">
                        {inr(b.totalBudget, { compact: true })}
                      </p>
                      <p className="text-xs text-slate-400">portfolio value</p>
                    </div>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: team productivity */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Team Productivity"
              subtitle={`${d.counts.openTasks} open tasks`}
              action={
                <Link
                  href="/tasks"
                  className="flex items-center gap-0.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  View <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
            <div className="space-y-4 p-5">
              {d.teamProductivity.length === 0 && (
                <p className="text-sm text-slate-500">No tasks assigned yet.</p>
              )}
              {d.teamProductivity.map((m) => {
                const pct = m.total ? Math.round((m.completed / m.total) * 100) : 0;
                return (
                  <div key={m.name}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <Avatar name={m.name} color={m.color} size="sm" />
                      <span className="flex-1 truncate text-sm font-medium text-slate-700">
                        {m.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {m.completed}/{m.total}
                      </span>
                    </div>
                    <ProgressBar value={pct} tone={m.overdue > 0 ? "amber" : "green"} />
                    {m.overdue > 0 && (
                      <p className="mt-1 text-[11px] text-rose-500">{m.overdue} overdue</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quick links */}
          <Card>
            <CardHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-2 p-4">
              {[
                { label: "New Campaign", href: "/campaigns/new" },
                { label: "Add Creator", href: "/creators/new" },
                { label: "Add Brand", href: "/brands/new" },
                { label: "Review Content", href: "/approvals" },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="focus-ring rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- deliverable list (shared by upcoming + overdue) ------------------------
type DeliverableItem = Awaited<ReturnType<typeof getDashboardData>>["upcomingDeliverables"][number];

function DeliverableList({ items, overdue }: { items: DeliverableItem[]; overdue?: boolean }) {
  if (items.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title={overdue ? "Nothing overdue 🎉" : "No upcoming deliverables"}
          description={overdue ? "Your team is on top of every deadline." : undefined}
        />
      </div>
    );
  }
  return (
    <div className="divide-y divide-slate-100">
      {items.map((it) => {
        const s = meta(DELIVERABLE_STATUS, it.status);
        const dleft = daysUntil(it.dueDate);
        return (
          <Link
            key={it.id}
            href={`/campaigns/${it.campaignId}`}
            className="hover-row flex items-center gap-3 px-5 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{it.title}</p>
              <p className="truncate text-xs text-slate-500">
                {it.campaign.brand.companyName} · {it.creator?.name ?? "Unassigned"} · {it.type}
              </p>
            </div>
            <Badge tone={s.tone}>{s.label}</Badge>
            <div className="w-20 shrink-0 text-right">
              <p className={`text-xs font-semibold ${overdue ? "text-rose-600" : "text-slate-700"}`}>
                {dateShort(it.dueDate)}
              </p>
              <p className="text-[11px] text-slate-400">
                {dleft === null
                  ? ""
                  : dleft < 0
                    ? `${Math.abs(dleft)}d overdue`
                    : dleft === 0
                      ? "due today"
                      : `in ${dleft}d`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
