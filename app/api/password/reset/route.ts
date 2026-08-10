import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const { token, password } = schema.parse(await req.json().catch(() => ({})));
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const reset = await prisma.passwordResetToken.findUnique({ where: { token_hash: tokenHash } });
  if (!reset || reset.used_at || reset.expires_at <= new Date()) {
    throw new HttpError(400, "❌ El enlace no es válido o ya venció");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.user_id }, data: { password: await bcrypt.hash(password, 10) } }),
    prisma.passwordResetToken.update({ where: { id: reset.id }, data: { used_at: new Date() } }),
  ]);
  return NextResponse.json({ success: true, message: "Contraseña actualizada" });
});
