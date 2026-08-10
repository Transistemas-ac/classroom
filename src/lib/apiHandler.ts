import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError, fromPrismaError } from "./HttpError";

type ApiContext = { params: Promise<Record<string, string>> };

export function apiHandler(
  fn: (req: NextRequest, ctx: ApiContext) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: ApiContext) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const fetchSite = req.headers.get("sec-fetch-site");
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");

      if (fetchSite === "cross-site") {
        return NextResponse.json(
          { success: false, message: "❌ Cross-site request blocked" },
          { status: 403 }
        );
      }

      if (origin && host) {
        try {
          if (new URL(origin).host !== host) {
            return NextResponse.json(
              { success: false, message: "❌ Origin not allowed" },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            { success: false, message: "❌ Invalid origin" },
            { status: 403 }
          );
        }
      }
    }

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
