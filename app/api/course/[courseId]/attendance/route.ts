import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, isEnrolled, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";

const sessionSchema = z.object({
  title: z.string().min(1).max(180),
  session_at: z.string().datetime(),
});

export const GET = apiHandler(async (req: NextRequest, ctx) => {
  const { courseId } = await ctx.params;
  const id = Number(courseId);
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  const canManage = await canManageCourse(authUser, id);
  if (!canManage && !(await isEnrolled(authUser.id, id))) {
    return forbiddenResponse("❌ Forbidden: Not enrolled in the course");
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: { course_id: id },
    orderBy: { session_at: "desc" },
    include: {
      records: canManage
        ? { include: { user: true }, orderBy: { user_id: "asc" } }
        : { where: { user_id: authUser.id }, include: { user: true } },
    },
  });
  return NextResponse.json(sessions);
});

export const POST = apiHandler(async (req: NextRequest, ctx) => {
  const { courseId } = await ctx.params;
  const id = Number(courseId);
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  if (!(await canManageCourse(authUser, id))) {
    return forbiddenResponse("❌ Only the course team can manage attendance");
  }

  const parsed = sessionSchema.parse(await req.json().catch(() => ({})));
  const students = await prisma.subscription.findMany({
    where: { course_id: id, credentials: "student" },
    select: { user_id: true },
  });
  const session = await prisma.attendanceSession.create({
    data: {
      course_id: id,
      author_id: authUser.id,
      title: parsed.title,
      session_at: parsed.session_at,
      records: { create: students.map((student) => ({ user_id: student.user_id })) },
    },
    include: { records: true },
  });
  await recordAudit({ actorId: authUser.id, action: "attendance_session.created", entityType: "attendance_session", entityId: session.id });
  return NextResponse.json(session, { status: 201 });
});
