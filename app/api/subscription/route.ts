import { NextRequest, NextResponse } from "next/server";
import type { User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { checkCredentials } from "@/src/lib/auth";

export const GET = apiHandler(async () => {
  const subs = await prisma.subscription.findMany({
    include: {
      course: true,
      user: true,
    },
  });

  const safeSubs = subs.map((s) => {
    if (s.user && typeof s.user === "object") {
      const { password: _pw, ...userWithoutPassword } = s.user as PrismaUser;
      return { ...s, user: userWithoutPassword };
    }
    return s;
  });

  return NextResponse.json(safeSubs);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  const check = await checkCredentials({
    req,
    allowed: ["student", "teacher"],
    body,
    path: "/subscription",
    method: "POST",
  });
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: check.status });
  }

  const { userId, courseId, credentials } = body;

  const course = await prisma.course.findUnique({
    where: { id: Number(courseId) },
  });
  if (!course) throw new HttpError(404, "❌ Course not found");

  try {
    const relation = await prisma.subscription.create({
      data: {
        user_id: Number(userId),
        course_id: Number(courseId),
        credentials: credentials ?? "student",
      },
    });
    console.log("✅ User enrolled in course", relation);
    return NextResponse.json(relation, { status: 201 });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { message: "❌ Conflict: User is already enrolled in this course" },
        { status: 409 }
      );
    }
    throw err;
  }
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  const check = await checkCredentials({
    req,
    allowed: ["student", "teacher"],
    body,
    path: "/subscription",
    method: "DELETE",
  });
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: check.status });
  }

  const { userId, courseId } = body;

  const course = await prisma.course.findUnique({
    where: { id: Number(courseId) },
  });
  if (!course) throw new HttpError(404, "❌ Course not found");

  try {
    await prisma.subscription.delete({
      where: {
        user_id_course_id: {
          user_id: Number(userId),
          course_id: Number(courseId),
        },
      },
    });

    return NextResponse.json({ message: "✅ User removed from course" });
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { message: "🚫 Not Found: Subscription does not exist" },
        { status: 404 }
      );
    }
    throw err;
  }
});
