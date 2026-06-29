import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PortalShell } from "@/components/layout/PortalShell";
import { getCurrentUser, listLoginAccounts } from "@/lib/session";
import { landingFor } from "@/lib/routing";

export const metadata: Metadata = {
  title: "Agency OS — Operating System for Influencer Marketing",
  description:
    "CRM + Campaign Management + Creator Database + Payments + Approvals + Portals + Analytics in one platform.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLogin = pathname === "/login" || pathname.startsWith("/login/");
  const isPortal = pathname.startsWith("/portal");

  // Login: bare canvas.
  if (isLogin) {
    return (
      <html lang="en">
        <body className="min-h-screen">{children}</body>
      </html>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // RBAC: portal-only roles never see the internal team app — send them home.
  const portalOnly = user.role === "BRAND_POC" || user.role === "CREATOR";
  if (portalOnly && !isPortal) redirect(landingFor(user.role));

  // Portals: white-labeled chrome for brands & creators.
  if (isPortal) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-slate-50">
          <PortalShell user={{ name: user.name, role: user.role, avatarColor: user.avatarColor }}>
            {children}
          </PortalShell>
        </body>
      </html>
    );
  }

  // Internal team app: full shell.
  const accounts = user.role === "ADMIN" ? await listLoginAccounts() : [];
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar role={user.role} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              user={{ name: user.name, role: user.role, title: user.title, avatarColor: user.avatarColor }}
              accounts={accounts.map((a) => ({ id: a.id, name: a.name, role: a.role }))}
            />
            <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
