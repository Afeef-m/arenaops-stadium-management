"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, User, Menu, X, Globe, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { logoutUser } from "@/store/authSlice";

const menu = [
  {
    name: "Dashboard",
    href: "/event-manager/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Discover Stadiums",
    href: "/event-manager/stadiums",
    icon: Globe,
  },
  {
    name: "My Events",
    href: "/event-manager/events",
    icon: CalendarDays,
  },
  {
    name: "Organization Profile",
    href: "/event-manager/profile",
    icon: User,
  },
];

export default function EventManagerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push("/auth/login");
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#050505] border-b border-white/10 text-white z-50 relative">
        <div className="font-bold tracking-widest uppercase text-sm text-[#10b981]">ARENAOPS <span className="text-white text-xs opacity-50 ml-2">EVENTS</span></div>

        <button onClick={() => setOpen(true)} className="hover:text-[#10b981] transition-colors">
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static
        top-0 left-0 z-50
        h-screen w-64
        bg-[#111827] text-gray-400
        border-r border-white/10
        flex flex-col
        transform transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        `}
      >
        {/* Mobile Close */}
        <div className="flex items-center justify-between p-6 lg:hidden border-b border-white/5">
          <span className="font-black italic tracking-tighter uppercase text-white">Event Manager</span>
          <button onClick={() => setOpen(false)} className="hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Desktop Title */}
        <div className="hidden lg:flex flex-col p-8 border-b border-white/5 mb-4">
            <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">
                Events<span className="text-[#10b981]">.</span>
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#10b981]">Manager Portal</p>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-2 px-4 flex-grow">
          {menu.map((item) => {
            const Icon = item.icon;
            // Exact match for dashboard, partial match for sub-routes
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/event-manager/dashboard");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-4 py-3 px-4 text-xs font-bold tracking-widest uppercase rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? "bg-[#10b981]/10 text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-[#10b981]/20"
                    : "hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <Icon size={18} className={`${isActive ? "text-[#10b981]" : "text-gray-500 group-hover:text-white transition-colors"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 mt-auto flex flex-col gap-4">
            <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <button
                    onClick={() => setLogoutDialogOpen(true)}
                    className="flex items-center gap-4 py-3 px-4 text-xs font-bold tracking-widest uppercase rounded-xl transition-all duration-200 text-gray-500 hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20"
                >
                    <LogOut size={18} />
                    Logout
                </button>
                <DialogContent className="bg-[#111827] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white font-black uppercase tracking-tighter italic">Confirm Logout</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Are you sure you want to logout? You will need to sign in again to access the manager portal.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end gap-3 mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5 hover:text-white font-bold uppercase tracking-widest text-[10px]">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-[10px]"
                        >
                            Logout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 text-center">
                ArenaOps Core Systems<br/>v4.2.0
            </p>
        </div>
      </aside>
    </>
  );
}
