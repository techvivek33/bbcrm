// Single source of truth for the string "enums" used across the app:
// allowed values, human labels, and badge color tokens. Keeping these here
// means a status rename is one edit, and the UI stays consistent everywhere.

export type BadgeTone =
  | "gray"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "violet"
  | "cyan"
  | "pink";

type Meta = { label: string; tone: BadgeTone };

// ---- Roles (Module 15) -----------------------------------------------------
export const ROLES = {
  ADMIN: { label: "Admin", tone: "violet" },
  CAMPAIGN_MANAGER: { label: "Campaign Manager", tone: "blue" },
  TALENT_MANAGER: { label: "Talent Manager", tone: "amber" },
  FINANCE: { label: "Finance", tone: "green" },
  BRAND_POC: { label: "Brand POC", tone: "cyan" },
  CREATOR: { label: "Creator", tone: "pink" },
} as const satisfies Record<string, Meta>;
export type Role = keyof typeof ROLES;

// ---- Brand status ----------------------------------------------------------
export const BRAND_STATUS = {
  LEAD: { label: "Lead", tone: "amber" },
  ACTIVE: { label: "Active", tone: "green" },
  DORMANT: { label: "Dormant", tone: "gray" },
  CHURNED: { label: "Churned", tone: "red" },
} as const satisfies Record<string, Meta>;

// ---- Creator status (onboarding) -------------------------------------------
export const CREATOR_STATUS = {
  PENDING: { label: "Pending", tone: "gray" },
  IN_VERIFICATION: { label: "In Verification", tone: "amber" },
  APPROVED: { label: "Approved", tone: "green" },
  REJECTED: { label: "Rejected", tone: "red" },
} as const satisfies Record<string, Meta>;

// ---- Campaign pipeline stages (Module 5) -----------------------------------
export const CAMPAIGN_STAGES = {
  DRAFT: { label: "Draft", tone: "gray" },
  CREATOR_SELECTION: { label: "Creator Selection", tone: "violet" },
  BRAND_APPROVAL: { label: "Brand Approval", tone: "cyan" },
  CONTENT_PRODUCTION: { label: "Content Production", tone: "blue" },
  POSTING: { label: "Posting", tone: "amber" },
  REPORTING: { label: "Reporting", tone: "pink" },
  PAYMENT_CLOSURE: { label: "Payment Closure", tone: "green" },
  COMPLETED: { label: "Completed", tone: "green" },
} as const satisfies Record<string, Meta>;
export const CAMPAIGN_STAGE_ORDER = Object.keys(CAMPAIGN_STAGES) as Array<
  keyof typeof CAMPAIGN_STAGES
>;

// ---- Deliverable status ----------------------------------------------------
export const DELIVERABLE_STATUS = {
  PENDING: { label: "Pending", tone: "gray" },
  SUBMITTED: { label: "Submitted", tone: "blue" },
  INTERNAL_REVIEW: { label: "Internal Review", tone: "violet" },
  BRAND_REVIEW: { label: "Brand Review", tone: "cyan" },
  REVISION: { label: "Revision", tone: "amber" },
  APPROVED: { label: "Approved", tone: "green" },
  POSTED: { label: "Posted", tone: "green" },
} as const satisfies Record<string, Meta>;

// ---- Task status & priority (Module 6) -------------------------------------
export const TASK_STATUS = {
  PENDING: { label: "Pending", tone: "gray" },
  IN_PROGRESS: { label: "In Progress", tone: "blue" },
  WAITING_APPROVAL: { label: "Waiting Approval", tone: "amber" },
  COMPLETED: { label: "Completed", tone: "green" },
  OVERDUE: { label: "Overdue", tone: "red" },
} as const satisfies Record<string, Meta>;
export const TASK_STATUS_ORDER = Object.keys(TASK_STATUS) as Array<keyof typeof TASK_STATUS>;

export const TASK_PRIORITY = {
  LOW: { label: "Low", tone: "gray" },
  MEDIUM: { label: "Medium", tone: "blue" },
  HIGH: { label: "High", tone: "amber" },
  URGENT: { label: "Urgent", tone: "red" },
} as const satisfies Record<string, Meta>;

// ---- Payment status (Modules 11, 12) ---------------------------------------
export const PAYMENT_STATUS = {
  PENDING: { label: "Pending", tone: "amber" },
  PARTIAL: { label: "Partial", tone: "blue" },
  PAID: { label: "Paid", tone: "green" },
  OVERDUE: { label: "Overdue", tone: "red" },
} as const satisfies Record<string, Meta>;

export const INVOICE_STATUS = {
  DRAFT: { label: "Draft", tone: "gray" },
  SENT: { label: "Sent", tone: "blue" },
  PAID: { label: "Paid", tone: "green" },
  OVERDUE: { label: "Overdue", tone: "red" },
  CANCELLED: { label: "Cancelled", tone: "gray" },
} as const satisfies Record<string, Meta>;

// ---- Contracts (Module 13) -------------------------------------------------
export const CONTRACT_STATUS = {
  DRAFT: { label: "Draft", tone: "gray" },
  SENT: { label: "Sent", tone: "blue" },
  SIGNED: { label: "Signed", tone: "green" },
  EXPIRED: { label: "Expired", tone: "red" },
} as const satisfies Record<string, Meta>;

// ---- Activity types (Modules 2, 3) -----------------------------------------
export const ACTIVITY_TYPE = {
  EMAIL: { label: "Email", tone: "blue" },
  CALL: { label: "Call", tone: "violet" },
  MEETING: { label: "Meeting", tone: "cyan" },
  WHATSAPP: { label: "WhatsApp", tone: "green" },
  PROPOSAL: { label: "Proposal", tone: "amber" },
  CAMPAIGN_LAUNCH: { label: "Campaign Launch", tone: "pink" },
  PAYMENT: { label: "Payment", tone: "green" },
  NOTE: { label: "Note", tone: "gray" },
  STATUS_CHANGE: { label: "Status Change", tone: "gray" },
  DOCUMENT: { label: "Document", tone: "blue" },
} as const satisfies Record<string, Meta>;

// ---- Creator categories (Module 8 discovery filters) -----------------------
export const CREATOR_CATEGORIES = [
  "Gaming",
  "Comedy",
  "Lifestyle",
  "Finance",
  "Tech",
  "Fashion",
  "Food",
  "Fitness",
  "Travel",
  "Beauty",
  "Education",
  "Regional",
] as const;

export const PLATFORMS = {
  INSTAGRAM: { label: "Instagram", tone: "pink" },
  YOUTUBE: { label: "YouTube", tone: "red" },
  FACEBOOK: { label: "Facebook", tone: "blue" },
  MOJ: { label: "Moj", tone: "violet" },
  JOSH: { label: "Josh", tone: "amber" },
  SNAPCHAT: { label: "Snapchat", tone: "amber" },
  LINKEDIN: { label: "LinkedIn", tone: "cyan" },
} as const satisfies Record<string, Meta>;

// ---- Lookup helper ---------------------------------------------------------
type EnumMap = Record<string, Meta>;
export function meta(map: EnumMap, key: string | null | undefined): Meta {
  if (!key) return { label: "—", tone: "gray" };
  return map[key] ?? { label: key.replace(/_/g, " "), tone: "gray" };
}
