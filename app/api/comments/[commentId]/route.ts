import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";

export const DELETE = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { commentId } = await ctx.params;
    const id = Number(commentId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new HttpError(404, "❌ Comment not found");

    const post = await prisma.post.findUnique({ where: { id: comment.post_id } });
    const canManage = post ? await canManageCourse(authUser, post.course_id) : false;
    if (!canManage && comment.user_id !== authUser.id) {
      return forbiddenResponse("❌ Forbidden: You can only delete your own comments");
    }

    await prisma.comment.delete({ where: { id } });
    await recordAudit({
      actorId: authUser.id,
      action: "comment.deleted",
      entityType: "comment",
      entityId: id,
    });
    return NextResponse.json({ message: "✅ Comment deleted" });
  }
);
