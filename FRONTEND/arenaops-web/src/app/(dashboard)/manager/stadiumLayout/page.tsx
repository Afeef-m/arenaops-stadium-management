"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { StadiumLayoutBuilder } from "@/features/stadium-owner/stadium-layout-builder/StadiumLayoutBuilder";
import { useEffect, useState } from "react";
import { coreService, type Stadium } from "@/services/coreService";
import { Building2, Grid3X3, Loader2 } from "lucide-react";

/**
 * Stadium Layout Page
 *
 * Supports:
 * - Direct access with stadiumId: /manager/stadiumLayout?stadiumId=xxx
 *   → Redirects to /manager/stadiums/[id]/layout/builder
 * - Sidebar navigation (no stadiumId): /manager/stadiumLayout
 *   → Shows a stadium picker so the user can choose which stadium to open
 */
export default function StadiumLayoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const stadiumId = searchParams.get("stadiumId");

  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If stadiumId is provided, redirect to the dedicated builder route
    if (stadiumId && typeof window !== "undefined") {
      router.push(`/manager/stadiums/${stadiumId}/layout/builder`);
      return;
    }

    // Otherwise, load the user's stadiums so they can pick one
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (userData.userId) {
        coreService
          .getStadiumsByOwner(userData.userId)
          .then((res) => {
            if (res.success && res.data) {
              setStadiums(res.data);
            }
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, [stadiumId, router]);

  // Redirecting...
  if (stadiumId) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Loading stadiums
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // No stadiums
  if (stadiums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[60vh] gap-4">
        <Building2 size={48} className="text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">No Stadiums Found</h2>
        <p className="text-gray-500 text-sm">
          Create a stadium first, then come back to build its seating layout.
        </p>
        <button
          onClick={() => router.push("/manager/stadiums/create")}
          className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          Create Stadium
        </button>
      </div>
    );
  }

  // Stadium picker
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Stadium Layout Builder</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a stadium to create or edit its seating layout template.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stadiums.map((stadium) => (
          <button
            key={stadium.stadiumId}
            onClick={() =>
              router.push(`/manager/stadiums/${stadium.stadiumId}/layout/builder`)
            }
            className="group text-left p-5 bg-white border border-gray-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <Grid3X3 size={20} className="text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate">{stadium.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {stadium.city}, {stadium.country}
                </p>
                {stadium.capacity && (
                  <p className="text-xs text-gray-400 mt-1">
                    {stadium.capacity.toLocaleString()} capacity
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Open Layout Builder →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
