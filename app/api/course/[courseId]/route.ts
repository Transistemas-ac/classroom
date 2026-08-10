import { NextRequest, NextResponse } from "next/server";
import type { User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { checkCredentials } from "@/src/lib/auth";

export const GET = apiHandler(
  async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;
    const id = Number(courseId);
    const course = await prisma.course.findUnique({
      where: { id },
      include: { subscriptions: { include: { user: true } } },
    });
    if (!course) throw new HttpError(404, "❌ Course not found");

    const safeCourse = {
      ...course,
      subscriptions: course.subscriptions.map((s) => {
        if (s.user && typeof s.user === "object") {
          const { password: _pw, ...userWithoutPassword } = s.user as PrismaUser;
          return { ...s, user: userWithoutPassword };
        }
        return s;
      }),
    };

    return NextResponse.json(safeCourse);
  }
);

export const PUT = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;

    const check = await checkCredentials({
      req,
      allowed: ["teacher"],
      params: { courseId },
      path: "/course",
      method: "PUT",
    });
    if (!check.ok) {
      return NextResponse.json({ message: check.message }, { status: check.status });
    }

    const body = await req.json().catch(() => ({}));
    const id = Number(courseId);
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: body,
    });
    console.log("✅ Course updated successfully");
    return NextResponse.json(updatedCourse);
  }
);

export const DELETE = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { courseId } = await ctx.params;

    const check = await checkCredentials({
      req,
      allowed: ["teacher"],
      params: { courseId },
      path: "/course",
      method: "DELETE",
    });
    if (!check.ok) {
      return NextResponse.json({ message: check.message }, { status: check.status });
    }

    const id = Number(courseId);
    await prisma.course.delete({ where: { id } });
    console.log("✅ Course deleted successfully");
    return NextResponse.json({ message: "✅ Course deleted successfully" });
  }
);
