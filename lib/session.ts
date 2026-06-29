import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export type SessionUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

async function loadUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { brand: true, creator: true },
  });
}

/** Current logged-in user from the signed session cookie, or null. */
export async function getCurrentUser() {
  const id = await getSessionUserId();
  if (!id) return null;
  const user = await loadUser(id);
  return user && user.active ? user : null;
}

/** All accounts, surfaced on the login screen for one-click demo sign-in. */
export async function listLoginAccounts() {
  return prisma.user.findMany({
    where: { active: true },
    orderBy: { role: "asc" },
    include: { brand: true, creator: true },
  });
}
