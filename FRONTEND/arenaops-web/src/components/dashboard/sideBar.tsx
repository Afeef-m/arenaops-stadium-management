"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Menu, X } from "lucide-react";

const menu = [
  {
    name: "Stadium Dashboard",
    href: "/manager",
    icon: LayoutDashboard,
  },
  {
    name: "Stadium Generator",
    href: "/manager/stadiumLayout",
    icon: Map,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-black text-white">
        <div className="font-semibold">ARENAOPS</div>

        <button onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static
        top-0 left-0 z-50
        h-screen w-64
        bg-[#10b981] text-gray-200
        rounded-r-3xl shadow-xl
        flex flex-col
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
        <nav className="flex flex-col gap-2 pl-3">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

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
      </aside>
    </>
  );
}