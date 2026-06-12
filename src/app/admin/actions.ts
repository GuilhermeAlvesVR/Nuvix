"use server";

import { WorkspaceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/session";
import { PLATFORM_WORKSPACE_SLUG } from "@/lib/workspace";

function statusDate(status: WorkspaceStatus) {
  const now = new Date();
  if (status === "ACTIVE") return { approvedAt: now };
  if (status === "SUSPENDED") return { suspendedAt: now };
  if (status === "REJECTED") return { rejectedAt: now };
  return {};
}

async function updateWorkspaceStatus(formData: FormData, status: WorkspaceStatus) {
  const user = await requirePlatformAdmin();
  const workspaceId = formData.get("workspaceId");
  if (typeof workspaceId !== "string" || !workspaceId) redirect("/admin?error=workspace-invalido");

  const workspace = await prisma.workspace.findUnique({
    select: { slug: true },
    where: { id: workspaceId }
  });
  if (!workspace || workspace.slug === PLATFORM_WORKSPACE_SLUG) redirect("/admin?error=workspace-invalido");

  await prisma.workspace.update({ data: { status, ...statusDate(status) }, where: { id: workspaceId } });
  await prisma.auditLog.create({ data: { workspaceId, userId: user.id, entityName: "Workspace", entityId: workspaceId, action: `PLATFORM_WORKSPACE_${status}` } });
  revalidatePath("/admin");
  redirect(`/admin?saved=${status.toLowerCase()}`);
}

export async function approveWorkspace(formData: FormData) { await updateWorkspaceStatus(formData, "ACTIVE"); }
export async function rejectWorkspace(formData: FormData) { await updateWorkspaceStatus(formData, "REJECTED"); }
export async function suspendWorkspace(formData: FormData) { await updateWorkspaceStatus(formData, "SUSPENDED"); }
export async function reactivateWorkspace(formData: FormData) { await updateWorkspaceStatus(formData, "ACTIVE"); }

export async function deleteWorkspace(formData: FormData) {
  const user = await requirePlatformAdmin();
  const workspaceId = formData.get("workspaceId");
  if (typeof workspaceId !== "string" || !workspaceId) redirect("/admin?error=workspace-invalido");

  const ws = await prisma.workspace.findUnique({ select: { slug: true, name: true }, where: { id: workspaceId } });
  if (!ws || ws.slug === PLATFORM_WORKSPACE_SLUG) redirect("/admin?error=workspace-invalido");

  await prisma.auditLog.create({ data: { workspaceId: user.workspaceId, userId: user.id, entityName: "Workspace", entityId: workspaceId, action: "PLATFORM_WORKSPACE_DELETED", metadataJson: { name: ws.name, slug: ws.slug, targetWorkspaceId: workspaceId } } });
  await prisma.workspace.delete({ where: { id: workspaceId } });
  revalidatePath("/admin");
  redirect("/admin?saved=excluida");
}
