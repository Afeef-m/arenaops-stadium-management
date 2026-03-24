"use client";

import { useRef, useLayoutEffect, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { loginUser } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import Link from "next/link";
import { Chrome, Eye, EyeOff } from "lucide-react";
import { useToastActions } from "@/components/ui/toast";

interface FormState {
  errors: {
    email?: string; 
    password?: string;
  };
}

export default function LoginForm() {
  const { success, error: showError } = useToastActions();

  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Local state for form errors since we are moving away from useActionState for simplicity with Thunks
  const [formErrors, setFormErrors] = useState<FormState["errors"]>({});
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.roles?.includes("Admin")) {
        router.push("/admin/dashboard");
      } else if (user.roles?.includes("StadiumOwner")) {
        router.push("/manager");
      } else if (user.roles?.includes("EventManager")) {
        router.push("/event-manager/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, user, router]);

  // Stadium-Entrance Animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".left-panel", {
        x: -100,
        opacity: 0,
        duration: 0.8,
        ease: "expo.out",
      });

      gsap.from(".right-panel", {
        x: 100,
        opacity: 0,
        duration: 0.8,
        ease: "expo.out",
      });

      gsap.from(".input-field", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        delay: 0.4,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
    const redirectUri = window.location.origin + "/auth/callback";
    const scope = "email profile";
    const responseType = "code";

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;

    window.location.href = authUrl;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const errors: FormState["errors"] = {};

    if (!email) errors.email = "Enter your email / credentials";
    if (!password) errors.password = "Password required to enter pitch";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Dispatch login action
    const result = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(result)) {
      success("Welcome back to the Arena!");
      const userPayload = result.payload as any;
      if (userPayload?.roles?.includes("Admin")) {
        router.push("/admin/dashboard");
      } else if (userPayload?.roles?.includes("StadiumOwner")) {
        router.push("/manager");
      } else if (userPayload?.roles?.includes("EventManager")) {
        router.push("/event-manager/dashboard");
      } else {
        router.push("/");
      }
    } else {
      if (result.payload) {
        showError(result.payload as string);
      } else {
        showError("Login failed. Check your credentials.");
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-[85vw] max-w-250 min-h-125 bg-[#0a0a0a] rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.1)] overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-white/5"
    >
      <div className="left-panel hidden lg:flex flex-col justify-center items-center bg-[#10b981] text-black rounded-r-[150px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        <div className="text-center px-16 relative z-10">
          <h2 className="text-6xl font-black italic tracking-tighter mb-4 uppercase">
            Own The <br /> Pitch.
          </h2>
          <p className="mb-8 text-sm font-bold uppercase tracking-widest opacity-80">
            Secure clearance for ArenaOps
          </p>

          <Link
            href="/register"
            className="px-10 py-3 bg-black text-white font-bold rounded-full hover:scale-105 transition-transform inline-block uppercase text-xs tracking-[0.2em]"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Right Panel - Login Auth */}
      <div className="right-panel flex flex-col justify-center px-12 lg:px-20 bg-[#050505]">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-1">
            Login<span className="text-[#10b981]">.</span>
          </h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">
            Authentication Required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-field">
            <input
              name="email"
              type="email"
              placeholder="EMAIL ADDRESS"
              className={`w-full px-5 py-4 rounded-xl bg-[#111827] text-white border border-white/5 outline-none focus:border-[#10b981] transition-all text-xs font-bold tracking-widest placeholder:text-gray-600 ${formErrors.email ? "border-red-500/50 ring-1 ring-red-500/20" : ""
                }`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-[10px] mt-2 font-bold uppercase tracking-tighter">
                {formErrors.email}
              </p>
            )}
          </div>

          <div className="input-field relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="CLEARANCE PASSWORD"
              className={`w-full px-5 py-4 pr-12 rounded-xl bg-[#111827] text-white border border-white/5 outline-none focus:border-[#10b981] transition-all text-xs font-bold tracking-widest placeholder:text-gray-600 ${formErrors.password ? "border-red-500/50 ring-1 ring-red-500/20" : ""
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-gray-500 hover:text-[#10b981] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {formErrors.password && (
              <p className="text-red-500 text-[10px] mt-2 font-bold uppercase tracking-tighter">
                {formErrors.password}
              </p>
            )}
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#10b981] transition-colors"
            >
              Reset Credentials?
            </Link>
          </div>

          {error && (
            <p className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-[10px] font-bold uppercase text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className=" w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-[#10b981] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
          >
            {loading ? "Verifying clearance..." : "Enter Arena →"}
          </button>
        </form>

        <div className="text-center mt-10 text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
          External Networks
        </div>

        <div className="flex justify-center gap-4">
          <div className="flex justify-center w-full">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 rounded-xl border border-white/10 bg-[#111827] text-white hover:bg-[#1f2937] transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Chrome size={20} className="text-[#10b981]" />
              <span className="text-xs font-bold uppercase tracking-widest">Continue with Google</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Only visible on small screens */}
        <div className="mt-8 text-center lg:hidden border-t border-white/5 pt-6">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">
            Secure clearance for ArenaOps
          </p>
          <Link
            href="/register"
            className="text-[#10b981] text-xs font-black uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            Create Account <Eye size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}