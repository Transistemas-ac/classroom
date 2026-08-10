import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";
import { checkCredentials } from "@/src/lib/auth";

export const GET = apiHandler(async () => {
  const users = await prisma.user.findMany({
    include: { subscriptions: { include: { course: true } } },
  });

  if (!users.length) throw new HttpError(404, "❌ No users found");

  const safeUsers = users.map(({ password: _pw, ...rest }) => rest);

  return NextResponse.json(safeUsers);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const check = await checkCredentials({
    req,
    allowed: ["teacher"],
    path: "/user",
    method: "POST",
  });
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: check.status });
  }

  const body = await req.json().catch(() => ({}));
  const savedUser = await prisma.user.create({ data: body });
  console.log("✅ User created successfully");

  const { password: _pw, ...safeUser } = savedUser;
  return NextResponse.json(safeUser, { status: 201 });
});
