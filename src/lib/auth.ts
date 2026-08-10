import { NextRequest, NextResponse } from "next/server";
import prisma from "./prisma";
import { getSessionUser } from "./session";
import { canManageCourseRole } from "./permissions";

export type Role = "admin" | "teacher" | "student";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  credentials: Role;
  courses: number[];
  taughtCourses: number[];
  subscriptions: { user_id: number; course_id: number; credentials: Role }[];
};

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const session = getSessionUser(req);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: Number(session.id) },
  });
  if (!user) return null;

  const subs = await prisma.subscription.findMany({
    where: { user_id: user.id },
    select: { course_id: true, user_id: true, credentials: true },
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    credentials: user.credentials as Role,
    courses: subs.map((s) => s.course_id),
    taughtCourses: subs
      .filter((s) => s.credentials === "teacher")
      .map((s) => s.course_id),
    subscriptions: subs,
  };
}

export function hasRole(user: AuthUser, roles: Role[]): boolean {
  return roles.includes(user.credentials);
}

export function isGlobalStaff(user: AuthUser): boolean {
  return user.credentials === "admin";
}

export async function canManageCourse(
  user: AuthUser,
  courseId: number
): Promise<boolean> {
  if (user.credentials === "admin") return true;
  if (user.credentials !== "teacher") return false;

  const subscription = await prisma.subscription.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.id,
          course_id: courseId,
        },
      },
      select: { credentials: true },
    });
  return canManageCourseRole(user.credentials, subscription?.credentials);
}

export async function canViewCourseRoster(
  user: AuthUser,
  courseId: number
): Promise<boolean> {
  return canManageCourse(user, courseId);
}

export function unauthorizedResponse(message = "❌ No token provided") {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function forbiddenResponse(message = "❌ Forbidden") {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

export async function isStudentInTaughtCourse(
  teacherId: number,
  studentId: number
): Promise<boolean> {
  const teacherSubs = await prisma.subscription.findMany({
    where: {
      user_id: teacherId,
      credentials: "teacher",
    },
    select: { course_id: true },
  });

  if (!teacherSubs.length) return false;

  const count = await prisma.subscription.count({
    where: {
      user_id: studentId,
      course_id: { in: teacherSubs.map((s) => s.course_id) },
    },
  });

  return count > 0;
}

export async function isEnrolled(
  userId: number,
  courseId: number
): Promise<boolean> {
  const count = await prisma.subscription.count({
    where: { user_id: userId, course_id: courseId },
  });
  return count > 0;
}

export async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { credentials: "admin" } });
}
