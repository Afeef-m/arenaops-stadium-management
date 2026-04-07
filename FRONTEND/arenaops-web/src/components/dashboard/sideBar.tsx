"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { LayoutDashboard, Menu, X, PlusCircle, User, LogOut, Grid3X3 } from "lucide-react";
import { AppDispatch } from "@/store/store";
import { logoutUser } from "@/store/authSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const menu = [
  {
    name: "Dashboard",
    href: "/manager",
    icon: LayoutDashboard,
  },
  {
    name: "Create Stadium",
    href: "/manager/stadiums/create",
    icon: PlusCircle,
  },
  {
    name: "Stadium Layout",
    href: "/manager/stadiumLayout",
    icon: Grid3X3,
  },
  {
    name: "Profile",
    href: "/manager/profile",
    icon: User,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push("/");
    setLogoutOpen(false);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-black text-white border-b border-white/10 shrink-0">
        <div className="font-semibold text-emerald-400">ARENAOPS</div>

        <button onClick={() => setOpen(true)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <Menu size={22} />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static
        top-0 left-0 z-50
        h-full w-64
        bg-[#10b981] text-gray-200
        lg:rounded-r-3xl shadow-xl
        flex flex-col shrink-0
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        `}
      >
        {/* Mobile Close */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <span className="font-semibold">Stadium Manager</span>
          <button onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Desktop Title */}
        <div className="hidden lg:block p-6 text-xl font-semibold">
          Stadium Manager
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-2 pl-3 flex-1">
          {menu.map((item) => {
            const Icon = item.icon;
            // Dashboard is exact match, others check if path starts with href
            const isActive = item.href === "/manager"
              ? pathname === "/manager"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 py-3 pr-6 pl-4 text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-gray-100 text-[#10b981] rounded-l-full shadow-md"
                    : "text-gray-200 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/20">
          <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-3 w-full py-3 px-4 text-sm font-medium text-gray-200 hover:text-white hover:bg-red-500/30 rounded-lg transition-all"
              >
                <LogOut size={18} />
                Logout
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#111827] border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Confirm Logout</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Are you sure you want to logout? You will need to sign in again to access your account.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="bg-transparent border-t border-white/5 pt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5 hover:text-white">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Logout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </aside>
    </>
  );
}
