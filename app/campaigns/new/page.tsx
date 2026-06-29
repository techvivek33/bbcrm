import { ArrowLeft, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createCampaign } from "@/lib/crud-actions";
import { PageHeader, LinkButton, EmptyState } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/Card";
import { TextField, TextareaField, SelectField, SubmitButton } from "@/components/ui/form";
import { CAMPAIGN_STAGES, CAMPAIGN_STAGE_ORDER } from "@/lib/enums";

export const dynamic = "force-dynamic";

const PLATFORM_OPTIONS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "MULTI", label: "Multi-platform" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "LINKEDIN", label: "LinkedIn" },
];

const STAGE_OPTIONS = CAMPAIGN_STAGE_ORDER.map(function (k) {
  return { value: k, label: CAMPAIGN_STAGES[k].label };
});

export default async function NewCampaignPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });

  const brandOptions = brands.map(function (b) {
    return { value: b.id, label: b.companyName };
  });

  return (
    <div>
      <PageHeader
        title="New Campaign"
        subtitle="Spin up a new influencer campaign and route it through the pipeline."
        actions={
          <LinkButton href="/campaigns" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to Campaigns
          </LinkButton>
        }
      />

      {brands.length === 0 ? (
        <Card>
          <div className="card-pad">
            <EmptyState
              icon={<Megaphone className="h-6 w-6" />}
              title="No brands yet"
              description="A campaign must belong to a brand. Add a brand first, then come back to launch a campaign."
            />
            <div className="mt-4 flex justify-center">
              <LinkButton href="/brands/new">Add a Brand</LinkButton>
            </div>
          </div>
        </Card>
      ) : (
        <form action={createCampaign}>
          <div className="space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader title="Campaign Overview" subtitle="The essentials" />
              <div className="card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Campaign Name"
                  name="name"
                  required
                  placeholder="Summer Launch 2026"
                  className="sm:col-span-2"
                />
                <SelectField
                  label="Brand"
                  name="brandId"
                  options={brandOptions}
                  required
                  hint="Which brand is this campaign for?"
                />
                <TextField
                  label="Budget"
                  name="budget"
                  type="number"
                  placeholder="500000"
                  hint="Total budget in INR"
                />
                <SelectField
                  label="Platform"
                  name="platform"
                  options={PLATFORM_OPTIONS}
                  defaultValue="INSTAGRAM"
                />
                <SelectField
                  label="Stage"
                  name="stage"
                  options={STAGE_OPTIONS}
                  defaultValue="DRAFT"
                  hint="Where it sits in the pipeline"
                />
                <TextField label="Start Date" name="startDate" type="date" />
                <TextField label="End Date" name="endDate" type="date" />
              </div>
            </Card>

            {/* Brief */}
            <Card>
              <CardHeader title="Brief & Requirements" subtitle="What does success look like?" />
              <div className="card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Target Audience"
                  name="targetAudience"
                  placeholder="Gen-Z, metro cities, 18–28"
                  className="sm:col-span-2"
                />
                <TextareaField
                  label="Creator Requirement"
                  name="creatorRequirement"
                  rows={3}
                  placeholder="5 lifestyle creators, 100k+ followers, 1 reel + 2 stories each."
                  className="sm:col-span-2"
                />
                <TextareaField
                  label="Description"
                  name="description"
                  rows={4}
                  placeholder="Campaign goals, deliverables, tone, do's and don'ts…"
                  className="sm:col-span-2"
                />
              </div>
            </Card>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3">
              <LinkButton href="/campaigns" variant="secondary">
                Cancel
              </LinkButton>
              <SubmitButton>
                <Megaphone className="h-4 w-4" /> Create Campaign
              </SubmitButton>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
