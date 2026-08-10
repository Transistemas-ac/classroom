import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import prisma from "./prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${ip}:${process.env.JWT_SECRET ?? ""}`)
    .digest("hex");
}

function key(username: string, ipHash: string) {
  return { username: username.toLowerCase(), ip_hash: ipHash };
}

export async function isLoginBlocked(
  req: NextRequest,
  username: string
): Promise<boolean> {
  const record = await prisma.loginAttempt.findUnique({
    where: { username_ip_hash: key(username, hashIp(getClientIp(req))) },
  });

  return Boolean(record?.blocked_until && record.blocked_until > new Date());
}

export async function recordFailedLogin(
  req: NextRequest,
  username: string
): Promise<void> {
  const ipHash = hashIp(getClientIp(req));
  const lookup = key(username, ipHash);
  const now = new Date();
  const record = await prisma.loginAttempt.findUnique({
    where: { username_ip_hash: lookup },
  });

  if (!record || now.getTime() - record.window_start.getTime() > WINDOW_MS) {
    await prisma.loginAttempt.upsert({
      where: { username_ip_hash: lookup },
      create: { ...lookup, attempts: 1, window_start: now },
      update: {
        attempts: 1,
        window_start: now,
        blocked_until: null,
      },
    });
    return;
  }

  const attempts = record.attempts + 1;
  await prisma.loginAttempt.update({
    where: { id: record.id },
    data: {
      attempts,
      blocked_until: attempts >= MAX_ATTEMPTS
        ? new Date(now.getTime() + BLOCK_MS)
        : record.blocked_until,
    },
  });
}

export async function clearFailedLogins(
  req: NextRequest,
  username: string
): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: key(username, hashIp(getClientIp(req))),
  });
}
