import { Plus, PhoneCall, Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Toolbar } from "@/components/ui/Toolbar";
import { LinkRow } from "@/components/ui/LinkRow";
import { dateShort } from "@/lib/format";
import { meta, COLD_CALL_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

type CC = { fu1Date: Date | null; fu2Date: Date | null; fu3Date: Date | null; fu4Date: Date | null; fu5Date: Date | null; fu6Date: Date | null; fu1Note: string | null; fu2Note: string | null; fu3Note: string | null; fu4Note: string | null; fu5Note: string | null; fu6Note: string | null };

function followUpsDone(c: CC): number {
  const dates = [c.fu1Date, c.fu2Date, c.fu3Date, c.fu4Date, c.fu5Date, c.fu6Date];
  const notes = [c.fu1Note, c.fu2Note, c.fu3Note, c.fu4Note, c.fu5Note, c.fu6Note];
  let n = 0;
  for (let i = 0; i < 6; i++) if (dates[i] || (notes[i] && notes[i]!.trim())) n++;
  return n;
}
function lastFollowUp(c: CC): Date | null {
  const dates = [c.fu1Date, c.fu2Date, c.fu3Date, c.fu4Date, c.fu5Date, c.fu6Date].filter(Boolean) as Date[];
  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
}

export default async function ColdCallsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const leads = await prisma.coldCall.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { company: { contains: q } }, { email: { contains: q } }, { number: { contains: q } }] } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const count = (s: string) => leads.filter((l) => l.status === s).length;

  return (
    <div>
      <PageHeader
        title="Cold Calls"
        subtitle="Your outbound lead pipeline — pitch, track and follow up (up to 6 touches per lead)."
        actions={
          <LinkButton href="/cold-calls/new">
            <Plus className="h-4 w-4" /> Add Lead
          </LinkButton>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Leads" value={leads.length} tone="blue" />
        <StatCard label="Interested" value={count("INTERESTED")} tone="cyan" />
        <StatCard label="In Follow-up" value={count("FOLLOW_UP")} tone="amber" />
        <StatCard label="Converted" value={count("CONVERTED")} tone="green" />
      </div>

      <Toolbar
        placeholder="Search name, company, email, number…"
        filters={{ key: "status", label: "Status", values: Object.entries(COLD_CALL_STATUS).map(([value, m]) => ({ value, label: m.label })) }}
      />

      {leads.length === 0 ? (
        <EmptyState icon={<PhoneCall className="h-8 w-8" />} title="No leads yet" description="Add your first cold-call lead to start tracking pitches and follow-ups." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Company</th>
                <th className="hidden px-5 py-3 md:table-cell">Contact</th>
                <th className="px-5 py-3 text-center">Follow-ups</th>
                <th className="hidden px-5 py-3 lg:table-cell">Last touch</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((l) => {
                const s = meta(COLD_CALL_STATUS, l.status);
                const done = followUpsDone(l);
                const last = lastFollowUp(l);
                return (
                  <LinkRow key={l.id} href={`/cold-calls/${l.id}`}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{l.name}</p>
                      {l.pitch && <p className="max-w-[220px] truncate text-xs text-slate-500">{l.pitch}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{l.company ?? "—"}</td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <div className="space-y-0.5 text-xs text-slate-500">
                        {l.number && <p className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {l.number}</p>}
                        {l.email && <p className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {l.email}</p>}
                        {!l.number && !l.email && "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge tone={done >= 6 ? "green" : done > 0 ? "amber" : "gray"}>{done}/6</Badge>
                    </td>
                    <td className="hidden px-5 py-3 text-slate-500 lg:table-cell">{last ? dateShort(last) : "—"}</td>
                    <td className="px-5 py-3"><Badge tone={s.tone} dot>{s.label}</Badge></td>
                  </LinkRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
