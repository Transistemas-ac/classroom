import { NextRequest, NextResponse } from "next/server";
import type { User as PrismaUser } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { checkCredentials } from "@/src/lib/auth";

export const GET = apiHandler(async () => {
  const courses = await prisma.course.findMany({
    include: { subscriptions: { include: { user: true } } },
  });
  if (!courses) throw new HttpError(404, "❌ No courses found");

  const safeCourses = courses.map((course) => ({
    ...course,
    subscriptions: course.subscriptions.map((s) => {
      if (s.user && typeof s.user === "object") {
        const { password: _pw, ...userWithoutPassword } = s.user as PrismaUser;
        return { ...s, user: userWithoutPassword };
      }
      return s;
    }),
  }));

  return NextResponse.json(safeCourses);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const check = await checkCredentials({
    req,
    allowed: ["teacher"],
    path: "/course",
    method: "POST",
  });
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: check.status });
  }

  const body = await req.json().catch(() => ({}));
  const savedCourse = await prisma.course.create({ data: body });
  console.log("✅ Course created successfully");
  return NextResponse.json(savedCourse, { status: 201 });
});
