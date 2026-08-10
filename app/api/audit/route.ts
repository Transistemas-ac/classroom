import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getAuthUser, unauthorizedResponse, forbiddenResponse } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();
  if (authUser.credentials !== "admin") return forbiddenResponse("❌ Admin only");

  const page = Math.max(Number(req.nextUrl.searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(Number(req.nextUrl.searchParams.get("pageSize") ?? "50"), 1), 100);
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { id: true, username: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return NextResponse.json({ items, page, pageSize, total, pages: Math.ceil(total / pageSize) });
}
