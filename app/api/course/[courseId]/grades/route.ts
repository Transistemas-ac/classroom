import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";

export const GET = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;
    const id = Number(courseId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const isStaff = await canManageCourse(authUser, id);
    const enrolled = await prisma.subscription.count({
      where: { user_id: authUser.id, course_id: id },
    });
    if (!isStaff && !enrolled) {
      return forbiddenResponse("❌ Forbidden: Not enrolled in the course");
    }

    const tareas = await prisma.post.findMany({
      where: { course_id: id, type: "tarea" },
      select: { id: true, title: true, due_date: true, max_score: true },
      orderBy: { created_at: "asc" },
    });

    if (!tareas.length) {
      return NextResponse.json({ tareas: [], students: [], submissions: [] });
    }

    const tareaIds = tareas.map((t) => t.id);

    if (!isStaff) {
      const submissions = await prisma.submission.findMany({
        where: { post_id: { in: tareaIds }, user_id: authUser.id },
      });
      return NextResponse.json({ tareas, students: [], submissions });
    }

    const [students, submissions] = await Promise.all([
      prisma.subscription.findMany({
        where: { course_id: id, credentials: "student" },
        include: { user: true },
      }),
      prisma.submission.findMany({
        where: { post_id: { in: tareaIds } },
        include: { user: true },
      }),
    ]);

    const safeStudents = students.map((s) => {
      const { password: _pw, ...user } = s.user;
      return user;
    });

    return NextResponse.json({
      tareas,
      students: safeStudents,
      submissions,
    });
  }
);
