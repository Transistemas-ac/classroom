import { NextRequest } from "next/server";

export function getPagination(req: NextRequest) {
  const requested = req.nextUrl.searchParams.has("page") || req.nextUrl.searchParams.has("pageSize");
  const rawPage = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const rawPageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "25");
  const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;
  const pageSize = Number.isFinite(rawPageSize) ? Math.min(Math.max(rawPageSize, 1), 100) : 25;
  return { requested, page, pageSize, skip: (page - 1) * pageSize };
}

export function paginatedResponse<T>(items: T[], page: number, pageSize: number, total: number) {
  return {
    items,
    page,
    pageSize,
    total,
    pages: Math.ceil(total / pageSize),
  };
}
