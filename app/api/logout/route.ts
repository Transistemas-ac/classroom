import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/src/lib/apiHandler";
import { clearSessionCookie } from "@/src/lib/session";

export const POST = apiHandler(async (_req: NextRequest) => {
  const response = NextResponse.json({
    success: true,
    message: "✅ User logged out successfully",
  });
  clearSessionCookie(response);
  return response;
});
