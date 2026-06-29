import { Pin } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { relative } from "@/lib/format";

export type NoteRow = {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: Date;
  author?: { name: string; avatarColor: string } | null;
};

export function NoteList({ notes }: { notes: NoteRow[] }) {
  if (notes.length === 0) {
    return <p className="px-5 py-6 text-sm text-slate-500">No notes yet. Add the first one below.</p>;
  }
  const sorted = [...notes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  return (
    <ul className="divide-y divide-slate-100">
      {sorted.map((n) => (
        <li key={n.id} className="flex gap-3 px-5 py-3">
          <Avatar name={n.author?.name ?? "?"} color={n.author?.avatarColor ?? "#94a3b8"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-800">{n.body}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              {n.pinned && <Pin className="h-3 w-3 fill-amber-400 text-amber-400" />}
              {n.author?.name ?? "Unknown"} · {relative(n.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
