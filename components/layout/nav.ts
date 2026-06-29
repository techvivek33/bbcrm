// Sidebar navigation for the internal team app. Every module is now live.
// `roles` (optional) gates an item; when omitted it's visible to all internal
// roles. Brand POC / Creator never see this sidebar — they get the portal shell.

import type { Role } from "@/lib/enums";

export type NavItem = {
  label: string;
  href: string;
  icon: string; // lucide-react icon name
  module?: number;
  roles?: Role[];
};

export type NavGroup = { heading: string; items: NavItem[]; roles?: Role[] };

const FINANCE_ROLES: Role[] = ["ADMIN", "FINANCE", "CAMPAIGN_MANAGER"];

export const NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: "LayoutDashboard", module: 1 }],
  },
  {
    heading: "Relationships",
    items: [
      { label: "Brands", href: "/brands", icon: "Building2", module: 2 },
      { label: "Creators", href: "/creators", icon: "Users", module: 3 },
      { label: "Onboarding", href: "/onboarding", icon: "UserPlus", module: 4 },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: "Megaphone", module: 5 },
      { label: "Tasks", href: "/tasks", icon: "ListChecks", module: 6 },
      { label: "Content Approvals", href: "/approvals", icon: "CheckCircle2", module: 7 },
      { label: "Discovery Engine", href: "/discovery", icon: "Radar", module: 8 },
      { label: "Proposal Builder", href: "/proposals", icon: "FileText", module: 9 },
    ],
  },
  {
    heading: "Finance",
    items: [
      { label: "Payments", href: "/payments", icon: "Wallet", module: 11, roles: FINANCE_ROLES },
      { label: "Invoices", href: "/invoices", icon: "ReceiptIndianRupee", module: 12, roles: FINANCE_ROLES },
      { label: "Contracts", href: "/contracts", icon: "FileSignature", module: 13 },
    ],
  },
  {
    heading: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: "BarChart3", module: 14 },
      { label: "Revenue", href: "/revenue", icon: "TrendingUp", module: 18, roles: ["ADMIN", "FINANCE"] },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { label: "Knowledge Center", href: "/knowledge", icon: "BookOpen", module: 16 },
      { label: "Team", href: "/team", icon: "Shield", module: 15, roles: ["ADMIN"] },
    ],
  },
  {
    heading: "Portals",
    roles: ["ADMIN"],
    items: [
      { label: "Brand Portal", href: "/portal/brand", icon: "Globe", module: 19, roles: ["ADMIN"] },
      { label: "Creator Portal", href: "/portal/creator", icon: "Sparkles", module: 19, roles: ["ADMIN"] },
    ],
  },
];

export function visibleNav(role: string): NavGroup[] {
  const can = (roles?: Role[]) => !roles || roles.includes(role as Role);
  return NAV.filter((g) => can(g.roles))
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.roles)) }))
    .filter((g) => g.items.length > 0);
}
