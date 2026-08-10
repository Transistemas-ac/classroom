import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { checkCredentials } from "@/src/lib/auth";

export const GET = apiHandler(
  async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { userId } = await ctx.params;
    const id = Number(userId);
    const user = await prisma.user.findUnique({
      where: { id },
      include: { subscriptions: { include: { course: true } } },
    });
    if (!user) throw new HttpError(404, "❌ User not found");

    const { password: _pw, ...safeUser } = user;
    return NextResponse.json(safeUser);
  }
);

export const PUT = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { userId } = await ctx.params;

    const check = await checkCredentials({
      req,
      allowed: ["owner", "teacher"],
      params: { userId },
      path: "/user",
      method: "PUT",
    });
    if (!check.ok) {
      return NextResponse.json({ message: check.message }, { status: check.status });
    }

    const body = await req.json().catch(() => ({}));
    const id = Number(userId);
    const updatedUser = await prisma.user.update({
      where: { id },
      data: body,
    });
    console.log("✅ User updated successfully");

    const { password: _pw, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser);
  }
);

export const DELETE = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { userId } = await ctx.params;

    const check = await checkCredentials({
      req,
      allowed: ["owner", "teacher"],
      params: { userId },
      path: "/user",
      method: "DELETE",
    });
    if (!check.ok) {
      return NextResponse.json({ message: check.message }, { status: check.status });
    }

    const id = Number(userId);
    await prisma.user.delete({ where: { id } });
    console.log("✅ User deleted successfully");
    return new NextResponse(null, { status: 204 });
  }
);
