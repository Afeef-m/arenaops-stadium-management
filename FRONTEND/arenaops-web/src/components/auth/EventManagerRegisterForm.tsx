"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { registerUser } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
    Eye,
    EyeOff,
    ArrowRight,
    Loader2
} from "lucide-react";

interface FormState {
    errors: {
        fullName?: string;
        email?: string;
        password?: string;
        organizationName?: string;
        phone?: string;
    };
}

type InputFieldProps = {
    label: string;
    value: string;
    onChange: (val: string) => void;
    name: string;
    type?: string;
    placeholder?: string;
    error?: string;
    itemVariants: Variants;
    activeField: string | null;
    setActiveField: (value: string | null) => void;
};

function InputField({
    label,
    value,
    onChange,
    name,
    type = "text",
    placeholder,
    error,
    itemVariants,
    activeField,
    setActiveField,
}: InputFieldProps) {
    return (
        <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative group">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setActiveField(name)}
                    onBlur={() => setActiveField(null)}
                    placeholder={placeholder}
                    className={`w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-700 outline-none transition-all duration-300
                        ${activeField === name || value ? 'border-blue-500/50 bg-zinc-900 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]' : 'hover:border-zinc-700'}
                        ${error ? 'border-red-500/50' : ''}
                    `}
                />
            </div>
            {error && <p className="text-red-400 text-[10px] ml-1 font-medium">{error}</p>}
        </motion.div>
    );
}

export default function EventManagerRegisterForm() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { loading, isAuthenticated, error } = useSelector(
        (state: RootState) => state.auth
    );

    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [organizationName, setOrganizationName] = useState("");
    const [phone, setPhone] = useState("");
    const [formErrors, setFormErrors] = useState<FormState["errors"]>({});
    const [activeField, setActiveField] = useState<string | null>(null);
    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: FormState["errors"] = {};

        if (!fullName) errors.fullName = "Full name is required";
        if (!email) errors.email = "Email address is required";
        if (!password || password.length < 6)
            errors.password = "Password must be at least 6 characters";

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        const result = await dispatch(
            registerUser({ email, password, fullName })
        );

        if (registerUser.fulfilled.match(result)) {
            localStorage.setItem(
                "organizerProfile",
                JSON.stringify({
                    organizationName,
                    phone,
                    registeredAsOrganizer: true,
                })
            );
            router.push("/dashboard");
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut",
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" },
        },
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black p-4 selection:bg-blue-500/30 selection:text-blue-200 text-zinc-100">

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-[440px] relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-8 group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300 ring-1 ring-white/10">

                        </div>
                    </Link>
                    <motion.h1 variants={itemVariants} className="text-2xl font-bold text-white tracking-tight mb-2">
                        Event Manager Access
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-zinc-500 text-sm max-w-[280px] mx-auto leading-relaxed">
                        Create your organization account to start hosting events on ArenaOps
                    </motion.p>
                </div>

                {/* Form Card */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Full Name"
                                name="fullname"
                                value={fullName}
                                onChange={setFullName}
                                placeholder="John Doe"
                                error={formErrors.fullName}
                                itemVariants={itemVariants}
                                activeField={activeField}
                                setActiveField={setActiveField}
                            />
                            <InputField
                                label="Organization"
                                name="org"
                                value={organizationName}
                                onChange={setOrganizationName}
                                placeholder="Acme Inc."
                                itemVariants={itemVariants}
                                activeField={activeField}
                                setActiveField={setActiveField}
                            />
                        </div>

                        <InputField
                            label="Email Address"
                            name="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="john@example.com"
                            type="email"
                            error={formErrors.email}
                            itemVariants={itemVariants}
                            activeField={activeField}
                            setActiveField={setActiveField}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Phone"
                                name="phone"
                                value={phone}
                                onChange={setPhone}
                                placeholder="(555) 000-0000"
                                itemVariants={itemVariants}
                                activeField={activeField}
                                setActiveField={setActiveField}
                            />

                            <motion.div variants={itemVariants} className="space-y-1.5">
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setActiveField('password')}
                                        onBlur={() => setActiveField(null)}
                                        placeholder="••••••••"
                                        className={`w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-700 outline-none transition-all duration-300 pr-10
                                            ${activeField === 'password' || password ? 'border-blue-500/50 bg-zinc-900 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]' : 'hover:border-zinc-700'}
                                            ${formErrors.password ? 'border-red-500/50' : ''}
                                        `}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-zinc-600 hover:text-zinc-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {formErrors.password && <p className="text-red-400 text-[10px] ml-1 font-medium">{formErrors.password}</p>}
                            </motion.div>
                        </div>

                        {error && (
                            <motion.div variants={itemVariants} className="p-3 rounded-lg bg-red-500/10 border border-red-500/10 text-red-400 text-xs text-center font-medium">
                                {error}
                            </motion.div>
                        )}

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm tracking-wide shadow-lg shadow-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin text-black" />
                            ) : (
                                <>
                                    Create Account <ArrowRight size={16} className="opacity-60" />
                                </>
                            )}
                        </motion.button>

                    </form>
                </div>

                <motion.div variants={itemVariants} className="mt-8 text-center space-y-3">
                    <div className="text-zinc-500 text-xs text-center w-full">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-500 hover:text-blue-400 font-semibold hover:underline transition-all">
                            Sign In
                        </Link>
                    </div>

                    <div className="w-8 h-px bg-zinc-800 mx-auto" />

                    <Link
                        href="/register"
                        className="inline-block text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                        User Registration
                    </Link>
                </motion.div>

            </motion.div>
        </div>
    );
}
