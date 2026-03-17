import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function EventManagerNavbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#10b981]/10 bg-background-dark/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10b981]/20 text-[#10b981]">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-100">
            Arena<span className="text-[#10b981]">Manager</span>
          </span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a className="text-sm font-medium text-slate-300 hover:text-[#10b981] transition-colors" href="#">Features</a>
          <a className="text-sm font-medium text-slate-300 hover:text-[#10b981] transition-colors" href="#">Solutions</a>
          <a className="text-sm font-medium text-slate-300 hover:text-[#10b981] transition-colors" href="#">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden text-sm font-bold text-slate-100 hover:text-[#10b981] sm:block">Login</Link>
          <Link href="/register-event-manager" className="rounded-lg bg-[#10b981] px-5 py-2.5 text-sm font-bold text-background-dark hover:brightness-110 transition-all">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
