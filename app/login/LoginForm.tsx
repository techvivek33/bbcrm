"use client";

import { useActionState, useTransition } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { login, quickLogin, type LoginState } from "@/lib/auth-actions";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { meta, ROLES } from "@/lib/enums";

type Account = { id: string; name: string; email: string; role: string; roleLabel: string; avatarColor: string };

export function LoginForm({ accounts }: { accounts: Account[] }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [quickPending, startQuick] = useTransition();

  return (
    <div className="mt-8">
      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            name="email"
            type="email"
            required
            defaultValue={accounts[0]?.email}
            className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            placeholder="you@agency.os"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            name="password"
            type="password"
            required
            defaultValue="agency123"
            className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-slate-400">Demo password for all accounts: <code className="font-mono">agency123</code></p>
        </div>

        {state.error && (
          <p className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            <AlertCircle className="h-4 w-4" /> {state.error}
          </p>
        )}

        <button
          disabled={pending}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" /> {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or one-click demo sign-in <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-1.5">
        {accounts.map((a) => {
          const m = meta(ROLES, a.role);
          return (
            <button
              key={a.id}
              disabled={quickPending}
              onClick={() => startQuick(() => quickLogin(a.id))}
              className="focus-ring flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left transition-colors hover:border-brand-200 hover:bg-brand-50 disabled:opacity-60"
            >
              <Avatar name={a.name} color={a.avatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{a.name}</p>
                <p className="truncate text-xs text-slate-400">{a.email}</p>
              </div>
              <Badge tone={m.tone}>{a.roleLabel}</Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
