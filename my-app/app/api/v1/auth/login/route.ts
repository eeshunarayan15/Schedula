import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    verifyPassword,
    createAccessToken,
    createRefreshTokenPlain,
    storeRefreshToken,
    setAuthCookies,
} from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: "Missing email or password" },
                { status: 400 }
            );
        }

        const emailNorm = email.toLowerCase();

        // 🔍 find LOCAL account
        const account = await prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: "LOCAL",
                    providerAccountId: emailNorm,
                },
            },
            include: { user: true },
        });

        if (!account || !account.passwordHash) {
            return NextResponse.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // 🔐 verify password
        const isValid = await verifyPassword(password, account.passwordHash);

        if (!isValid) {
            return NextResponse.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const user = account.user;

        // create access token
        const access = createAccessToken({ userId: user.id });

        // create refresh token
        const refreshJti = randomUUID();
        const refreshPlain = createRefreshTokenPlain(
            { userId: user.id },
            refreshJti
        );

        // store refresh token in DB (hashed)
        await storeRefreshToken(user.id, refreshPlain, refreshJti);

        // create response
        const res = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
            },
        });

        // 🍪 set cookies
        setAuthCookies(res, access.token, refreshPlain);

        return res;
    } catch (error) {
        console.error("login error:", error);
        return NextResponse.json(
            { success: false, error: "Server error" },
            { status: 500 }
        );
    }
}
