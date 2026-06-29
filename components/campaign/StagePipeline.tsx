"use client";

import { useTransition } from "react";
import { Check, ChevronRight } from "lucide-react";
import { setCampaignStage } from "@/lib/actions";
import { CAMPAIGN_STAGES, CAMPAIGN_STAGE_ORDER } from "@/lib/enums";
import { cn } from "@/lib/utils";

export function StagePipeline({ campaignId, current }: { campaignId: string; current: string }) {
  const [pending, start] = useTransition();
  const currentIdx = CAMPAIGN_STAGE_ORDER.indexOf(current as keyof typeof CAMPAIGN_STAGES);

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        {CAMPAIGN_STAGE_ORDER.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <button
              key={stage}
              disabled={pending}
              onClick={() => start(() => setCampaignStage(campaignId, stage))}
              className={cn(
                "focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                active
                  ? "bg-brand-600 text-white"
                  : done
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
              title={`Move to ${CAMPAIGN_STAGES[stage].label}`}
            >
              {done && <Check className="h-3 w-3" />}
              {CAMPAIGN_STAGES[stage].label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
        <ChevronRight className="h-3 w-3" />
        Click any stage to move this campaign. Changes log automatically to the timeline.
      </p>
    </div>
  );
}
