export class HttpError extends Error {
  status: number;
  code?: string;
  details?: { code?: string; meta?: unknown };
  constructor(
    status: number,
    message: string,
    details?: { code?: string; meta?: unknown }
  ) {
    super(message);
    this.status = status;
    this.code =
      typeof details?.code === "string" ? details.code : undefined;
    this.details = details;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

type PrismaError = { code?: string; message?: string; meta?: unknown };

// Check for known Prisma errors and convert them to HttpError
export function fromPrismaError(err: unknown): HttpError {
  const prismaErr = (err ?? {}) as PrismaError;
  if (!prismaErr.code) {
    return new HttpError(500, prismaErr.message ?? "Prisma error", {
      meta: prismaErr.meta,
    });
  }

  switch (prismaErr.code) {
    case "P2002": {
      const target = (prismaErr.meta as { target?: string | string[] } | undefined)?.target;
      return new HttpError(
        409,
        `Unique constraint failed on ${
          Array.isArray(target) ? target.join(", ") : target ?? "field"
        }`,
        { code: prismaErr.code, meta: prismaErr.meta }
      );
    }
    case "P2025":
      return new HttpError(404, "Resource not found", {
        code: prismaErr.code,
      });
    case "P2003":
      return new HttpError(400, "Foreign key constraint failed", {
        code: prismaErr.code,
        meta: prismaErr.meta,
      });
    default:
      return new HttpError(500, prismaErr.message ?? "Prisma error", {
        code: prismaErr.code,
        meta: prismaErr.meta,
      });
  }
}
