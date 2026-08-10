import prisma from "./prisma";

export async function recordAudit(input: {
  actorId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  metadata?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actor_id: input.actorId,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId,
        metadata: input.metadata as object | undefined,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
