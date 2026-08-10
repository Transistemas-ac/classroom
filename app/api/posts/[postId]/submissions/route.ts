import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";
import { getPagination, paginatedResponse } from "@/src/lib/pagination";

const createSubmissionSchema = z
  .object({
    body: z.string().max(5000).optional().nullable(),
    link: z.string().url().optional().nullable(),
    attachments: z.array(z.object({
      name: z.string().min(1).max(255),
      url: z.string().url(),
      mime_type: z.string().max(120).optional().nullable(),
      size: z.number().int().nonnegative().max(25_000_000).optional().nullable(),
    })).optional(),
  })
  .refine((v) => v.body || v.link, {
    message: "❌ Entregá un texto o un link",
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

    const post = await prisma.post.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!post) throw new HttpError(404, "❌ Post not found");

    const isStaff = await canManageCourse(authUser, post.course_id);
    const enrolled = await prisma.subscription.count({
      where: { user_id: authUser.id, course_id: post.course_id },
    });
    if (!isStaff && !enrolled) {
      return forbiddenResponse("❌ Forbidden: Not enrolled in the course");
    }
    if (!isStaff && (!post.is_published || (post.publish_at && post.publish_at > new Date()))) {
      return forbiddenResponse("❌ This post is not published yet");
    }

    const submissionWhere = {
        post_id: id,
        ...(isStaff ? {} : { user_id: authUser.id }),
      };
    const { requested, page, pageSize, skip } = getPagination(req);
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: submissionWhere,
        ...(requested ? { skip, take: pageSize } : {}),
      include: { user: true, attachments: true },
      orderBy: { submitted_at: "asc" },
      }),
      prisma.submission.count({ where: submissionWhere }),
    ]);

    const safeSubs = submissions.map((s) => ({
      ...s,
      user: sanitizeUser(s.user),
    }));

    if (isStaff) {
      const enrolledStudents = await prisma.subscription.findMany({
        where: { course_id: post.course_id, credentials: "student" },
        include: { user: true },
      });
      return NextResponse.json({
        submissions: requested ? paginatedResponse(safeSubs, page, pageSize, total) : safeSubs,
        students: enrolledStudents.map((s) => sanitizeUser(s.user)),
      });
    }

    return NextResponse.json({
      submissions: requested ? paginatedResponse(safeSubs, page, pageSize, total) : safeSubs,
      students: [],
    });
  }
);

export const POST = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { postId } = await ctx.params;
    const id = Number(postId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    if (authUser.credentials !== "student") {
      return forbiddenResponse("❌ Forbidden: Only students submit assignments");
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!post) throw new HttpError(404, "❌ Post not found");
    if (post.type !== "tarea") {
      throw new HttpError(400, "❌ This post is not an assignment");
    }

    const late = Boolean(post.due_date && post.due_date < new Date());
    const allowLate = post.allow_late_submissions ?? post.course.allow_late_submissions;
    if (late && !allowLate) {
      throw new HttpError(400, "❌ La fecha de entrega ya venció");
    }

    const enrolled = await prisma.subscription.count({
      where: { user_id: authUser.id, course_id: post.course_id },
    });
    if (!enrolled) {
      return forbiddenResponse("❌ Forbidden: Not enrolled in the course");
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createSubmissionSchema.parse(body);

    const existing = await prisma.submission.findUnique({
      where: { post_id_user_id: { post_id: id, user_id: authUser.id } },
    });
    if (existing?.graded_at) {
      return forbiddenResponse("❌ Forbidden: This submission was already graded");
    }

    const submission = await prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.submission.update({
            where: { id: existing.id },
            data: {
              body: parsed.body ?? null,
              link: parsed.link ?? null,
              late,
            },
          })
        : await tx.submission.create({
            data: {
              post_id: id,
              user_id: authUser.id,
              body: parsed.body ?? null,
              link: parsed.link ?? null,
              late,
              attachments: parsed.attachments?.length
                ? { create: parsed.attachments }
                : undefined,
            },
          });

      if (existing && parsed.attachments) {
        await tx.attachment.deleteMany({ where: { submission_id: saved.id } });
        if (parsed.attachments.length) {
          await tx.attachment.createMany({
            data: parsed.attachments.map((attachment) => ({
              ...attachment,
              submission_id: saved.id,
            })),
          });
        }
      }

      return tx.submission.findUnique({
        where: { id: saved.id },
        include: { attachments: true },
      });
    });

    await recordAudit({
      actorId: authUser.id,
      action: existing ? "submission.updated" : "submission.created",
      entityType: "submission",
      entityId: submission?.id,
      metadata: { postId: id, late },
    });

    return NextResponse.json(submission, { status: existing ? 200 : 201 });
  }
);
