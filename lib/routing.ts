/** Where a user lands after login, based on their role. */
export function landingFor(role: string): string {
  if (role === "BRAND_POC") return "/portal/brand";
  if (role === "CREATOR") return "/portal/creator";
  return "/";
}
