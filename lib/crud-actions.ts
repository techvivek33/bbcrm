"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { stringifyList } from "@/lib/serialize";

// --- helpers ----------------------------------------------------------------
const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
};
const reqStr = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => {
  const n = parseInt(String(fd.get(k) ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
};
const list = (fd: FormData, k: string) =>
  String(fd.get(k) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const date = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v ? new Date(v) : null;
};
// Accept either a single field "creatorIds" (comma list) or repeated checkboxes.
const ids = (fd: FormData, k: string) => {
  const all = fd.getAll(k).flatMap((v) => String(v).split(",")).map((s) => s.trim()).filter(Boolean);
  return Array.from(new Set(all));
};

// --- Brand (Module 2) -------------------------------------------------------
export async function createBrand(fd: FormData) {
  const b = await prisma.brand.create({
    data: {
      companyName: reqStr(fd, "companyName"),
      industry: str(fd, "industry"),
      website: str(fd, "website"),
      logoColor: str(fd, "logoColor") ?? "#0ea5e9",
      contactPerson: str(fd, "contactPerson"),
      designation: str(fd, "designation"),
      email: str(fd, "email"),
      phone: str(fd, "phone"),
      linkedin: str(fd, "linkedin"),
      preferredCategories: stringifyList(list(fd, "preferredCategories")),
      budgetRangeMin: num(fd, "budgetRangeMin") || null,
      budgetRangeMax: num(fd, "budgetRangeMax") || null,
      paymentTerms: str(fd, "paymentTerms"),
      notes: str(fd, "notes"),
      status: str(fd, "status") ?? "LEAD",
    },
  });
  revalidatePath("/brands");
  redirect(`/brands/${b.id}`);
}

// --- Creator (Modules 3, 4) -------------------------------------------------
export async function createCreator(fd: FormData) {
  const followers = num(fd, "totalFollowers");
  const base = num(fd, "basePrice") || null;
  const platform = str(fd, "platform") ?? "INSTAGRAM";
  const handle = str(fd, "handle");
  const c = await prisma.creator.create({
    data: {
      name: reqStr(fd, "name"),
      email: str(fd, "email"),
      phone: str(fd, "phone"),
      avatarColor: str(fd, "avatarColor") ?? "#f59e0b",
      city: str(fd, "city"),
      state: str(fd, "state"),
      location: [str(fd, "city"), str(fd, "state")].filter(Boolean).join(", ") || null,
      gender: str(fd, "gender"),
      languages: stringifyList(list(fd, "languages")),
      categories: stringifyList(list(fd, "categories")),
      bio: str(fd, "bio"),
      totalFollowers: followers,
      avgViews: num(fd, "avgViews"),
      engagementRate: parseFloat(String(fd.get("engagementRate") ?? "0")) || 0,
      basePrice: base,
      priceList: base ? JSON.stringify({ reel: base, story: Math.round(base * 0.4), video: Math.round(base * 1.6), post: Math.round(base * 0.8) }) : null,
      gstStatus: str(fd, "gstStatus"),
      panNumber: str(fd, "panNumber"),
      gstNumber: str(fd, "gstNumber"),
      bankName: str(fd, "bankName"),
      bankAccount: str(fd, "bankAccount"),
      bankIfsc: str(fd, "bankIfsc"),
      status: str(fd, "status") ?? "PENDING",
      onboardingStep: 1,
      ...(handle
        ? { socials: { create: [{ platform, handle, url: `https://${platform.toLowerCase()}.com/${handle.replace("@", "")}`, followers, avgViews: num(fd, "avgViews"), engagementRate: parseFloat(String(fd.get("engagementRate") ?? "0")) || 0 }] } }
        : {}),
    },
  });
  revalidatePath("/creators");
  revalidatePath("/onboarding");
  const dest = str(fd, "redirect");
  redirect(dest ?? `/creators/${c.id}`);
}

/** Onboarding approve / reject / move to verification (Module 4). */
export async function updateCreatorStatus(creatorId: string, status: string) {
  await prisma.creator.update({
    where: { id: creatorId },
    data: { status, onboardingStep: status === "APPROVED" ? 4 : status === "IN_VERIFICATION" ? 3 : 1 },
  });
  const user = await getCurrentUser();
  await prisma.activity.create({
    data: { type: "STATUS_CHANGE", title: `Onboarding status → ${status.replace(/_/g, " ")}`, creatorId, userId: user?.id },
  });
  revalidatePath("/onboarding");
  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/creators");
}

// --- Campaign (Module 5) ----------------------------------------------------
export async function createCampaign(fd: FormData) {
  const c = await prisma.campaign.create({
    data: {
      name: reqStr(fd, "name"),
      brandId: reqStr(fd, "brandId"),
      budget: num(fd, "budget"),
      platform: str(fd, "platform"),
      targetAudience: str(fd, "targetAudience"),
      creatorRequirement: str(fd, "creatorRequirement"),
      description: str(fd, "description"),
      stage: str(fd, "stage") ?? "DRAFT",
      startDate: date(fd, "startDate"),
      endDate: date(fd, "endDate"),
    },
  });
  revalidatePath("/campaigns");
  redirect(`/campaigns/${c.id}`);
}

// --- Task (Module 6) --------------------------------------------------------
export async function createTask(fd: FormData) {
  await prisma.task.create({
    data: {
      title: reqStr(fd, "title"),
      description: str(fd, "description"),
      type: str(fd, "type") ?? "OTHER",
      status: str(fd, "status") ?? "PENDING",
      priority: str(fd, "priority") ?? "MEDIUM",
      dueDate: date(fd, "dueDate"),
      campaignId: str(fd, "campaignId"),
      assigneeId: str(fd, "assigneeId"),
    },
  });
  revalidatePath("/tasks");
  redirect("/tasks");
}

// --- Invoice (Module 12) ----------------------------------------------------
export async function createInvoice(fd: FormData) {
  const amount = num(fd, "amount");
  const taxRate = parseFloat(String(fd.get("taxRate") ?? "18")) || 0;
  const taxAmount = Math.round((amount * taxRate) / 100);
  const count = await prisma.invoice.count();
  const number = `INV-2026-${String(count + 15).padStart(4, "0")}`;
  const inv = await prisma.invoice.create({
    data: {
      number,
      type: str(fd, "type") ?? "BRAND",
      status: str(fd, "status") ?? "DRAFT",
      amount,
      taxRate,
      taxAmount,
      total: amount + taxAmount,
      items: JSON.stringify([{ desc: str(fd, "lineItem") ?? "Services", qty: 1, rate: amount }]),
      issuedDate: date(fd, "issuedDate") ?? new Date(),
      dueDate: date(fd, "dueDate"),
      brandId: str(fd, "brandId"),
      creatorId: str(fd, "creatorId"),
      campaignId: str(fd, "campaignId"),
    },
  });
  revalidatePath("/invoices");
  redirect(`/invoices/${inv.id}`);
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
}

// --- Contract (Module 13) ---------------------------------------------------
export async function createContract(fd: FormData) {
  const ct = await prisma.contract.create({
    data: {
      title: reqStr(fd, "title"),
      type: str(fd, "type") ?? "BRAND",
      status: str(fd, "status") ?? "DRAFT",
      brandId: str(fd, "brandId"),
      creatorId: str(fd, "creatorId"),
      campaignId: str(fd, "campaignId"),
      expiryDate: date(fd, "expiryDate"),
      renewalReminderDate: date(fd, "renewalReminderDate"),
    },
  });
  revalidatePath("/contracts");
  redirect(`/contracts/${ct.id}`);
}

export async function updateContractStatus(contractId: string, status: string) {
  await prisma.contract.update({
    where: { id: contractId },
    data: { status, signedDate: status === "SIGNED" ? new Date() : undefined },
  });
  revalidatePath("/contracts");
  revalidatePath(`/contracts/${contractId}`);
}

// --- Knowledge Center (Module 16) -------------------------------------------
export async function createKnowledgeAsset(fd: FormData) {
  await prisma.knowledgeAsset.create({
    data: {
      title: reqStr(fd, "title"),
      category: str(fd, "category") ?? "OTHER",
      url: str(fd, "url"),
      tags: stringifyList(list(fd, "tags")),
    },
  });
  revalidatePath("/knowledge");
  redirect("/knowledge");
}

// --- Proposal Builder (Module 9) --------------------------------------------
export async function createProposal(fd: FormData) {
  const creatorIds = ids(fd, "creatorIds");
  const creators = creatorIds.length
    ? await prisma.creator.findMany({ where: { id: { in: creatorIds } } })
    : [];
  const p = await prisma.proposal.create({
    data: {
      title: reqStr(fd, "title"),
      brandId: str(fd, "brandId"),
      budget: num(fd, "budget"),
      brief: str(fd, "brief"),
      audience: str(fd, "audience"),
      status: "DRAFT",
      items: {
        create: creators.map((c) => ({
          creatorId: c.id,
          proposedAmount: c.basePrice ?? 0,
          deliverable: "1 Reel + 2 Stories",
          // simple deterministic AI Fit Score from engagement + reach
          fitScore: Math.min(99, Math.round(50 + c.engagementRate * 3 + Math.min(30, c.totalFollowers / 200000))),
        })),
      },
    },
  });
  revalidatePath("/proposals");
  redirect(`/proposals/${p.id}`);
}

export async function updateProposalStatus(proposalId: string, status: string) {
  await prisma.proposal.update({ where: { id: proposalId }, data: { status } });
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
}

/** Generate an unguessable public share link for a proposal (idempotent). */
export async function enableProposalShare(proposalId: string) {
  const existing = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { publicId: true, status: true },
  });
  if (!existing) return;
  const publicId = existing.publicId ?? randomBytes(9).toString("base64url");
  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      publicId,
      // Sharing implies the proposal has left Draft.
      status: existing.status === "DRAFT" ? "SHARED" : existing.status,
    },
  });
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
}

/** Revoke the public link — old URLs stop working immediately. */
export async function disableProposalShare(proposalId: string) {
  await prisma.proposal.update({ where: { id: proposalId }, data: { publicId: null } });
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
}

// --- Payments (Module 11) ---------------------------------------------------
export async function recordPayment(paymentId: string, amount: number) {
  const p = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!p) return;
  const paid = Math.min(p.agreedAmount, p.paidAmount + amount);
  const status = paid >= p.agreedAmount ? "PAID" : paid > 0 ? "PARTIAL" : p.status;
  await prisma.payment.update({
    where: { id: paymentId },
    data: { paidAmount: paid, status, paidDate: status === "PAID" ? new Date() : p.paidDate },
  });
  revalidatePath("/payments");
  revalidatePath("/");
}
