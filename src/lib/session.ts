import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "token";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export type SessionPayload = {
  id: number;
  username: string;
  credentials: string;
};

export function signSession(payload: SessionPayload): string {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as SessionPayload;
    if (!decoded || !decoded.id) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getSessionToken(req: NextRequest): string | null {
  return req.cookies.get(COOKIE_NAME)?.value ?? null;
}

export function getSessionUser(req: NextRequest): SessionPayload | null {
  const token = getSessionToken(req);
  if (!token) return null;
  return verifySession(token);
}

export function setSessionCookie(res: NextResponse, payload: SessionPayload) {
  res.cookies.set(COOKIE_NAME, signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
