"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-lg font-semibold mb-4">Manager Panel</h2>

        <nav className="space-y-2">
          <Link
            href="/manager/stadiums"
            className={`block px-3 py-2 rounded-md transition ${
              pathname === "/manager/stadiums"
                ? "bg-green-500 text-black"
                : "hover:text-green-400"
            }`}
          >
            Stadium Generator
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-gray-100 h-[calc(100vh-72px)] overflow-hidden">
  {children}
</main>
    </div>
  );
}