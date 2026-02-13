"use client";

import { useEffect } from "react";

declare global {
    interface Window {
        google: any;
    }
}

export default function GoogleLoginButton() {
    useEffect(() => {
        window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
            document.getElementById("googleBtn"),
            { theme: "outline", size: "large" }
        );
    }, []);

    async function handleCredentialResponse(response: any) {
        const res = await fetch("/api/v1/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                credential: response.credential,
            }),
        });

        const data = await res.json();
        console.log("Login result:", data);
    }


    return (
        <div>
            <div id="googleBtn"></div>
        </div>
    );
}
