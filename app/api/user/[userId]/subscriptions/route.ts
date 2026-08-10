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
    const id = Number(userId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const isSelf = authUser.id === id;
    const isAdmin = authUser.credentials === "admin";
    const isTeacherOfStudent = await isStudentInTaughtCourse(authUser.id, id);

    if (!isSelf && !isAdmin && !isTeacherOfStudent) {
      return forbiddenResponse("❌ Forbidden: You cannot view this user's subscriptions");
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { user_id: id },
      include: { course: true },
    });
    return NextResponse.json(subscriptions);
  }
);
