import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  isEnrolled,
  canManageCourse,
} from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";
import { sendUsersEmail } from "@/src/lib/email";
import { getPagination, paginatedResponse } from "@/src/lib/pagination";

const createPostSchema = z.object({
  type: z.enum(["anuncio", "tarea", "material"]),
  title: z.string().min(1),
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
});

const sanitizeUser = (user: PrismaUser | null) => {
  if (!user) return null;
  const { password: _pw, ...rest } = user;
  return rest;
};

export const GET = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;
    const id = Number(courseId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const canManage = await canManageCourse(authUser, id);
    if (!canManage && !(await isEnrolled(authUser.id, id))) {
      return forbiddenResponse("❌ Forbidden: Not enrolled in the course");
    }

    const where = {
        course_id: id,
        ...(canManage
          ? {}
          : {
              is_published: true,
              OR: [{ publish_at: null }, { publish_at: { lte: new Date() } }],
            }),
      };
    const { requested, page, pageSize, skip } = getPagination(req);
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        ...(requested ? { skip, take: pageSize } : {}),
      orderBy: { created_at: "desc" },
      include: {
        author: true,
        attachments: true,
        _count: { select: { comments: true, submissions: true } },
      },
      }),
      prisma.post.count({ where }),
    ]);

    const safePosts = posts.map((p) => {
      const { author, _count, ...post } = p;
      return { ...post, author: sanitizeUser(author), _count };
    });

    return NextResponse.json(requested ? paginatedResponse(safePosts, page, pageSize, total) : safePosts);
  }
);

export const POST = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;
    const id = Number(courseId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    if (!(await canManageCourse(authUser, id))) {
      return forbiddenResponse("❌ Forbidden: Only profes and admins can post");
    }

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw new HttpError(404, "❌ Course not found");

    const body = await req.json().catch(() => ({}));
    const parsed = createPostSchema.parse(body);

    const data = {
      course_id: id,
      author_id: authUser.id,
      type: parsed.type,
      title: parsed.title,
      body: parsed.body ?? null,
      is_published: parsed.is_published ?? true,
      publish_at: parsed.publish_at ?? null,
      allow_late_submissions: parsed.allow_late_submissions ?? null,
      late_penalty_percent: parsed.late_penalty_percent ?? null,
      rubric: parsed.rubric ?? undefined,
      ...(parsed.type === "tarea"
        ? {
            due_date: parsed.due_date ?? null,
            max_score: parsed.max_score ?? null,
          }
        : {}),
    };

    const post = await prisma.post.create({
      data: {
        ...data,
        attachments: parsed.attachments?.length
          ? { create: parsed.attachments }
          : undefined,
      },
      include: { attachments: true },
    });
    await recordAudit({
      actorId: authUser.id,
      action: "post.created",
      entityType: "post",
      entityId: post.id,
      metadata: { courseId: id, type: post.type },
    });
    if (post.is_published) {
      const students = await prisma.subscription.findMany({
        where: {
          course_id: id,
          credentials: "student",
          user_id: { not: authUser.id },
        },
        select: { user_id: true },
      });
      await sendUsersEmail({
        userIds: students.map((student) => student.user_id),
        kind: `post_${post.type}`,
        subject: `${post.type === "tarea" ? "Nueva tarea" : "Nuevo contenido"}: ${post.title}`,
        title: post.title,
        body: post.body ?? "Hay nuevo contenido disponible en tu curso.",
        link: `${process.env.APP_URL ?? ""}/course/${id}`,
      });
    }
    return NextResponse.json(post, { status: 201 });
  }
);
