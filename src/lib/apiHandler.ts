import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError, fromPrismaError } from "./HttpError";

type ApiContext = { params: Promise<Record<string, string>> };

export function apiHandler(
  fn: (req: NextRequest, ctx: ApiContext) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: ApiContext) => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      const prismaErr = error as { code?: string } | undefined;
      if (prismaErr?.code) {
        const http = fromPrismaError(error);
        return NextResponse.json(
          { success: false, message: http.message },
          { status: http.status }
        );
      }

      if (error instanceof HttpError) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: error.status }
        );
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          { success: false, errors: error.issues.map((e) => e.message) },
          { status: 400 }
        );
      }

      console.error("❌ Error:", error);
      return NextResponse.json(
        { success: false, message: "🚫 Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
