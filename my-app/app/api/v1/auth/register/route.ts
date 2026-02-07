// app/api/v1/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

type ReqBody = {
  email?: string;
  password?: string;
  name?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    const { email, password, name } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "email and password are required" },
        { status: 400 },
      );
    }

    const emailNorm = email.trim().toLowerCase();

    // simple email length check (more validation can be added)
    if (emailNorm.length > 254) {
      return NextResponse.json(
        { success: false, error: "email too long" },
        { status: 400 },
      );
    }

    // Check existing user by normalized email
    const existingUser = await prisma.user.findUnique({
      where: { emailNormalized: emailNorm },
      include: { accounts: true },
    });

    // If a user exists
    if (existingUser) {
      // If they already have a LOCAL account -> conflict
      const hasLocal = existingUser.accounts.some(
        (a) => a.provider === "LOCAL" && a.providerAccountId === emailNorm,
      );
      if (hasLocal) {
        return NextResponse.json(
          { success: false, error: "User already exists (LOCAL)" },
          { status: 409 },
        );
      }

      // Otherwise, create a LOCAL account linked to existing user (user created via OAuth earlier)
      const passwordHash = await hashPassword(password);
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          provider: "LOCAL",
          providerAccountId: emailNorm,
          passwordHash,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Local account linked to existing user",
          userId: existingUser.id,
        },
        { status: 201 },
      );
    }

    // No existing user: create user + local account in a single transaction
    const passwordHash = await hashPassword(password);

    const created = await prisma.user.create({
      data: {
        email,
        emailNormalized: emailNorm,
        emailVerified: false,
        accounts: {
          create: {
            provider: "LOCAL",
            providerAccountId: emailNorm,
            passwordHash,
          },
        },
      },
      include: { accounts: true },
    });

    // TODO: send email verification if you require it

    return NextResponse.json(
      { success: true, userId: created.id },
      { status: 201 },
    );
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json(
      { success: false, error: "server error" },
      { status: 500 },
    );
  }
}
