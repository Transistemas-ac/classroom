import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";

const registrationSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/(?=.*[a-zA-Z])(?=.*\d)/),
  credentials: z.enum(["student", "teacher"]).default("student"),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { username, email, password, credentials } = registrationSchema.parse(
    body
  );

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existingUser)
    throw new HttpError(409, "❌ Email or username already registered");

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: hash, credentials },
  });

  console.log("✅ User registered successfully", {
    id: user.id,
    username: user.username,
    email: user.email,
    credentials: user.credentials,
  });

  const { password: _pw, ...safeUser } = user;

  return NextResponse.json(
    {
      success: true,
      user: safeUser,
    },
    { status: 201 }
  );
});
