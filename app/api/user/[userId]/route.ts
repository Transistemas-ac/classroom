import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  isStudentInTaughtCourse,
  countAdmins,
} from "@/src/lib/auth";
import { recordAudit } from "@/src/lib/audit";

const updateUserSchema = z
  .object({
    username: z.string().min(3).max(20).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    credentials: z.enum(["admin", "teacher", "student"]).optional(),
    pronouns: z.string().optional().nullable(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    photo_url: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
    team: z.string().optional().nullable(),
    email_notifications: z.boolean().optional(),
  })
  .strict();

export const GET = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { userId } = await ctx.params;
    const id = Number(userId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const isSelf = authUser.id === id;
    const isAdmin = authUser.credentials === "admin";
    const isTeacherOfStudent = await isStudentInTaughtCourse(authUser.id, id);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, "❌ User not found");

    const isTeacherViewingTeacher =
      authUser.credentials === "teacher" && target.credentials === "teacher";

    if (!isSelf && !isAdmin && !isTeacherOfStudent && !isTeacherViewingTeacher) {
      return forbiddenResponse("❌ Forbidden: You cannot view this user");
    }

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
    const id = Number(userId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const isSelf = authUser.id === id;
    const isAdmin = authUser.credentials === "admin";
    if (!isSelf && !isAdmin) {
      return forbiddenResponse("❌ Forbidden: Only admins or the user themselves can edit this profile");
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateUserSchema.parse(body);

    const { password, credentials, ...fields } = parsed;

    if (!isAdmin && credentials !== undefined) {
      return forbiddenResponse("❌ Forbidden: You cannot change your own role");
    }

    const data: Record<string, unknown> = { ...fields };

    if (isAdmin) {
      if (credentials !== undefined) data.credentials = credentials;
      if (authUser.id === id && credentials !== undefined && credentials !== "admin") {
        return forbiddenResponse("❌ Forbidden: You cannot demote yourself");
      }
      if (password !== undefined) {
        data.password = await bcrypt.hash(password, 10);
      }
    } else if (password !== undefined) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    const { password: _pw, ...safeUser } = updatedUser;
    await recordAudit({
      actorId: authUser.id,
      action: "user.updated",
      entityType: "user",
      entityId: id,
      metadata: { roleChanged: credentials !== undefined },
    });
    return NextResponse.json(safeUser);
  }
);

export const DELETE = apiHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const { userId } = await ctx.params;
    const id = Number(userId);

    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    if (authUser.credentials !== "admin") {
      return forbiddenResponse("❌ Forbidden: Admin only");
    }
    if (authUser.id === id) {
      return forbiddenResponse("❌ Forbidden: You cannot delete yourself");
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, "❌ User not found");

    if (target.credentials === "admin" && (await countAdmins()) <= 1) {
      return forbiddenResponse("❌ Forbidden: Cannot delete the last admin");
    }

    await prisma.user.delete({ where: { id } });
    await recordAudit({
      actorId: authUser.id,
      action: "user.deleted",
      entityType: "user",
      entityId: id,
    });
    return new NextResponse(null, { status: 204 });
  }
);
