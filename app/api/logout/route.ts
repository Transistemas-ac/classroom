import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/src/lib/prisma";
import { HttpError } from "@/src/lib/HttpError";
import { apiHandler } from "@/src/lib/apiHandler";

const logoutSchema = z.object({
  username: z.string().min(1),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { username } = logoutSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new HttpError(404, "❌ User not found");

  const response = NextResponse.json({
    success: true,
    message: "✅ User logged out successfully",
  });
  response.cookies.set("token", "", { maxAge: 0, path: "/" });

  return response;
});
