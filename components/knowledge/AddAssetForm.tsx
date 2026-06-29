"use client";

import { createKnowledgeAsset } from "@/lib/crud-actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { TextField, SelectField, SubmitButton } from "@/components/ui/form";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "MEDIA_KIT", label: "Media Kit" },
  { value: "PITCH_DECK", label: "Pitch Deck" },
  { value: "CASE_STUDY", label: "Case Study" },
  { value: "CONTRACT_TEMPLATE", label: "Contract Template" },
  { value: "RATE_CARD", label: "Rate Card" },
  { value: "CAMPAIGN_TEMPLATE", label: "Campaign Template" },
  { value: "OTHER", label: "Other" },
];

/** Quick-add form to drop a new reusable asset into the shared library. */
export function AddAssetForm() {
  return (
    <Card>
      <CardHeader title="Add to Library" subtitle="Drop in a reusable asset for the whole team" />
      <form action={createKnowledgeAsset} className="card-pad pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Title"
            name="title"
            required
            placeholder="Agency Media Kit — 2026"
            className="sm:col-span-2"
          />
          <SelectField
            label="Category"
            name="category"
            options={CATEGORY_OPTIONS}
            defaultValue="MEDIA_KIT"
            required
          />
          <TextField
            label="URL"
            name="url"
            type="url"
            placeholder="https://drive.google.com/…"
            hint="Link to the file or folder"
          />
          <TextField
            label="Tags"
            name="tags"
            placeholder="instagram, fashion, q3"
            hint="comma-separated"
            className="sm:col-span-2"
          />
        </div>
        <div className="mt-5 flex items-center justify-end border-t border-slate-100 pt-4">
          <SubmitButton>Add to Library</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
