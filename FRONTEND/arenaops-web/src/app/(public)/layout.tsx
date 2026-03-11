// src\app\(public)\layout.tsx

"use client";

import Navbar from "@/components/navfooter/Navbar";
import Footer from "@/components/navfooter/Footer";
import { usePathname } from "next/navigation";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <>
      {!isAuthPage && <Navbar />}

      <main className={!isAuthPage ? "pt-20" : ""}>
        {children}
      </main>

      {!isAuthPage && <Footer />}
    </>
  );
}