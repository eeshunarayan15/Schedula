import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;

  // routes we want to protect
  if (req.nextUrl.pathname.startsWith("/api/v1/protected")) {
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    try {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
      return NextResponse.next();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
}
