import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createContract } from "@/lib/crud-actions";
import { PageHeader, LinkButton } from "@/components/ui/misc";
import { TextField, SelectField, SubmitButton } from "@/components/ui/form";
import { CONTRACT_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "CREATOR", label: "Creator Agreement" },
  { value: "BRAND", label: "Brand Agreement" },
  { value: "NDA", label: "NDA" },
  { value: "SOW", label: "Statement of Work" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = Object.entries(CONTRACT_STATUS).map(
  function (e) {
    return { value: e[0], label: e[1].label };
  },
);

export default async function NewContractPage() {
  const [brands, creators, campaigns] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
    prisma.creator.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.campaign.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const brandOptions: { value: string; label: string }[] = [
    { value: "", label: "— none —" },
    ...brands.map(function (b) {
      return { value: b.id, label: b.companyName };
    }),
  ];

  const creatorOptions: { value: string; label: string }[] = [
    { value: "", label: "— none —" },
    ...creators.map(function (c) {
      return { value: c.id, label: c.name };
    }),
  ];

  const campaignOptions: { value: string; label: string }[] = [
    { value: "", label: "— none —" },
    ...campaigns.map(function (c) {
      return { value: c.id, label: c.name };
    }),
  ];

  return (
    <div>
      <PageHeader
        title="New Contract"
        subtitle="Create an agreement and link it to a brand, creator or campaign for e-signature."
        actions={
          <LinkButton href="/contracts" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to Contracts
          </LinkButton>
        }
      />

      <form action={createContract}>
        <div className="card card-pad">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Title"
              name="title"
              required
              placeholder="Creator Collaboration Agreement — Q3"
              className="sm:col-span-2"
            />
            <SelectField label="Type" name="type" options={TYPE_OPTIONS} defaultValue="BRAND" required />
            <SelectField label="Status" name="status" options={STATUS_OPTIONS} defaultValue="DRAFT" required />
            <SelectField
              label="Brand"
              name="brandId"
              options={brandOptions}
              hint="For brand agreements"
            />
            <SelectField
              label="Creator"
              name="creatorId"
              options={creatorOptions}
              hint="For creator agreements"
            />
            <SelectField
              label="Campaign"
              name="campaignId"
              options={campaignOptions}
              hint="Optional — link this contract to a campaign"
              className="sm:col-span-2"
            />
            <TextField label="Expiry Date" name="expiryDate" type="date" hint="When the agreement lapses" />
            <TextField label="Renewal Reminder" name="renewalReminderDate" type="date" hint="Nudge to renew before expiry" />
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
            <SubmitButton>Create Contract</SubmitButton>
            <LinkButton href="/contracts" variant="secondary">Cancel</LinkButton>
          </div>
        </div>
      </form>
    </div>
  );
}
