"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { googleLoginUser, loginFailure } from "@/app/store/authSlice";
import { RootState } from "@/app/store/store";
import { useToastActions } from "@/components/ui/toast";

export default function AuthCallbackClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch<any>();
    const processedRef = useRef(false);
    const { loading, error } = useSelector((state: RootState) => state.auth);
    const { success, error: showError } = useToastActions();

    useEffect(() => {
        if (processedRef.current) return;

        const code = searchParams.get("code");
        const urlError = searchParams.get("error");

        if (urlError) {
            console.error("Google Auth Error:", urlError);
            showError("Google authentication failed. Please try again.");
            dispatch(loginFailure("Google authentication failed"));
            router.push("/login");
            processedRef.current = true;
            return;
        }

        if (code) {
            processedRef.current = true;
            const redirectUri = window.location.origin + "/auth/callback";

            dispatch(googleLoginUser({ code, redirectUri }))
                .unwrap()
                .then(() => {
                    success("Google Login successful!");
                    router.push("/");
                })
                .catch((err: any) => {
                    console.error("Google Auth Failed:", err);
                    showError(err || "Google login failed.");
                    router.push("/login"); // or show error state
                });
        } else {
            // No code, no error -> just redirect
            if (!processedRef.current) {
                router.push("/login");
            }
        }
    }, [searchParams, router, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="font-bold tracking-widest uppercase text-sm animate-pulse">
                    {loading ? "Verifying Google Credentials..." : "Authenticating..."}
                </p>
                {error && <p className="text-red-500 mt-2 text-xs">{error}</p>}
            </div>
        </div>
    );
}
