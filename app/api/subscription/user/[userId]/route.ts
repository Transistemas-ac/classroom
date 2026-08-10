import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  isStudentInTaughtCourse,
} from "@/src/lib/auth";

export const GET = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { userId } = await ctx.params;
    const userIdNum = Number(userId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const isSelf = authUser.id === userIdNum;
    const isAdmin = authUser.credentials === "admin";
    const isTeacherOfStudent = await isStudentInTaughtCourse(authUser.id, userIdNum);

    if (!isSelf && !isAdmin && !isTeacherOfStudent) {
      return forbiddenResponse("❌ Forbidden: You cannot view this user's subscriptions");
    }

    const subs = await prisma.subscription.findMany({
      where: { user_id: userIdNum },
      include: { course: true },
    });
    if (!subs.length) {
      return NextResponse.json(
        { message: "❌ No subscriptions found for this user" },
        { status: 404 }
      );
    }
    return NextResponse.json(subs.map((s) => s.course));
  }
);
