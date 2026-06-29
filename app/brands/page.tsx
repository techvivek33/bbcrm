import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/Badge";
import { Toolbar } from "@/components/ui/Toolbar";
import { inr } from "@/lib/format";
import { meta, BRAND_STATUS } from "@/lib/enums";
import { parseList } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const brands = await prisma.brand.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? { OR: [{ companyName: { contains: q } }, { contactPerson: { contains: q } }, { industry: { contains: q } }] }
        : {}),
    },
    include: {
      _count: { select: { campaigns: true } },
      campaigns: { select: { budget: true, stage: true } },
    },
    orderBy: { companyName: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Brand CRM"
        subtitle="Your brand relationships, deals, and history — one record per account."
        actions={
          <LinkButton href="/brands/new">
            <Plus className="h-4 w-4" /> Add Brand
          </LinkButton>
        }
      />

      <Toolbar
        placeholder="Search brands, contacts, industries…"
        filters={{
          key: "status",
          label: "Status",
          values: Object.entries(BRAND_STATUS).map(([value, m]) => ({ value, label: m.label })),
        }}
      />

      {brands.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} title="No brands found" description="Try a different search or add a new brand." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">Contact</th>
                <th className="hidden px-5 py-3 md:table-cell">Categories</th>
                <th className="px-5 py-3 text-center">Campaigns</th>
                <th className="hidden px-5 py-3 text-right lg:table-cell">Portfolio</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brands.map((b) => {
                const s = meta(BRAND_STATUS, b.status);
                const cats = parseList(b.preferredCategories);
                const portfolio = b.campaigns.reduce((sum, c) => sum + c.budget, 0);
                return (
                  <tr key={b.id} className="hover-row">
                    <td className="px-5 py-3">
                      <Link href={`/brands/${b.id}`} className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: b.logoColor }}
                        >
                          {b.companyName.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{b.companyName}</p>
                          <p className="text-xs text-slate-500">{b.industry ?? "—"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-800">{b.contactPerson ?? "—"}</p>
                      <p className="text-xs text-slate-500">{b.designation ?? ""}</p>
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {cats.slice(0, 3).map((c) => (
                          <Badge key={c} tone="gray">{c}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-slate-700">{b._count.campaigns}</td>
                    <td className="hidden px-5 py-3 text-right font-semibold text-slate-700 lg:table-cell">
                      {inr(portfolio, { compact: true })}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={s.tone} dot>{s.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
