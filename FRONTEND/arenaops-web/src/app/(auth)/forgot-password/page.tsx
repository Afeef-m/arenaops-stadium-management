"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword } from "@/store/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { useToastActions } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { loading } = useSelector((state: RootState) => state.auth);
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const { success, error: showError } = useToastActions();

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
        showError("Please enter your email address.");
        return;
    }

    const result = await dispatch(forgotPassword(email));

    if (forgotPassword.fulfilled.match(result)) {
        setSubmitted(true);
        success("If an account exists, a reset code has been sent.");
    } else {
        if (result.payload) {
            showError(result.payload as string);
        } else {
            showError("Request failed. Please try again.");
        }
    }
};

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black text-white p-4">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 md:p-12 shadow-[0_0_80px_rgba(16,185,129,0.1)] relative overflow-hidden">

                {/* Background Texture */}
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                <div className="relative z-10">
                    <Link href="/login" className="inline-flex items-center text-gray-500 hover:text-[#10b981] mb-8 text-xs font-bold uppercase tracking-widest transition-colors">
                        <ArrowLeft size={16} className="mr-2" /> Back to Login
                    </Link>

                    <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">
                        Reset<span className="text-[#10b981]">.</span>
                    </h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-10">
                        Recover your clearance
                    </p>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-gray-600" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="EMAIL ADDRESS"
                                    className="w-full pl-12 pr-5 py-4 rounded-xl bg-[#111827] text-white border border-white/5 outline-none focus:border-[#10b981] transition-all text-xs font-bold tracking-widest placeholder:text-gray-600"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-[#10b981] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#10b981]">
                                <Mail size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Check your email</h3>
                            <p className="text-gray-400 text-sm mb-8">
                                We{"'"}ve sent a 6-digit code to <span className="text-white">{email}</span>.
                            </p>

                            <Link
                                href={`/reset-password?email=${encodeURIComponent(email)}`}
                                className="block w-full py-4 rounded-xl bg-[#10b981] text-black font-black uppercase tracking-widest hover:bg-[#059669] transition-all"
                            >
                                Enter Code
                            </Link>

                            <button
                                onClick={() => setSubmitted(false)}
                                className="mt-6 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Try different email
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
