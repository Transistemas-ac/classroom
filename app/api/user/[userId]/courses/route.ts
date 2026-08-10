import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";

export const GET = apiHandler(
  async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { userId } = await ctx.params;
    const id = Number(userId);
    const courses = await prisma.subscription.findMany({
      where: { user_id: id },
      include: { course: true },
    });
    return NextResponse.json(courses.map((c) => c.course));
  }
);
