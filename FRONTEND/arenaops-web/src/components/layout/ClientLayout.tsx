"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navfooter/Navbar";
import Footer from "@/components/navfooter/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <>
      {!isAuthPage && <Navbar />}

      {/* push page below navbar */}
      <main className={!isAuthPage ? "pt-20" : ""}>
        {children}
      </main>

      {!isAuthPage && <Footer />}
    </>
  );
}