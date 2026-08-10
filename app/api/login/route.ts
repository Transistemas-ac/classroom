import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { username, password } = loginSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new HttpError(404, "❌ User not found");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new HttpError(401, "❌ Password incorrect");

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new HttpError(500, "❌ JWT_SECRET not configured");

  const token = jwt.sign(
    { id: user.id, username: user.username, credentials: user.credentials },
    secret,
    { expiresIn: "7d" }
  );

  console.log("✅ User logged in successfully", {
    id: user.id,
    username: user.username,
    email: user.email,
    credentials: user.credentials,
  });

  const { password: _pw, ...safeUser } = user;

  return NextResponse.json({
    success: true,
    token,
    user: safeUser,
  });
});
