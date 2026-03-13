import Link from "next/link";
import { LayoutDashboard, Globe, AtSign } from "lucide-react";

export default function EventManagerFooter() {
  return (
    <footer className="border-t border-[#10b981]/10 bg-background-dark px-6 py-16 mt-auto">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#10b981]/20 text-[#10b981]">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">ArenaManager</span>
            </div>
            <p className="max-w-xs text-slate-400">The next-generation command center for arena and stadium management. Precision at scale.</p>
            <div className="flex gap-4">
              <a className="text-slate-500 hover:text-[#10b981]" href="#"><Globe className="w-5 h-5" /></a>
              <a className="text-slate-500 hover:text-[#10b981]" href="#"><AtSign className="w-5 h-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="mb-6 font-bold text-white uppercase tracking-wider text-sm">Product</h4>
            <ul className="space-y-4 text-slate-400">
              <li><a className="hover:text-[#10b981] transition-colors" href="#">Analytics</a></li>
              <li><a className="hover:text-[#10b981] transition-colors" href="#">Ticketing</a></li>
              <li><a className="hover:text-[#10b981] transition-colors" href="#">Access Control</a></li>
              <li><a className="hover:text-[#10b981] transition-colors" href="#">API Docs</a></li>
            </ul>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">Ready to scale?</h4>
            <Link href="/register-event-manager" className="w-full text-center rounded-lg bg-[#10b981] py-3 font-bold text-background-dark hover:brightness-110 transition-all">
              Start for Free
            </Link>
            <p className="text-xs text-slate-500 text-center">No credit card required. Cancel anytime.</p>
          </div>
        </div>
        <div className="mt-16 border-t border-[#10b981]/10 pt-8 text-center text-sm text-slate-500">
          © 2024 ArenaManager Systems Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
