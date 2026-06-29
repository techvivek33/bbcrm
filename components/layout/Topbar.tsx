"use client";

import { useState, useTransition } from "react";
import { Search, LogOut, ChevronDown, Eye } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { meta, ROLES } from "@/lib/enums";
import { logout, switchUser } from "@/lib/auth-actions";

type Account = { id: string; name: string; role: string };

export function Topbar({
  user,
  accounts,
}: {
  user: { name: string; role: string; title: string | null; avatarColor: string };
  accounts: Account[];
}) {
  const role = meta(ROLES, user.role);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-5 backdrop-blur">
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search brands, creators, campaigns…"
          className="focus-ring w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>

      <div className="relative ml-auto flex items-center gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="focus-ring flex items-center gap-2.5 rounded-lg border border-transparent px-1.5 py-1 hover:border-slate-200 hover:bg-slate-50"
        >
          <Avatar name={user.name} color={user.avatarColor} size="md" />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-900">{user.name}</p>
            <div className="mt-0.5"><Badge tone={role.tone}>{role.label}</Badge></div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-12 z-20 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.title}</p>
              </div>

              {accounts.length > 0 && (
                <div className="border-b border-slate-100 py-1.5">
                  <p className="flex items-center gap-1.5 px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    <Eye className="h-3 w-3" /> View as (admin)
                  </p>
                  <div className="max-h-56 overflow-y-auto">
                    {accounts.map((a) => {
                      const m = meta(ROLES, a.role);
                      return (
                        <button
                          key={a.id}
                          disabled={pending}
                          onClick={() => start(() => switchUser(a.id))}
                          className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-60"
                        >
                          <span className="truncate text-slate-700">{a.name}</span>
                          <Badge tone={m.tone}>{m.label}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => start(() => logout())}
                disabled={pending}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
