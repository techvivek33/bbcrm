// Single source of truth for the creator bulk-import spreadsheet: the column
// headers, example rows (used to generate the downloadable template), and the
// header-alias map (so the parser tolerates reasonable variations/casing).

export type ImportColumn = {
  header: string;
  key: string;
  ex1: string;
  ex2: string;
  note?: string;
};

export const IMPORT_COLUMNS: ImportColumn[] = [
  { header: "Name", key: "name", ex1: "Riya Sharma", ex2: "Arjun Mehta", note: "required" },
  { header: "Email", key: "email", ex1: "riya@example.com", ex2: "arjun@example.com", note: "used to skip duplicates" },
  { header: "Phone", key: "phone", ex1: "9876543210", ex2: "9812345678" },
  { header: "City", key: "city", ex1: "Mumbai", ex2: "Bengaluru" },
  { header: "State", key: "state", ex1: "Maharashtra", ex2: "Karnataka" },
  { header: "Gender", key: "gender", ex1: "FEMALE", ex2: "MALE", note: "MALE | FEMALE | OTHER" },
  { header: "Languages", key: "languages", ex1: "Hindi, English", ex2: "English, Kannada", note: "comma separated" },
  { header: "Categories", key: "categories", ex1: "Fashion, Lifestyle", ex2: "Tech, Gaming", note: "comma separated" },
  { header: "Followers", key: "followers", ex1: "250000", ex2: "500000", note: "number" },
  { header: "Avg Views", key: "avgViews", ex1: "40000", ex2: "90000", note: "number" },
  { header: "Engagement Rate %", key: "engagementRate", ex1: "5.2", ex2: "6.8", note: "number" },
  { header: "Base Price (INR)", key: "basePrice", ex1: "80000", ex2: "150000", note: "number" },
  { header: "Platform", key: "platform", ex1: "INSTAGRAM", ex2: "YOUTUBE", note: "primary handle platform" },
  { header: "Handle", key: "handle", ex1: "@riyasharma", ex2: "@arjunplays" },
  { header: "GST Status", key: "gstStatus", ex1: "UNREGISTERED", ex2: "REGISTERED", note: "REGISTERED | UNREGISTERED | NA" },
  { header: "PAN", key: "panNumber", ex1: "ABCDE1234F", ex2: "" },
  { header: "Status", key: "status", ex1: "APPROVED", ex2: "APPROVED", note: "default APPROVED" },
];

export const IMPORT_HEADERS = IMPORT_COLUMNS.map((c) => c.header);
export const IMPORT_EXAMPLE_ROWS = [
  IMPORT_COLUMNS.map((c) => c.ex1),
  IMPORT_COLUMNS.map((c) => c.ex2),
];

/** Normalize a header cell to a comparable token. */
export function normalizeKey(h: unknown): string {
  return String(h ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Accepted header variations -> canonical field key. */
export const KEY_ALIASES: Record<string, string> = {
  name: "name", fullname: "name", creatorname: "name",
  email: "email", emailid: "email", mail: "email",
  phone: "phone", mobile: "phone", contact: "phone", phonenumber: "phone",
  city: "city", state: "state",
  gender: "gender",
  language: "languages", languages: "languages", langs: "languages",
  category: "categories", categories: "categories", niche: "categories",
  followers: "followers", totalfollowers: "followers", follower: "followers", audience: "followers",
  avgviews: "avgViews", averageviews: "avgViews", views: "avgViews",
  engagementrate: "engagementRate", engagement: "engagementRate", er: "engagementRate", engagementratepercent: "engagementRate",
  baseprice: "basePrice", price: "basePrice", rate: "basePrice", cost: "basePrice", basepriceinr: "basePrice",
  platform: "platform", handle: "handle", username: "handle",
  gststatus: "gstStatus", gst: "gstStatus",
  pan: "panNumber", pannumber: "panNumber", pancard: "panNumber",
  status: "status",
};
