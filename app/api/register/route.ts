import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { setSessionCookie } from "@/src/lib/session";
import { sendUserEmail } from "@/src/lib/email";

const registrationSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/(?=.*[a-zA-Z])(?=.*\d)/),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { username, email, password } = registrationSchema.parse(body);

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      throw new HttpError(409, "❌ Email or username already registered");
    }
    const userCount = await tx.user.count();
    return tx.user.create({
      data: {
        username,
        email,
        password: hash,
        credentials: userCount === 0 ? "admin" : "student",
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  const { password: _pw, ...safeUser } = user;

  const res = NextResponse.json(
    {
      success: true,
      user: safeUser,
    },
    { status: 201 }
  );

  setSessionCookie(res, {
    id: user.id,
    username: user.username,
    credentials: user.credentials,
  });

  await sendUserEmail({
    userId: user.id,
    kind: "welcome",
    subject: "Bienvenide a Transistemas",
    title: "Tu cuenta está lista",
    body: "Ya podés entrar a tus cursos y participar del aula.",
    link: process.env.APP_URL,
  });

  return res;
});
