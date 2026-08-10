import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { setSessionCookie } from "@/src/lib/session";
import {
  clearFailedLogins,
  isLoginBlocked,
  recordFailedLogin,
} from "@/src/lib/rateLimit";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { username, password } = loginSchema.parse(body);

  if (await isLoginBlocked(req, username)) {
    throw new HttpError(429, "❌ Demasiados intentos. Probá de nuevo en 15 minutos.");
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    await recordFailedLogin(req, username);
    throw new HttpError(401, "❌ Usuario o contraseña incorrectos");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    await recordFailedLogin(req, username);
    throw new HttpError(401, "❌ Usuario o contraseña incorrectos");
  }

  await clearFailedLogins(req, username);

  if (!process.env.JWT_SECRET) {
    throw new HttpError(500, "❌ JWT_SECRET not configured");
  }

  const res = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      credentials: user.credentials,
    },
  });

  setSessionCookie(res, {
    id: user.id,
    username: user.username,
    credentials: user.credentials,
  });

  return res;
});
