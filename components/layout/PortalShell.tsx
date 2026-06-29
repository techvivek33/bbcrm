"use client";

import { useTransition } from "react";
import { Hexagon, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { meta, ROLES } from "@/lib/enums";
import { logout } from "@/lib/auth-actions";

export function PortalShell({
  user,
  children,
}: {
  user: { name: string; role: string; avatarColor: string };
  children: React.ReactNode;
}) {
  const role = meta(ROLES, user.role);
  const [pending, start] = useTransition();
  const portalName = user.role === "BRAND_POC" ? "Brand Portal" : "Creator Portal";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Hexagon className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">Agency OS</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{portalName}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-900">{user.name}</p>
              <div className="mt-0.5"><Badge tone={role.tone}>{role.label}</Badge></div>
            </div>
            <Avatar name={user.name} color={user.avatarColor} size="md" />
            <button
              onClick={() => start(() => logout())}
              disabled={pending}
              className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-60"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
