import { Hexagon } from "lucide-react";
import { listLoginAccounts } from "@/lib/session";
import { meta, ROLES } from "@/lib/enums";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const accounts = await listLoginAccounts();

  return (
    <div className="flex min-h-screen">
      {/* Left: brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Hexagon className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold">Agency OS</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            The operating system for your influencer-marketing agency.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            CRM, campaigns, creator database, approvals, payments, portals and analytics —
            everything your team, brands and creators need, in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-sm">
            {["Brand CRM", "Campaigns", "Approvals", "Payments", "Portals", "Analytics"].map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-3 py-1">{t}</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-brand-200">© 2026 Agency OS</p>
      </div>

      {/* Right: sign-in */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Hexagon className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">Agency OS</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your workspace.</p>

          <LoginForm
            accounts={accounts.map((a) => ({
              id: a.id,
              name: a.name,
              email: a.email,
              role: a.role,
              roleLabel: meta(ROLES, a.role).label,
              avatarColor: a.avatarColor,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
