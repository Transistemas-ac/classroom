import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { apiHandler } from "@/src/lib/apiHandler";

export const GET = apiHandler(
  async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { userId } = await ctx.params;
    const userIdNum = Number(userId);
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
