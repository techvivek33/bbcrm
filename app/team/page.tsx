import Link from "next/link";
import { Users, ShieldCheck, Briefcase, Check, Minus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { meta, ROLES } from "@/lib/enums";

export const dynamic = "force-dynamic";

// Internal staff vs. external portal accounts.
const TEAM_ROLES = ["ADMIN", "CAMPAIGN_MANAGER", "TALENT_MANAGER", "FINANCE"] as const;
const ROLE_RANK: Record<string, number> = {
  ADMIN: 0,
  CAMPAIGN_MANAGER: 1,
  TALENT_MANAGER: 2,
  FINANCE: 3,
  BRAND_POC: 4,
  CREATOR: 5,
};

// ---- RBAC matrix -----------------------------------------------------------
const AREAS = [
  "Dashboard",
  "Brands",
  "Creators",
  "Campaigns",
  "Approvals",
  "Payments",
  "Invoices",
  "Analytics",
  "Team",
  "Portals",
] as const;

type Area = (typeof AREAS)[number];

const ALL: Area[] = [...AREAS];

const PERMISSIONS: Record<string, Area[]> = {
  ADMIN: ALL,
  CAMPAIGN_MANAGER: ALL.filter((a) => a !== "Team"),
  TALENT_MANAGER: ALL.filter((a) => a !== "Payments" && a !== "Invoices" && a !== "Team"),
  FINANCE: ["Dashboard", "Brands", "Creators", "Campaigns", "Payments", "Invoices", "Analytics"],
  BRAND_POC: ["Portals"],
  CREATOR: ["Portals"],
};

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  title: string | null;
  active: boolean;
  link: { label: string; href?: string } | null;
};

export default async function TeamPage() {
  const users = await prisma.user.findMany({
    include: { brand: true, creator: true },
    orderBy: { role: "asc" },
  });

  const rows: TeamUser[] = users
    .map((u) => {
      let link: TeamUser["link"] = null;
      if (u.role === "BRAND_POC" && u.brand) {
        link = { label: u.brand.companyName, href: `/brands/${u.brand.id}` };
      } else if (u.role === "CREATOR" && u.creator) {
        link = { label: u.creator.name, href: `/creators/${u.creator.id}` };
      }
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatarColor: u.avatarColor,
        title: u.title,
        active: u.active,
        link,
      };
    })
    .sort((a, b) => (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99));

  const team = rows.filter((u) => (TEAM_ROLES as readonly string[]).includes(u.role));
  const portal = rows.filter((u) => u.role === "BRAND_POC" || u.role === "CREATOR");

  const activeTeam = team.filter((u) => u.active).length;
  const roleCounts: Record<string, number> = {};
  for (const u of team) roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1;

  return (
    <div>
      <PageHeader
        title="Team Management"
        subtitle="Who has access, what they can do, and how the agency is staffed."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Team Members"
          value={team.length}
          sub={`${activeTeam} active`}
          icon={<Users className="h-5 w-5" />}
          tone="blue"
        />
        {TEAM_ROLES.map((r) => {
          const m = meta(ROLES, r);
          return (
            <StatCard
              key={r}
              label={m.label}
              value={roleCounts[r] ?? 0}
              sub="Members"
              tone={m.tone}
            />
          );
        })}
      </div>

      <div className="space-y-6">
        <TeamSection
          title="Team Accounts"
          subtitle="Internal agency staff with operational access"
          icon={<ShieldCheck className="h-5 w-5 text-slate-400" />}
          rows={team}
          showLink={false}
        />

        <TeamSection
          title="Portal Accounts"
          subtitle="External brand and creator logins, scoped to their own data"
          icon={<Briefcase className="h-5 w-5 text-slate-400" />}
          rows={portal}
          showLink
        />

        <AccessMatrix />
      </div>
    </div>
  );
}

function TeamSection({
  title,
  subtitle,
  icon,
  rows,
  showLink,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  rows: TeamUser[];
  showLink: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            {icon}
            {title}
          </span>
        }
        subtitle={subtitle}
      />
      {rows.length === 0 ? (
        <EmptyState title="No accounts here" description="Nothing to show in this group yet." />
      ) : (
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Member</th>
                <th className="hidden px-5 py-3 sm:table-cell">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="hidden px-5 py-3 md:table-cell">
                  {showLink ? "Linked To" : "Title"}
                </th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((u) => {
                const m = meta(ROLES, u.role);
                return (
                  <tr key={u.id} className="hover-row">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={u.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{u.name}</p>
                          <p className="truncate text-xs text-slate-500 sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3">
                      <Badge tone={m.tone}>{m.label}</Badge>
                    </td>
                    <td className="hidden px-5 py-3 text-slate-600 md:table-cell">
                      {showLink ? (
                        u.link ? (
                          u.link.href ? (
                            <Link
                              href={u.link.href}
                              className="font-medium text-slate-700 hover:text-brand-600"
                            >
                              {u.link.label}
                            </Link>
                          ) : (
                            u.link.label
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )
                      ) : (
                        u.title ?? <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {u.active ? (
                        <Badge tone="green" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge tone="gray" dot>
                          Inactive
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function AccessMatrix() {
  const roleKeys = Object.keys(ROLES) as Array<keyof typeof ROLES>;
  return (
    <Card>
      <CardHeader
        title="Access Control Matrix"
        subtitle="Role-based permissions across every area of Agency OS"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3">Role</th>
              {AREAS.map((a) => (
                <th key={a} className="px-3 py-3 text-center font-semibold">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roleKeys.map((rk) => {
              const m = meta(ROLES, rk);
              const allowed = PERMISSIONS[rk] ?? [];
              return (
                <tr key={rk} className="hover-row">
                  <td className="whitespace-nowrap px-5 py-3">
                    <Badge tone={m.tone}>{m.label}</Badge>
                  </td>
                  {AREAS.map((a) => {
                    const ok = allowed.includes(a);
                    return (
                      <td key={a} className="px-3 py-3 text-center">
                        {ok ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center text-slate-300">
                            <Minus className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          Access granted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus className="h-4 w-4 text-slate-300" /> No access
        </span>
      </div>
    </Card>
  );
}
