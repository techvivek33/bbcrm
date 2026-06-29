import { prisma } from "@/lib/prisma";

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const ACTIVE_STAGES = [
  "CREATOR_SELECTION",
  "BRAND_APPROVAL",
  "CONTENT_PRODUCTION",
  "POSTING",
  "REPORTING",
  "PAYMENT_CLOSURE",
];

const OPEN_DELIVERABLE_STATUSES = ["PENDING", "SUBMITTED", "INTERNAL_REVIEW", "BRAND_REVIEW", "REVISION"];

export async function getDashboardData() {
  const now = new Date();
  const monthStart = startOfMonth();

  const [
    activeCampaigns,
    pendingApprovals,
    creatorsThisMonth,
    brandPayments,
    upcomingDeliverables,
    overdueDeliverables,
    campaignsByBrand,
    tasks,
    openTasks,
    revenueAgg,
    revenueThisMonthAgg,
  ] = await Promise.all([
    prisma.campaign.count({ where: { stage: { in: ACTIVE_STAGES } } }),
    prisma.deliverable.count({ where: { status: { in: ["SUBMITTED", "INTERNAL_REVIEW", "BRAND_REVIEW"] } } }),
    prisma.creator.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.payment.findMany({ where: { direction: "BRAND" } }),
    prisma.deliverable.findMany({
      where: { dueDate: { gte: now }, status: { in: OPEN_DELIVERABLE_STATUSES } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { campaign: { include: { brand: true } }, creator: true },
    }),
    prisma.deliverable.findMany({
      where: { dueDate: { lt: now }, status: { in: OPEN_DELIVERABLE_STATUSES } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { campaign: { include: { brand: true } }, creator: true },
    }),
    prisma.brand.findMany({
      include: {
        campaigns: { select: { id: true, stage: true, budget: true } },
      },
      orderBy: { companyName: "asc" },
    }),
    prisma.task.findMany({ include: { assignee: true } }),
    prisma.task.count({ where: { status: { notIn: ["COMPLETED"] } } }),
    prisma.payment.aggregate({ _sum: { paidAmount: true }, where: { direction: "BRAND" } }),
    prisma.payment.aggregate({
      _sum: { paidAmount: true },
      where: { direction: "BRAND", paidDate: { gte: monthStart } },
    }),
  ]);

  // Outstanding receivables/payables
  const pendingBrand = brandPayments.filter((p) => p.status !== "PAID");
  const outstandingReceivable = pendingBrand.reduce(
    (s, p) => s + (p.agreedAmount - p.paidAmount),
    0,
  );

  // Team productivity: completed vs total tasks per assignee
  const byAssignee = new Map<
    string,
    { name: string; color: string; total: number; completed: number; overdue: number }
  >();
  for (const t of tasks) {
    if (!t.assignee) continue;
    const e =
      byAssignee.get(t.assignee.id) ??
      { name: t.assignee.name, color: t.assignee.avatarColor, total: 0, completed: 0, overdue: 0 };
    e.total += 1;
    if (t.status === "COMPLETED") e.completed += 1;
    if (t.status === "OVERDUE") e.overdue += 1;
    byAssignee.set(t.assignee.id, e);
  }

  return {
    counts: {
      activeCampaigns,
      pendingApprovals,
      pendingPayments: pendingBrand.length,
      creatorsThisMonth,
      openTasks,
    },
    revenue: {
      total: revenueAgg._sum.paidAmount ?? 0,
      thisMonth: revenueThisMonthAgg._sum.paidAmount ?? 0,
      outstandingReceivable,
    },
    upcomingDeliverables,
    overdueDeliverables,
    campaignsByBrand: campaignsByBrand
      .map((b) => ({
        id: b.id,
        name: b.companyName,
        color: b.logoColor,
        status: b.status,
        campaignCount: b.campaigns.length,
        activeCount: b.campaigns.filter((c) => ACTIVE_STAGES.includes(c.stage)).length,
        totalBudget: b.campaigns.reduce((s, c) => s + c.budget, 0),
      }))
      .filter((b) => b.campaignCount > 0)
      .sort((a, b) => b.totalBudget - a.totalBudget),
    teamProductivity: Array.from(byAssignee.values()).sort((a, b) => b.total - a.total),
  };
}
