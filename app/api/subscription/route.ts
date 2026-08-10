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

const createSubscriptionSchema = z.object({
  userId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  credentials: z.enum(["teacher", "student"]).optional(),
});

export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const where =
    authUser.credentials === "admin"
      ? undefined
      : authUser.credentials === "teacher"
        ? { course_id: { in: authUser.taughtCourses } }
        : { user_id: authUser.id };

  const { requested, page, pageSize, skip } = getPagination(req);
  const [subs, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      ...(requested ? { skip, take: pageSize } : {}),
      include: {
        course: true,
        user: true,
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  const safeSubs = subs.map((s) => {
    if (s.user && typeof s.user === "object") {
      const { password: _pw, ...userWithoutPassword } = s.user as PrismaUser;
      return { ...s, user: userWithoutPassword };
    }
    return s;
  });

  return NextResponse.json(requested ? paginatedResponse(safeSubs, page, pageSize, total) : safeSubs);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const parsed = createSubscriptionSchema.parse(body);

  const canManage = await canManageCourse(authUser, parsed.courseId);
  const canSelfAssignAsTeacher =
    authUser.credentials === "teacher" &&
    parsed.userId === authUser.id &&
    parsed.credentials === "teacher";

  if (!canManage && !canSelfAssignAsTeacher && parsed.userId !== authUser.id) {
    return forbiddenResponse("❌ Forbidden: Students can only enroll themselves");
  }
  if (!canManage && !canSelfAssignAsTeacher && parsed.credentials !== undefined) {
    return forbiddenResponse("❌ Forbidden: Students cannot assign roles");
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.courseId },
  });
  if (!course) throw new HttpError(404, "❌ Course not found");
  if (course.status === "archived") {
    return forbiddenResponse("❌ Este curso está archivado");
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
  });
  if (!user) throw new HttpError(404, "❌ User not found");
  if (parsed.credentials === "teacher" && user.credentials !== "teacher") {
    return forbiddenResponse("❌ Solo las cuentas profe pueden tener una inscripción profe");
  }

  try {
    const relation = await prisma.subscription.create({
      data: {
        user_id: parsed.userId,
        course_id: parsed.courseId,
        credentials: canManage || canSelfAssignAsTeacher
          ? (parsed.credentials ?? "student")
          : "student",
      },
    });
    await recordAudit({
      actorId: authUser.id,
      action: "subscription.created",
      entityType: "subscription",
      metadata: parsed,
    });
    if (parsed.userId !== authUser.id) {
      await sendUserEmail({
        userId: parsed.userId,
        kind: "course_enrollment",
        subject: `Te inscribieron en ${course.title}`,
        title: `Nueva inscripción: ${course.title}`,
        body: "Ya podés entrar al aula y ver el contenido del curso.",
        link: `${process.env.APP_URL ?? ""}/course/${course.id}`,
      });
    }
    return NextResponse.json(relation, { status: 201 });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { message: "❌ Conflict: User is already enrolled in this course" },
        { status: 409 }
      );
    }
    throw err;
  }
});

const deleteSubscriptionSchema = z.object({
  userId: z.number().int().positive(),
  courseId: z.number().int().positive(),
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const parsed = deleteSubscriptionSchema.parse(body);

  const canManage = await canManageCourse(authUser, parsed.courseId);
  if (!canManage && parsed.userId !== authUser.id) {
    return forbiddenResponse("❌ Forbidden: Students can only unsubscribe themselves");
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.courseId },
  });
  if (!course) throw new HttpError(404, "❌ Course not found");

  try {
    await prisma.subscription.delete({
      where: {
        user_id_course_id: {
          user_id: parsed.userId,
          course_id: parsed.courseId,
        },
      },
    });

    await recordAudit({
      actorId: authUser.id,
      action: "subscription.deleted",
      entityType: "subscription",
      metadata: parsed,
    });

    return NextResponse.json({ message: "✅ User removed from course" });
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { message: "🚫 Not Found: Subscription does not exist" },
        { status: 404 }
      );
    }
    throw err;
  }
});
