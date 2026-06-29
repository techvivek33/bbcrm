import {
  Library,
  FileBox,
  Presentation,
  Trophy,
  FileSignature,
  Receipt,
  LayoutTemplate,
  File,
  ExternalLink,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Toolbar } from "@/components/ui/Toolbar";
import { relative } from "@/lib/format";
import { parseList } from "@/lib/serialize";
import type { BadgeTone } from "@/lib/enums";
import { AddAssetForm } from "@/components/knowledge/AddAssetForm";

export const dynamic = "force-dynamic";

type CategoryMeta = { label: string; tone: BadgeTone; icon: LucideIcon };

const CATEGORIES: Record<string, CategoryMeta> = {
  MEDIA_KIT: { label: "Media Kit", tone: "blue", icon: FileBox },
  PITCH_DECK: { label: "Pitch Deck", tone: "violet", icon: Presentation },
  CASE_STUDY: { label: "Case Study", tone: "green", icon: Trophy },
  CONTRACT_TEMPLATE: { label: "Contract Template", tone: "amber", icon: FileSignature },
  RATE_CARD: { label: "Rate Card", tone: "cyan", icon: Receipt },
  CAMPAIGN_TEMPLATE: { label: "Campaign Template", tone: "pink", icon: LayoutTemplate },
  OTHER: { label: "Other", tone: "gray", icon: File },
};

function categoryMeta(key: string): CategoryMeta {
  return CATEGORIES[key] ?? { label: key.replace(/_/g, " "), tone: "gray", icon: File };
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category ?? "";

  const assets = await prisma.knowledgeAsset.findMany({ orderBy: { createdAt: "desc" } });

  const needle = q.toLowerCase();
  const filtered = assets.filter((a) => {
    if (category && a.category !== category) return false;
    if (needle && !a.title.toLowerCase().includes(needle)) return false;
    return true;
  });

  const total = assets.length;
  const counts: Record<string, number> = {};
  for (const a of assets) counts[a.category] = (counts[a.category] ?? 0) + 1;
  const templates =
    (counts.CONTRACT_TEMPLATE ?? 0) + (counts.CAMPAIGN_TEMPLATE ?? 0);
  const decks = (counts.PITCH_DECK ?? 0) + (counts.MEDIA_KIT ?? 0);

  return (
    <div>
      <PageHeader
        title="Knowledge Center"
        subtitle="One searchable home for media kits, decks, case studies and reusable templates."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Assets" value={total} sub="In the library" icon={<Library className="h-5 w-5" />} tone="blue" />
        <StatCard label="Decks & Kits" value={decks} sub="Pitch & media" icon={<Presentation className="h-5 w-5" />} tone="violet" />
        <StatCard label="Templates" value={templates} sub="Reusable docs" icon={<LayoutTemplate className="h-5 w-5" />} tone="amber" />
        <StatCard label="Case Studies" value={counts.CASE_STUDY ?? 0} sub="Proof points" icon={<Trophy className="h-5 w-5" />} tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Toolbar
            placeholder="Search assets by title…"
            filters={{
              key: "category",
              label: "Category",
              values: Object.entries(CATEGORIES).map(([value, m]) => ({ value, label: m.label })),
            }}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title={total === 0 ? "Your library is empty" : "No assets match your search"}
              description={
                total === 0
                  ? "Add your first media kit, deck or template using the form on the right."
                  : "Try a different keyword or clear the category filter."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((a) => {
                const m = categoryMeta(a.category);
                const Icon = m.icon;
                const tags = parseList(a.tags);
                const card = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <Badge tone={m.tone}>{m.label}</Badge>
                    </div>
                    <div className="mt-3 flex items-start gap-1.5">
                      <h3 className="flex-1 text-sm font-semibold text-slate-900 group-hover:text-brand-600">
                        {a.title}
                      </h3>
                      {a.url && <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-brand-500" />}
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {tags.map((t) => (
                          <Badge key={t} tone="gray">{t}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="mt-3 text-xs text-slate-400">Added {relative(a.createdAt)}</p>
                  </>
                );
                return a.url ? (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group card card-pad transition-shadow hover:shadow-md"
                  >
                    {card}
                  </a>
                ) : (
                  <div key={a.id} className="group card card-pad">
                    {card}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <AddAssetForm />
        </div>
      </div>
    </div>
  );
}
