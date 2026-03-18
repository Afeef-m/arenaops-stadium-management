"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { registerEventManagerUser } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import EventManagerNavbar from "@/components/navfooter/EventManagerNavbar";
// import EventManagerFooter from "@/components/navfooter/EventManagerFooter";
import { Ticket, ShieldCheck, Mail, Phone, Building2, FileText, BadgeInfo, Globe, Lock, Eye, EyeOff, ArrowRight, User } from "lucide-react";

export default function EventManagerRegisterForm() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { loading, error } = useSelector(
        (state: RootState) => state.auth
    );

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        organizationName: "",
        gstNumber: "",
        designation: "",
        website: "",
        password: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!form.fullName) errors.fullName = "Full name is required";
        if (!form.email) errors.email = "Email address is required";
        if (!form.password || form.password.length < 6)
            errors.password = "Password must be at least 6 characters";

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        const result = await dispatch(
            registerEventManagerUser({ 
                email: form.email, 
                password: form.password, 
                fullName: form.fullName, 
                phoneNumber: form.phoneNumber,
                organizationName: form.organizationName,
                gstNumber: form.gstNumber,
                designation: form.designation,
                website: form.website
            })
        );

        if (registerEventManagerUser.fulfilled.match(result)) {
            localStorage.setItem(
                "organizerProfile",
                JSON.stringify({
                    organizationName: form.organizationName,
                    phone: form.phoneNumber,
                    registeredAsOrganizer: true,
                })
            );
            router.push("/manager");
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen overflow-x-hidden selection:bg-primary selection:text-background-dark">
            <div className="fixed inset-0 stadium-grid pointer-events-none z-0"></div>
            <div className="fixed -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

            <div className="relative flex flex-col min-h-screen z-10 w-full">
                {/* <EventManagerNavbar /> */}

                <main className="flex-grow flex items-center justify-center p-6 lg:py-16 w-full">
                    <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center mx-auto">
                        <div className="hidden lg:flex flex-col gap-8">
                            <div className="space-y-4">
                                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase border border-primary/20">
                                    Partner with the best
                                </span>
                                <h2 className="text-6xl font-bold leading-[1.1] tracking-tighter text-slate-900 dark:text-slate-100">
                                    Manage the <br /> <span className="text-[#10b981] italic">Greatest Stages</span> <br /> on Earth.
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md">
                                    From crowd control to VIP hospitality, ArenaManager gives event professionals the tools to deliver flawless experiences.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 glass rounded-2xl relative">
                                    <Ticket className="text-[#10b981] mb-2 w-8 h-8 select-none" />
                                    <h3 className="font-bold text-xl text-slate-100">50M+</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tickets Managed</p>
                                </div>
                                <div className="p-6 glass rounded-2xl relative">
                                    <ShieldCheck className="text-[#10b981] mb-2 w-8 h-8 select-none" />
                                    <h3 className="font-bold text-xl text-slate-100">99.9%</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Uptime Reliability</p>
                                </div>
                            </div>
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-primary/20 shadow-2xl">
                                <img
                                    className="w-full h-full object-cover grayscale opacity-50"
                                    alt="Modern illuminated stadium interior architecture aerial view"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuALWe6_amO5NN6O26a7ykBvLH7D2xV1xCpVdnfNX55hCv56xDUir2T0U46oTQEFLzxXzbJZqKBSrBISE-oC4Hm_uT-iwJGGHtKNa1WejDCXZG73FqsMwRFWJxs2tne5BLPt3b11ifE2nlJB5z2cgmkkst4noZhVgmD-g-PSZEK1T9zGf8yk9Mbnb1JnM5d_ARwacLP-Jg05WIKSaES9_t4m6u5xeueskFEq-OqDePykX-oXB_sqdtr0BeEStKpZH0ur_i0ly-WnKewe"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
                                <div className="absolute bottom-6 left-6">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-200">Live Operations View</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass p-8 lg:p-12 rounded-[2rem] shadow-2xl border border-primary/10 relative overflow-hidden text-left">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="mb-10 text-center lg:text-left relative">
                                <h3 className="text-3xl font-bold mb-2 text-slate-100">Create Account</h3>
                                <p className="text-slate-400">Start managing your venue today.</p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-5 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label htmlFor="fullName" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-4 text-slate-500 w-5 h-5 pointer-events-none select-none" />
                                            <input
                                                id="fullName"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
                                                placeholder=""
                                                type="text"
                                                value={form.fullName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-4 text-slate-500 w-5 h-5 pointer-events-none select-none" />
                                            <input
                                                id="email"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
                                                placeholder=""
                                                type="email"
                                                value={form.email}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="phoneNumber" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-4 text-slate-500 w-5 h-5 pointer-events-none select-none" />
                                            <input
                                                id="phoneNumber"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
                                                placeholder=""
                                                type="tel"
                                                value={form.phoneNumber}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="organizationName" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Organization Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-4 text-slate-500 w-5 h-5 pointer-events-none select-none" />
                                            <input
                                                id="organizationName"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
                                                placeholder=""
                                                type="text"
                                                value={form.organizationName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="gstNumber" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">GST Number</label>
                                        <div className="relative">
                                            <FileText className="absolute left-4 top-4 text-slate-500 w-5 h-5 pointer-events-none select-none" />
                                            <input
                                                id="gstNumber"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
                                                placeholder=""
                                                type="text"
                                                value={form.gstNumber}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="designation" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Designation</label>
                                        <div className="relative">
                                            <BadgeInfo className="absolute left-4 top-4 text-slate-500 w-5 h-5 pointer-events-none select-none" />
                                            <input
                                                id="designation"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
                                                placeholder=""
                                                type="text"
                                                value={form.designation}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="website" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Website</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-4 text-slate-500 w-5 h-5 pointer-events-none select-none" />
                                        <input
                                            id="website"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
                                            placeholder=""
                                            type="url"
                                            value={form.website}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-4 text-slate-500 w-5 h-5 pointer-events-none select-none" />
                                        <input
                                            id="password"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
                                            placeholder=""
                                            type={showPassword ? "text" : "password"}
                                            value={form.password}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer hover:text-[#10b981] z-10 bg-transparent border-0 outline-none"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="pt-4 relative z-10">
                                    <button
                                        type="submit"
                                        className="w-full bg-[#10b981] text-[#132210] font-bold py-5 rounded-xl hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 group cursor-pointer border border-[#10b981]/50"
                                    >
                                        Create My Account
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                                <p className="text-center text-xs text-slate-500 px-8 relative z-10">
                                    By clicking "Create My Account", you agree to our <a className="text-slate-300 hover:text-[#10b981] underline cursor-pointer" href="#">Terms of Service</a> and <a className="text-slate-300 hover:text-[#10b981] underline cursor-pointer" href="#">Privacy Policy</a>.
                                </p>
                            </form>
                        </div>
                    </div>
                </main>

                {/* <EventManagerFooter /> */}
            </div>
        </div>
    );
}