import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, type User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";

const updatePostSchema = z
  .object({
    type: z.enum(["anuncio", "tarea", "material"]).optional(),
    title: z.string().min(1).optional(),
    body: z.string().optional().nullable(),
    due_date: z.string().datetime().optional().nullable(),
    max_score: z.number().int().positive().max(1000).optional().nullable(),
    is_published: z.boolean().optional(),
    publish_at: z.string().datetime().optional().nullable(),
    allow_late_submissions: z.boolean().optional().nullable(),
    late_penalty_percent: z.number().int().min(0).max(100).optional().nullable(),
    rubric: z.array(z.object({
      title: z.string().min(1).max(120),
      description: z.string().max(500).optional().nullable(),
      points: z.number().int().positive().max(1000),
    })).optional().nullable(),
    attachments: z.array(z.object({
      name: z.string().min(1).max(255),
      url: z.string().url(),
      mime_type: z.string().max(120).optional().nullable(),
      size: z.number().int().nonnegative().max(25_000_000).optional().nullable(),
    })).optional(),
  })
  .strict();

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

    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: true, course: true, attachments: true },
    });
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

    return NextResponse.json({
      ...post,
      author: sanitizeUser(post.author),
      course: { id: post.course.id, title: post.course.title },
    });
  }
);

export const PUT = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { postId } = await ctx.params;
    const id = Number(postId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "❌ Post not found");
    if (!(await canManageCourse(authUser, post.course_id))) {
      return forbiddenResponse("❌ Forbidden: Only the course team can edit posts");
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updatePostSchema.parse(body);

    const { attachments, rubric, ...rest } = parsed;
    const postData = {
      ...rest,
      ...(rubric === undefined ? {} : { rubric: rubric ?? Prisma.JsonNull }),
    };
    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.post.update({
        where: { id },
        data: postData,
      });
      if (attachments) {
        await tx.attachment.deleteMany({ where: { post_id: id } });
        if (attachments.length) {
          await tx.attachment.createMany({
            data: attachments.map((attachment) => ({ ...attachment, post_id: id })),
          });
        }
      }
      return tx.post.findUnique({
        where: { id: saved.id },
        include: { attachments: true },
      });
    });
    await recordAudit({
      actorId: authUser.id,
      action: "post.updated",
      entityType: "post",
      entityId: id,
    });
    return NextResponse.json(updated);
  }
);

export const DELETE = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { postId } = await ctx.params;
    const id = Number(postId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "❌ Post not found");
    if (!(await canManageCourse(authUser, post.course_id))) {
      return forbiddenResponse("❌ Forbidden: Only the course team can delete posts");
    }

    await prisma.post.delete({ where: { id } });
    await recordAudit({
      actorId: authUser.id,
      action: "post.deleted",
      entityType: "post",
      entityId: id,
    });
    return NextResponse.json({ message: "✅ Post deleted" });
  }
);
