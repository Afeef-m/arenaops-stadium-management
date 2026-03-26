// // src\app\(dashboard)\manager\stadiums\page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { StadiumLayoutBuilder } from "@/features/stadium-owner/stadium-layout-builder/StadiumLayoutBuilder";
import { useEffect } from "react";

/**
 * Stadium Layout Page - Now uses the new Stadium Layout Builder
 *
 * Supports both:
 * - Old URL: /manager/stadiumLayout?stadiumId=xxx
 * - New URL: /manager/stadiums/[id]/layout/builder
 */
export default function StadiumLayoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get stadiumId from query params (old URL format)
  const stadiumId = searchParams.get("stadiumId");

  useEffect(() => {
    // If old URL format detected, redirect to new format
    if (stadiumId && typeof window !== "undefined") {
      // Redirect to new URL format
      router.push(`/manager/stadiums/${stadiumId}/layout/builder`);
    }
  }, [stadiumId, router]);

  // Show loading while redirecting
  if (!stadiumId) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-gray-500">Loading layout builder...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <StadiumLayoutBuilder
        mode="template"
        stadiumId={stadiumId}
      />
    </div>
  );
}
