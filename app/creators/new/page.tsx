import { ArrowLeft, UserPlus } from "lucide-react";
import { createCreator } from "@/lib/crud-actions";
import { PageHeader, LinkButton } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/Card";
import { TextField, TextareaField, SelectField, SubmitButton } from "@/components/ui/form";
import { CREATOR_STATUS, PLATFORMS, CREATOR_CATEGORIES } from "@/lib/enums";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const GST_OPTIONS = [
  { value: "REGISTERED", label: "Registered" },
  { value: "UNREGISTERED", label: "Unregistered" },
  { value: "NA", label: "N/A" },
];

const PLATFORM_OPTIONS = Object.entries(PLATFORMS).map(function (e) {
  return { value: e[0], label: e[1].label };
});

const STATUS_OPTIONS = Object.entries(CREATOR_STATUS).map(function (e) {
  return { value: e[0], label: e[1].label };
});

export default function NewCreatorPage() {
  return (
    <div>
      <PageHeader
        title="Add Creator"
        subtitle="Register a creator or submit an onboarding application — everything starts here."
        actions={
          <LinkButton href="/creators" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to Creators
          </LinkButton>
        }
      />

      <form action={createCreator}>
        <div className="space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader title="Profile" subtitle="Who is the creator?" />
            <div className="card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Name" name="name" required placeholder="Full name" />
              <TextField label="Email" name="email" type="email" placeholder="creator@email.com" />
              <TextField label="Phone" name="phone" placeholder="+91 98765 43210" />
              <SelectField label="Gender" name="gender" options={GENDER_OPTIONS} />
              <TextField label="City" name="city" placeholder="Mumbai" />
              <TextField label="State" name="state" placeholder="Maharashtra" />
              <TextField
                label="Languages"
                name="languages"
                hint="comma-separated"
                placeholder="Hindi, English"
              />
              <TextField
                label="Categories"
                name="categories"
                hint={"comma-separated; e.g. " + CREATOR_CATEGORIES.join(", ")}
                placeholder="Lifestyle, Fashion"
              />
              <TextareaField
                label="Bio"
                name="bio"
                rows={4}
                className="sm:col-span-2"
                placeholder="A short pitch about the creator, their niche, and standout work."
              />
            </div>
          </Card>

          {/* Audience & Pricing */}
          <Card>
            <CardHeader title="Audience & Pricing" subtitle="Reach, engagement and rate" />
            <div className="card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Primary Platform"
                name="platform"
                options={PLATFORM_OPTIONS}
                defaultValue="INSTAGRAM"
              />
              <TextField label="Handle" name="handle" placeholder="@handle" />
              <TextField label="Total Followers" name="totalFollowers" type="number" placeholder="0" />
              <TextField label="Avg. Views" name="avgViews" type="number" placeholder="0" />
              <TextField
                label="Engagement Rate"
                name="engagementRate"
                type="number"
                hint="percentage"
                placeholder="0"
              />
              <TextField
                label="Base Price"
                name="basePrice"
                type="number"
                hint="INR for one deliverable"
                placeholder="0"
              />
            </div>
          </Card>

          {/* Compliance & Status */}
          <Card>
            <CardHeader title="Compliance & Status" subtitle="Tax details and onboarding stage" />
            <div className="card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="GST Status" name="gstStatus" options={GST_OPTIONS} />
              <TextField label="PAN Number" name="panNumber" placeholder="ABCDE1234F" />
              <SelectField
                label="Status"
                name="status"
                options={STATUS_OPTIONS}
                defaultValue="PENDING"
                hint="Onboarding stage"
              />
            </div>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3">
            <LinkButton href="/creators" variant="secondary">
              Cancel
            </LinkButton>
            <SubmitButton>
              <UserPlus className="h-4 w-4" /> Create Creator
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
