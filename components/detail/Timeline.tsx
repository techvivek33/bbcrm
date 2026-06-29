import { Mail, Phone, Users, MessageCircle, FileText, Rocket, Wallet, StickyNote, GitCommitVertical, FileBox } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { relative } from "@/lib/format";
import { meta, ACTIVITY_TYPE } from "@/lib/enums";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  EMAIL: Mail,
  CALL: Phone,
  MEETING: Users,
  WHATSAPP: MessageCircle,
  PROPOSAL: FileText,
  CAMPAIGN_LAUNCH: Rocket,
  PAYMENT: Wallet,
  NOTE: StickyNote,
  STATUS_CHANGE: GitCommitVertical,
  DOCUMENT: FileBox,
};

export type ActivityRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  occurredAt: Date;
  user?: { name: string } | null;
};

export function Timeline({ items }: { items: ActivityRow[] }) {
  if (items.length === 0) {
    return <p className="px-5 py-6 text-sm text-slate-500">No interactions logged yet.</p>;
  }
  return (
    <ol className="relative px-5 py-4">
      <span className="absolute bottom-4 left-[2.15rem] top-6 w-px bg-slate-200" aria-hidden />
      {items.map((a) => {
        const m = meta(ACTIVITY_TYPE, a.type);
        const Icon = ICONS[a.type] ?? StickyNote;
        return (
          <li key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
            <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
              <Icon className="h-3.5 w-3.5 text-slate-500" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{a.title}</p>
                <Badge tone={m.tone}>{m.label}</Badge>
              </div>
              {a.body && <p className="mt-0.5 text-sm text-slate-600">{a.body}</p>}
              <p className="mt-0.5 text-xs text-slate-400">
                {relative(a.occurredAt)}
                {a.user ? ` · ${a.user.name}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
