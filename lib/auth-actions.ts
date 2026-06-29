"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, destroySession } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { landingFor } from "@/lib/routing";

export type LoginState = { error?: string };

/** Authenticate by email + password and start a session. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return { error: "No active account for that email." };
  if (!verifyPassword(password, user.passwordHash)) return { error: "Incorrect password." };

  await createSession(user.id);
  redirect(landingFor(user.role));
}

/** One-click demo sign-in (no password) used by the login screen chips. */
export async function quickLogin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) return;
  await createSession(user.id);
  redirect(landingFor(user.role));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/** Admins can hop into any account to preview its experience. */
export async function switchUser(userId: string) {
  const current = await getCurrentUser();
  if (current?.role !== "ADMIN") return;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target?.active) return;
  await createSession(target.id);
  redirect(landingFor(target.role));
}
