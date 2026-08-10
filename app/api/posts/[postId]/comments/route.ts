import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";
import { sendUserEmail } from "@/src/lib/email";
import { getPagination, paginatedResponse } from "@/src/lib/pagination";

const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
});

const sanitizeUser = (user: PrismaUser | null) => {
  if (!user) return null;
  const { password: _pw, ...rest } = user;
  return rest;
};

export const GET = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { postId } = await ctx.params;
    const id = Number(postId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "❌ Post not found");

    const canManage = await canManageCourse(authUser, post.course_id);
    const enrolled = await prisma.subscription.count({
      where: { user_id: authUser.id, course_id: post.course_id },
    });
    if (!canManage && !enrolled) {
      return forbiddenResponse("❌ Forbidden: Not enrolled in the course");
    }
    if (!canManage && (!post.is_published || (post.publish_at && post.publish_at > new Date()))) {
      return forbiddenResponse("❌ This post is not published yet");
    }

    const { requested, page, pageSize, skip } = getPagination(req);
    const where = { post_id: id };
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        ...(requested ? { skip, take: pageSize } : {}),
      orderBy: { created_at: "asc" },
      include: { user: true },
      }),
      prisma.comment.count({ where }),
    ]);

    const safeComments = comments.map((c) => ({ ...c, user: sanitizeUser(c.user) }));
    return NextResponse.json(requested ? paginatedResponse(safeComments, page, pageSize, total) : safeComments);
  }
);

export const POST = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { postId } = await ctx.params;
    const id = Number(postId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "❌ Post not found");

    const canManage = await canManageCourse(authUser, post.course_id);
    const enrolled = await prisma.subscription.count({
      where: { user_id: authUser.id, course_id: post.course_id },
    });
    if (!canManage && !enrolled) {
      return forbiddenResponse("❌ Forbidden: Not enrolled in the course");
    }
    if (!canManage && (!post.is_published || (post.publish_at && post.publish_at > new Date()))) {
      return forbiddenResponse("❌ This post is not published yet");
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createCommentSchema.parse(body);

    const comment = await prisma.comment.create({
      data: { post_id: id, user_id: authUser.id, body: parsed.body },
      include: { user: true },
    });
    await recordAudit({
      actorId: authUser.id,
      action: "comment.created",
      entityType: "comment",
      entityId: comment.id,
      metadata: { postId: id },
    });
    if (post.author_id !== authUser.id) {
      await sendUserEmail({
        userId: post.author_id,
        kind: "comment_created",
        subject: "Nuevo comentario en tu publicación",
        title: "Alguien comentó tu publicación",
        body: parsed.body,
        link: `${process.env.APP_URL ?? ""}/course/${post.course_id}`,
      });
    }

    return NextResponse.json(
      { ...comment, user: sanitizeUser(comment.user) },
      { status: 201 }
    );
  }
);
