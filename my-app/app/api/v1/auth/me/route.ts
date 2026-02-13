import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");

    if (!cookieHeader) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, v] = c.split("=");
        return [k, v];
      }),
    );

    const accessToken = cookies["access_token"];

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // verify token
    const payload = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as { userId: string };

    // const user = await prisma.user.findUnique({
    //   where: { id: payload.userId },
    // });
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        providers: user.accounts.map((a) => a.provider),
      },
    });

  } catch (error) {
    console.error("me error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 },
    );
  }
}
