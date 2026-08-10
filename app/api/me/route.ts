import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getAuthUser, unauthorizedResponse } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse("❌ Sesión inválida");
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { subscriptions: { include: { course: true } } },
  });
  if (!user) return unauthorizedResponse("❌ Usuario no encontrado");
  const { password: _password, ...safeUser } = user;
  return NextResponse.json(safeUser);
}
