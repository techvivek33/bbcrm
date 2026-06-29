"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// --- Notes (internal annotations, Module 17) --------------------------------
export async function addNote(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const user = await getCurrentUser();
  await prisma.note.create({
    data: {
      body,
      authorId: user?.id,
      brandId: (formData.get("brandId") as string) || null,
      creatorId: (formData.get("creatorId") as string) || null,
      campaignId: (formData.get("campaignId") as string) || null,
    },
  });
  revalidatePath(String(formData.get("revalidate") ?? "/"));
}

// --- Activity timeline (Modules 2, 3) ---------------------------------------
export async function logActivity(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "NOTE");
  if (!title) return;
  const user = await getCurrentUser();
  await prisma.activity.create({
    data: {
      type,
      title,
      body: (formData.get("body") as string) || null,
      userId: user?.id,
      brandId: (formData.get("brandId") as string) || null,
      creatorId: (formData.get("creatorId") as string) || null,
      campaignId: (formData.get("campaignId") as string) || null,
    },
  });
  revalidatePath(String(formData.get("revalidate") ?? "/"));
}

// --- Tasks (Module 6) -------------------------------------------------------
export async function updateTaskStatus(taskId: string, status: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}

// --- Campaign pipeline (Module 5) -------------------------------------------
export async function setCampaignStage(campaignId: string, stage: string) {
  await prisma.campaign.update({ where: { id: campaignId }, data: { stage } });
  const user = await getCurrentUser();
  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      title: `Campaign moved to ${stage.replace(/_/g, " ")}`,
      campaignId,
      userId: user?.id,
    },
  });
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/");
}

// --- Content approval workflow (Module 7) -----------------------------------
export async function reviewContent(
  submissionId: string,
  side: "INTERNAL" | "BRAND",
  decision: "APPROVED" | "REVISION" | "REJECTED",
  comment?: string,
) {
  const user = await getCurrentUser();
  await prisma.contentReview.create({
    data: { submissionId, side, decision, comment: comment || null, reviewerId: user?.id },
  });

  // Reflect the decision on the submission + parent deliverable.
  const submission = await prisma.contentSubmission.findUnique({
    where: { id: submissionId },
    include: { deliverable: true },
  });
  if (!submission) return;

  let subStatus = submission.status;
  let delStatus = submission.deliverable.status;
  if (decision === "REVISION") {
    subStatus = "REVISION_REQUESTED";
    delStatus = "REVISION";
  } else if (decision === "REJECTED") {
    subStatus = "REJECTED";
    delStatus = "REVISION";
  } else if (decision === "APPROVED") {
    if (side === "INTERNAL") {
      subStatus = "INTERNAL_APPROVED";
      delStatus = "BRAND_REVIEW";
    } else {
      subStatus = "BRAND_APPROVED";
      delStatus = "APPROVED";
    }
  }

  await prisma.contentSubmission.update({ where: { id: submissionId }, data: { status: subStatus } });
  await prisma.deliverable.update({ where: { id: submission.deliverableId }, data: { status: delStatus } });

  revalidatePath("/approvals");
  revalidatePath(`/campaigns/${submission.deliverable.campaignId}`);
  revalidatePath("/");
}
