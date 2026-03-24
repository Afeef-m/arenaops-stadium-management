"use client";

import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Wait a tick for AuthInitializer to load user from localStorage
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    if (!user && !isAuthenticated) {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
         router.push("/login");
      }
    } else if (user && !user.roles?.includes("Admin")) {
      router.push("/");
    }
  }, [isAuthenticated, user, router, isInitializing]);

  // Don't render until we have user data or finished initializing
  if (isInitializing || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  // Don't render admin panel for non-admin users
  if (!user.roles?.includes("Admin")) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
