// lib/auth.ts
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_EXPIRES_SECONDS = Number(
  process.env.ACCESS_EXPIRES_SECONDS ?? 60 * 15,
); // 15m
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_EXPIRES_DAYS ?? 30);
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error(
    "ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set in .env",
  );
}

/** Hash a password */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Verify a password hash */
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** Create an access token (signed JWT) — includes jti */
export function createAccessToken(payload: object) {
  const jti = randomUUID();
  const token = jwt.sign({ ...payload, jti }, ACCESS_TOKEN_SECRET, {
    expiresIn: `${ACCESS_EXPIRES_SECONDS}s`,
  });
  return { token, jti, expiresIn: ACCESS_EXPIRES_SECONDS };
}

/** Create plain refresh JWT (we also store only hash in DB) */
export function createRefreshTokenPlain(payload: object, jti: string) {
  const token = jwt.sign({ ...payload, jti }, REFRESH_TOKEN_SECRET, {
    expiresIn: `${REFRESH_EXPIRES_DAYS}d`,
  });
  return token;
}

/** Persist hashed refresh token in DB */
export async function storeRefreshToken(
  userId: string,
  plainRefreshToken: string,
  jti: string,
) {
  const tokenHash = await bcrypt.hash(plainRefreshToken, BCRYPT_ROUNDS);
  const expiresAt = new Date(
    Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  );
  return prisma.refreshToken.create({
    data: {
      userId,
      jti,
      tokenHash,
      expiresAt,
    },
  });
}

/** Helper to set cookies on NextResponse (App Router) */
export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  // Access token cookie (short lived)
  res.cookies.set({
    name: "access_token",
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth/refresh",
    path: "/",
    maxAge: ACCESS_EXPIRES_SECONDS,
  });

  // Refresh token cookie (long lived, rotate only via /api/v1/auth/refresh)
  res.cookies.set({
    name: "refresh_token",
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth/refresh",
    maxAge: REFRESH_EXPIRES_DAYS * 24 * 60 * 60,
  });
}

/** Clear auth cookies */
export function clearAuthCookies(res: NextResponse) {
  res.cookies.set({
    name: "access_token",
    value: "",
    maxAge: 0,
    path: "/",
  });
  res.cookies.set({
    name: "refresh_token",
    value: "",
    maxAge: 0,
    path: "/api/v1/auth/refresh",
  });
}
