import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import {
    createAccessToken,
    createRefreshTokenPlain,
    setAuthCookies,
    storeRefreshToken,
} from "@/lib/auth";
import { randomUUID } from "crypto";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
    try {
        const { credential } = await req.json();

        if (!credential) {
            return NextResponse.json(
                { success: false, error: "Missing credential" },
                { status: 400 }
            );
        }

        // verify with Google
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload?.email) {
            return NextResponse.json(
                { success: false, error: "Email not found" },
                { status: 400 }
            );
        }

        const email = payload.email.toLowerCase();
        const googleId = payload.sub;

        // find existing user
        let user = await prisma.user.findUnique({
            where: { emailNormalized: email },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: payload.email,
                    emailNormalized: email,
                    emailVerified: true,
                },
            });
        }

        // check account
        const existingAccount = await prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: "GOOGLE",
                    providerAccountId: googleId,
                },
            },
        });

        if (!existingAccount) {
            await prisma.account.create({
                data: {
                    userId: user.id,
                    provider: "GOOGLE",
                    providerAccountId: googleId,
                },
            });
        }

        // create tokens
        const access = createAccessToken({ userId: user.id });
        const refreshJti = randomUUID();
        const refreshPlain = createRefreshTokenPlain(
            { userId: user.id },
            refreshJti
        );

        await storeRefreshToken(user.id, refreshPlain, refreshJti);

        const res = NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email },
        });

        setAuthCookies(res, access.token, refreshPlain);

        return res;
    } catch (error) {
        console.error("google login error:", error);
        return NextResponse.json(
            { success: false, error: "Google login failed" },
            { status: 500 }
        );
    }
}
