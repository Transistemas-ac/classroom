import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { getAuthUser, unauthorizedResponse } from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";
import { getPagination, paginatedResponse } from "@/src/lib/pagination";

const createUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
  credentials: z.enum(["admin", "teacher", "student"]).default("student"),
  pronouns: z.string().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  team: z.string().optional().nullable(),
  email_notifications: z.boolean().optional(),
});

export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  if (authUser.credentials === "student") {
    return NextResponse.json(
      { success: false, message: "❌ Forbidden: Admin or profe only" },
      { status: 403 }
    );
  }

  const { requested, page, pageSize, skip } = getPagination(req);
  const search = req.nextUrl.searchParams.get("search")?.trim();
  const where = {
    ...(authUser.credentials === "teacher" ? { credentials: "teacher" as const } : {}),
    ...(search ? { OR: [{ username: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      ...(requested ? { skip, take: pageSize } : {}),
    include: { subscriptions: { include: { course: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  if (!users.length) {
    return NextResponse.json(requested ? paginatedResponse([], page, pageSize, total) : []);
  }

  const safeUsers = users.map(({ password: _pw, ...rest }) => rest);

  return NextResponse.json(requested ? paginatedResponse(safeUsers, page, pageSize, total) : safeUsers);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  if (authUser.credentials !== "admin") {
    return NextResponse.json(
      { success: false, message: "❌ Forbidden: Admin only" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createUserSchema.parse(body);

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: parsed.email }, { username: parsed.username }] },
  });
  if (existingUser)
    throw new HttpError(409, "❌ Email or username already registered");

  const password = await bcrypt.hash(parsed.password, 10);

  const { password: _pw, ...rest } = parsed;
  const savedUser = await prisma.user.create({
    data: { ...rest, password },
  });

  const { password: _pwd, ...safeUser } = savedUser;
  await recordAudit({ actorId: authUser.id, action: "user.created", entityType: "user", entityId: savedUser.id });
  return NextResponse.json(safeUser, { status: 201 });
});
