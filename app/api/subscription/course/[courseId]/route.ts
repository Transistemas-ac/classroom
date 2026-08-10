import { NextRequest, NextResponse } from "next/server";
import type { User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";
import { canManageCourse, getAuthUser, unauthorizedResponse } from "@/src/lib/auth";

export const GET = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;
    const courseIdNum = Number(courseId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    if (!(await canManageCourse(authUser, courseIdNum))) {
      return NextResponse.json(
        { success: false, message: "❌ Forbidden: Admin or profe only" },
        { status: 403 }
      );
    }

    const subs = await prisma.subscription.findMany({
      where: { course_id: courseIdNum },
      include: { user: true },
    });
    if (!subs.length) {
      return NextResponse.json(
        { message: "❌ No subscriptions found for this course" },
        { status: 404 }
      );
    }

    const safeUsers = subs.map((s) => {
      if (s.user && typeof s.user === "object") {
        const { password: _pw, ...userWithoutPassword } = s.user as PrismaUser;
        return userWithoutPassword;
      }
      return s.user;
    });

    return NextResponse.json(safeUsers);
  }
);
