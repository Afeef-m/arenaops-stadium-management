"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from "@/store/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { Key, Eye, EyeOff, Lock, Hash } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToastActions } from "@/components/ui/toast";

export default function ResetPasswordClient() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading } = useSelector((state: RootState) => state.auth);
  const { success, error: showError } = useToastActions();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !otp || !newPassword) {
      showError("All fields are required.");
      return;
    }

    const result = await dispatch(resetPassword({ email, otp, newPassword }));

    if (resetPassword.fulfilled.match(result)) {
      setSubmitted(true);
      success("Password reset successful");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      const message = (result.payload as string) || "Failed to reset password";
      setError(message);
      showError(message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 md:p-12 shadow-[0_0_80px_rgba(16,185,129,0.1)] relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        <div className="relative z-10">
          <Link
            href="/login"
            className="inline-flex items-center text-gray-500 hover:text-[#10b981] mb-8 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Key size={16} className="mr-2" /> Back to Login
          </Link>

          {!submitted ? (
            <>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">
                New Key<span className="text-[#10b981]">.</span>
              </h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-10">
                Setup new access credentials
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-4 top-4 text-gray-600 transition-colors group-focus-within:text-[#10b981]">
                    @
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="CONFIRM EMAIL"
                    className="w-full pl-12 pr-5 py-4 rounded-xl bg-[#111827] text-white border border-white/5 outline-none focus:border-[#10b981] transition-all text-xs font-bold tracking-widest placeholder:text-gray-600"
                  />
                </div>

                <div className="relative group">
                  <Hash
                    className="absolute left-4 top-4 text-gray-600 transition-colors group-focus-within:text-[#10b981]"
                    size={18}
                  />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="ENTER 6-DIGIT CODE"
                    maxLength={6}
                    className="w-full pl-12 pr-5 py-4 rounded-xl bg-[#111827] text-white border border-white/5 outline-none focus:border-[#10b981] transition-all text-xs font-bold tracking-widest placeholder:text-gray-600 tracking-[0.5em]"
                  />
                </div>

                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-4 text-gray-600 transition-colors group-focus-within:text-[#10b981]"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="NEW PASSWORD"
                    className="w-full pl-12 pr-12 py-4 rounded-xl bg-[#111827] text-white border border-white/5 outline-none focus:border-[#10b981] transition-all text-xs font-bold tracking-widest placeholder:text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-500 hover:text-[#10b981] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-[10px] font-bold uppercase text-center mt-4">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-6 rounded-xl bg-white text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-[#10b981] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Set New Password"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-20 h-20 bg-[#10b981] rounded-full flex items-center justify-center mx-auto mb-6 text-black shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                <Lock size={40} />
              </div>
              <h3 className="text-2xl font-black italic uppercase mb-2">
                Password Reset!
              </h3>
              <p className="text-gray-400 text-xs tracking-widest mb-8">
                Your credentials have been updated.
              </p>

              <Link
                href="/login"
                className="inline-block px-10 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-transform uppercase text-xs tracking-[0.2em]"
              >
                Proceed to Login →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
