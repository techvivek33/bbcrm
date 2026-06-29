import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/lib/enums";

const ICON_TONE: Record<BadgeTone, string> = {
  gray: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  cyan: "bg-cyan-50 text-cyan-600",
  pink: "bg-pink-50 text-pink-600",
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "blue",
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: BadgeTone;
  href?: string;
}) {
  const inner = (
    <div className="card card-pad h-full transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        {icon && (
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", ICON_TONE[tone])}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="focus-ring rounded-2xl">
      {inner}
    </Link>
  ) : (
    inner
  );
}
