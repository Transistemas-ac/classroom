import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";
import { getAuthUser, unauthorizedResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";
import { getPagination, paginatedResponse } from "@/src/lib/pagination";

const createCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  syllabus_url: z.string().url().optional().nullable(),
  subscription_url: z.string().url().optional().nullable(),
  status: z.enum(["active", "archived"]).optional(),
  allow_late_submissions: z.boolean().optional(),
  late_penalty_percent: z.number().int().min(0).max(100).optional().nullable(),
});

export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { requested, page, pageSize, skip } = getPagination(req);
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      ...(requested ? { skip, take: pageSize } : {}),
      orderBy: { start_date: "desc" },
    }),
    prisma.course.count(),
  ]);

  if (!courses.length) {
    return NextResponse.json(requested ? paginatedResponse([], page, pageSize, total) : []);
  }

  const courseIds = courses.map((c) => c.id);

  const [tareas, subs, allSubmissions, managedMemberships] = await Promise.all([
    prisma.post.findMany({
      where: { course_id: { in: courseIds }, type: "tarea" },
      select: { id: true, course_id: true, due_date: true },
    }),
    prisma.subscription.findMany({
      where: { course_id: { in: courseIds } },
      select: { user_id: true, course_id: true, credentials: true },
    }),
    prisma.submission.findMany({
      where: { post: { course_id: { in: courseIds } } },
      select: { post_id: true, user_id: true, score: true },
    }),
    authUser.credentials === "admin"
      ? prisma.subscription.findMany({
          where: { course_id: { in: courseIds } },
          include: { user: true },
        })
      : prisma.subscription.findMany({
          where: {
            course_id: { in: courseIds },
            user_id: authUser.id,
            credentials: "teacher",
          },
          include: { user: true },
        }),
  ]);

  const now = new Date();

  const managedCourseIds = new Set(managedMemberships.map((membership) => membership.course_id));
  const tasksByCourse = new Map<number, typeof tareas>();
  const subscriptionsByCourse = new Map<number, typeof subs>();
  const submissionsByPost = new Map<number, typeof allSubmissions>();
  const managedSubscriptionsByCourse = new Map<number, typeof managedMemberships>();

  for (const task of tareas) {
    tasksByCourse.set(task.course_id, [...(tasksByCourse.get(task.course_id) ?? []), task]);
  }
  for (const subscription of subs) {
    subscriptionsByCourse.set(subscription.course_id, [...(subscriptionsByCourse.get(subscription.course_id) ?? []), subscription]);
  }
  for (const submission of allSubmissions) {
    submissionsByPost.set(submission.post_id, [...(submissionsByPost.get(submission.post_id) ?? []), submission]);
  }
  for (const membership of managedMemberships) {
    managedSubscriptionsByCourse.set(membership.course_id, [...(managedSubscriptionsByCourse.get(membership.course_id) ?? []), membership]);
  }

  const safeCourses = courses.map((course) => {
    const canManage = authUser.credentials === "admin" || managedCourseIds.has(course.id);
    const subscriptions = canManage
      ? (managedSubscriptionsByCourse.get(course.id) ?? []).map((s) => {
            if (s.user && typeof s.user === "object") {
            const { password: _pw, ...userWithoutPassword } =
              s.user as PrismaUser;
            return { ...s, user: userWithoutPassword };
          }
          return s;
        })
      : [];

    const courseTareas = tasksByCourse.get(course.id) ?? [];
    const futureTareas = courseTareas
      .filter((t) => t.due_date && t.due_date > now)
      .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1));

    const enrolledStudents = (subscriptionsByCourse.get(course.id) ?? []).filter(
      (s) => s.credentials === "student"
    );
    const courseSubmissions = courseTareas.flatMap((task) => submissionsByPost.get(task.id) ?? []);

    const pendingSubmissions =
      courseTareas.length * enrolledStudents.length - courseSubmissions.length;
    const pendingGrades = courseSubmissions.filter((s) => s.score === null).length;

    return {
      ...course,
      subscriptions,
      can_manage: canManage,
      enrolled: authUser.courses.includes(course.id),
      upcoming_due: futureTareas[0]?.due_date ?? null,
      pending_submissions: canManage ? Math.max(pendingSubmissions, 0) : null,
      pending_grades: canManage ? pendingGrades : null,
    };
  });

  return NextResponse.json(requested ? paginatedResponse(safeCourses, page, pageSize, total) : safeCourses);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  if (!["admin", "teacher"].includes(authUser.credentials)) {
    return NextResponse.json(
      { success: false, message: "❌ Forbidden: Only admins and profes can create courses" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createCourseSchema.parse(body);

  const savedCourse = await prisma.$transaction(async (tx) => {
    const saved = await tx.course.create({ data: parsed });
    if (authUser.credentials === "teacher") {
      await tx.subscription.create({
        data: {
          user_id: authUser.id,
          course_id: saved.id,
          credentials: "teacher",
        },
      });
    }
    return saved;
  });

  await recordAudit({
    actorId: authUser.id,
    action: "course.created",
    entityType: "course",
    entityId: savedCourse.id,
  });
  return NextResponse.json(savedCourse, { status: 201 });
});
