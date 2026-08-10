import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "./prisma";

export type AuthUser = {
  id: number;
  username: string;
  credentials: string;
  courses: number[];
  subscriptions: { course_id: number; user_id: number }[];
};

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || "";
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    if (!decoded || !decoded.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
    });
    if (!user) return null;

    const subs = await prisma.subscription.findMany({
      where: { user_id: user.id },
      select: { course_id: true, user_id: true },
    });

    return {
      id: user.id,
      username: user.username,
      credentials: user.credentials,
      courses: subs.map((s) => s.course_id),
      subscriptions: subs,
    };
  } catch {
    return null;
  }
}

type Credential = "teacher" | "student" | "owner";

export type CheckResult =
  | { ok: true; user: AuthUser }
  | { ok: false; status: number; message: string };

export async function checkCredentials(opts: {
  req: NextRequest;
  allowed: Credential[];
  params?: { userId?: string; courseId?: string };
  body?: Record<string, unknown>;
  path: string;
  method: string;
}): Promise<CheckResult> {
  const { req, allowed, params, body, path, method } = opts;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return { ok: false, status: 401, message: "❌ No token provided" };
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as {
      id: number;
      username: string;
      credentials: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
    });

    if (!user) {
      return { ok: false, status: 401, message: "❌ User not found" };
    }

    const allowedCredentials = Array.isArray(allowed) ? allowed : [allowed];

    if (allowedCredentials.includes("teacher") && user.credentials === "teacher") {
      return {
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          credentials: user.credentials,
          courses: [],
          subscriptions: [],
        },
      };
    }

    const subs = await prisma.subscription.findMany({
      where: { user_id: user.id },
      select: { course_id: true, user_id: true },
    });

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      credentials: user.credentials,
      courses: subs.map((s) => s.course_id),
      subscriptions: subs,
    };

    const userId = user.id;
    const targetUserId = params?.userId
      ? Number(params.userId)
      : (body?.userId as number | undefined);
    const courseId = params?.courseId
      ? Number(params.courseId)
      : (body?.courseId as number | undefined);

    for (const credential of allowedCredentials) {
      if (credential === "student" && user.credentials === "student") {
        if (path.includes("/subscription") && method === "POST") {
          if (!body?.userId || Number(body.userId) !== user.id) {
            return {
              ok: false,
              status: 403,
              message: "❌ Forbidden: Students can only enroll themselves",
            };
          }
          return { ok: true, user: authUser };
        }

        if (path.includes("/subscription") && method === "DELETE") {
          if (!body?.userId || Number(body.userId) !== user.id) {
            return {
              ok: false,
              status: 403,
              message: "❌ Forbidden: Students can only unsubscribe themselves",
            };
          }
          return { ok: true, user: authUser };
        }

        if (courseId !== undefined && authUser.courses.includes(courseId)) {
          return { ok: true, user: authUser };
        }

        if (!courseId && !targetUserId) return { ok: true, user: authUser };
      }

      if (
        credential === "owner" &&
        targetUserId !== undefined &&
        userId === targetUserId
      ) {
        return { ok: true, user: authUser };
      }
    }

    if (user.credentials === "student") {
      if (courseId !== undefined) {
        return {
          ok: false,
          status: 403,
          message: "❌ Forbidden: Not enrolled in the course",
        };
      }

      if (path.includes("/subscription")) {
        const subCourseIdRaw =
          params?.courseId ?? body?.courseId ?? req.nextUrl.searchParams.get("courseId");

        if (subCourseIdRaw) {
          return {
            ok: false,
            status: 403,
            message: "❌ Forbidden: Not enrolled in the course",
          };
        }

        if (!subCourseIdRaw && method === "GET") {
          return {
            ok: false,
            status: 400,
            message: "❌ Bad Request: Missing courseId parameter",
          };
        }
      }
    }

    return { ok: false, status: 403, message: "Forbidden" };
  } catch (err) {
    console.error("❌ JWT verification error:", err);
    return { ok: false, status: 401, message: "❌ Invalid token" };
  }
}

export function unauthorizedResponse(message: string) {
  return NextResponse.json({ success: false, message }, { status: 401 });
}
