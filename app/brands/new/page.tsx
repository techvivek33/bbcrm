import { ArrowLeft } from "lucide-react";
import { createBrand } from "@/lib/crud-actions";
import { PageHeader, LinkButton } from "@/components/ui/misc";
import { TextField, TextareaField, SelectField, SubmitButton } from "@/components/ui/form";
import { BRAND_STATUS } from "@/lib/enums";

const statusOptions = Object.entries(BRAND_STATUS).map(function (e) {
  return { value: e[0], label: e[1].label };
});

export default function NewBrandPage() {
  return (
    <div>
      <PageHeader
        title="Add Brand"
        subtitle="Onboard a new brand partner into the agency CRM."
        actions={
          <LinkButton href="/brands" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to Brands
          </LinkButton>
        }
      />

      <form action={createBrand}>
        <div className="card card-pad">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Company Name"
              name="companyName"
              required
              placeholder="Acme Inc."
              className="sm:col-span-2"
            />
            <TextField label="Industry" name="industry" placeholder="FMCG, Tech, Fashion…" />
            <TextField label="Website" name="website" placeholder="acme.com" />
            <TextField label="Contact Person" name="contactPerson" placeholder="Full name" />
            <TextField label="Designation" name="designation" placeholder="Marketing Head" />
            <TextField label="Email" name="email" type="email" placeholder="contact@acme.com" />
            <TextField label="Phone" name="phone" placeholder="+91 98765 43210" />
            <TextField label="LinkedIn" name="linkedin" placeholder="linkedin.com/company/acme" className="sm:col-span-2" />
            <TextField label="Budget Range Min" name="budgetRangeMin" type="number" placeholder="500000" />
            <TextField label="Budget Range Max" name="budgetRangeMax" type="number" placeholder="2000000" />
            <TextField label="Payment Terms" name="paymentTerms" placeholder="Net 30" />
            <SelectField label="Status" name="status" options={statusOptions} defaultValue="LEAD" />
            <TextField
              label="Preferred Categories"
              name="preferredCategories"
              placeholder="Comedy, Lifestyle"
              hint="comma-separated, e.g. Comedy, Lifestyle"
              className="sm:col-span-2"
            />
            <TextareaField
              label="Notes"
              name="notes"
              rows={4}
              placeholder="Internal notes about this brand, relationship history, preferences…"
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
            <SubmitButton>Create Brand</SubmitButton>
            <LinkButton href="/brands" variant="secondary">Cancel</LinkButton>
          </div>
        </div>
      </form>
    </div>
  );
}
