import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";

const updateCourseSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    syllabus_url: z.string().url().optional().nullable(),
    subscription_url: z.string().url().optional().nullable(),
    status: z.enum(["active", "archived"]).optional(),
    allow_late_submissions: z.boolean().optional(),
    late_penalty_percent: z.number().int().min(0).max(100).optional().nullable(),
  })
  .strict();

export const GET = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;
    const id = Number(courseId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const canManage = await canManageCourse(authUser, id);
    const isEnrolled = authUser.courses.includes(id);

    const course = await prisma.course.findUnique({
      where: { id },
      include: { subscriptions: { include: { user: true } } },
    });
    if (!course) throw new HttpError(404, "❌ Course not found");

    const safeCourse = {
      ...course,
      enrolled: isEnrolled,
      can_manage: canManage,
      subscriptions: canManage
        ? course.subscriptions.map((s) => {
            if (s.user && typeof s.user === "object") {
              const { password: _pw, ...userWithoutPassword } =
                s.user as PrismaUser;
              return { ...s, user: userWithoutPassword };
            }
            return s;
          })
        : [],
    };

    return NextResponse.json(safeCourse);
  }
);

export const PUT = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;
    const id = Number(courseId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    if (!(await canManageCourse(authUser, id))) {
      return NextResponse.json(
        { success: false, message: "❌ Forbidden: Only admins and profes can edit courses" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateCourseSchema.parse(body);

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: parsed,
    });
    await recordAudit({
      actorId: authUser.id,
      action: "course.updated",
      entityType: "course",
      entityId: id,
      metadata: parsed,
    });
    return NextResponse.json(updatedCourse);
  }
);

export const DELETE = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;
    const id = Number(courseId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    if (!(await canManageCourse(authUser, id))) {
      return NextResponse.json(
        { success: false, message: "❌ Forbidden: Only admins and profes can delete courses" },
        { status: 403 }
      );
    }

    await prisma.course.delete({ where: { id } });
    await recordAudit({
      actorId: authUser.id,
      action: "course.deleted",
      entityType: "course",
      entityId: id,
    });
    return NextResponse.json({ message: "✅ Course deleted successfully" });
  }
);
