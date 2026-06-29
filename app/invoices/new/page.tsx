import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/crud-actions";
import { PageHeader, LinkButton } from "@/components/ui/misc";
import { TextField, SelectField, SubmitButton } from "@/components/ui/form";

export const dynamic = "force-dynamic";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "BRAND", label: "Brand Invoice" },
  { value: "CREATOR", label: "Creator Invoice" },
  { value: "GST", label: "GST Invoice" },
];

export default async function NewInvoicePage() {
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
        title="New Invoice"
        subtitle="Generate a GST-ready invoice and link it to a brand, creator or campaign."
        actions={
          <LinkButton href="/invoices" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to Invoices
          </LinkButton>
        }
      />

      <form action={createInvoice}>
        <div className="card card-pad">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField label="Type" name="type" options={TYPE_OPTIONS} defaultValue="BRAND" required />
            <SelectField
              label="Campaign"
              name="campaignId"
              options={campaignOptions}
              hint="Optional — link this invoice to a campaign"
            />
            <SelectField
              label="Brand"
              name="brandId"
              options={brandOptions}
              hint="For brand / GST invoices"
            />
            <SelectField
              label="Creator"
              name="creatorId"
              options={creatorOptions}
              hint="For creator payout invoices"
            />
            <TextField
              label="Description"
              name="lineItem"
              placeholder="Influencer marketing campaign — 1 Reel + 2 Stories"
              className="sm:col-span-2"
            />
            <TextField
              label="Amount (₹)"
              name="amount"
              type="number"
              required
              placeholder="100000"
              hint="Pre-tax amount"
            />
            <TextField
              label="Tax Rate"
              name="taxRate"
              type="number"
              defaultValue={18}
              hint="GST %"
            />
            <TextField label="Issued Date" name="issuedDate" type="date" />
            <TextField label="Due Date" name="dueDate" type="date" />
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
            <SubmitButton>Generate Invoice</SubmitButton>
            <LinkButton href="/invoices" variant="secondary">Cancel</LinkButton>
          </div>
        </div>
      </form>
    </div>
  );
}
