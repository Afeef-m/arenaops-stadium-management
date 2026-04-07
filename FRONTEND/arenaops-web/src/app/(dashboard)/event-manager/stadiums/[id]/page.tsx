"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { coreService } from "@/services/coreService";
import type { Stadium } from "@/services/coreService";
import BowlLayoutMap from "@/components/stadium/BowlLayoutMap";

export default function StadiumDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [stadium, setStadium] = useState<Stadium | null>(null);
    const [seatingPlanId, setSeatingPlanId] = useState<string | null>(null);
    const [loadingHeader, setLoadingHeader] = useState(true);

    const loadHeader = useCallback(async () => {
        if (!id) return;
        try {
            const [stadiumRes, plansRes] = await Promise.all([
                coreService.getStadium(id),
                coreService.getSeatingPlans(id),
            ]);
            if (stadiumRes.success) setStadium(stadiumRes.data);
            if (plansRes.success && plansRes.data.length > 0) {
                setSeatingPlanId(plansRes.data[0].seatingPlanId);
            }
        } catch (e) {
            console.error("Failed to load stadium header:", e);
        } finally {
            setLoadingHeader(false);
        }
    }, [id]);

    useEffect(() => { loadHeader(); }, [loadHeader]);

    if (!id) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page header */}
            <div className="flex items-center gap-4 pb-5 border-b border-white/5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-white hover:bg-white/5 flex-shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-w-0">
                    {loadingHeader ? (
                        <>
                            <Skeleton className="h-7 w-56 bg-white/5 mb-1.5" />
                            <Skeleton className="h-4 w-40 bg-white/5" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-black italic tracking-tighter text-white truncate">
                                {stadium?.name ?? "Stadium"}
                            </h1>
                            {stadium && (
                                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {stadium.city}, {stadium.state} · {stadium.country}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Bowl map */}
            <div className="rounded-2xl border border-white/5 bg-[#0b1220]/80 p-5">
                <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                        Seating Configuration
                    </div>
                    <div className="text-lg font-bold text-white">Bowl Zone Layout</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        Seating tiers and capacity breakdown by zone
                    </div>
                </div>

                {seatingPlanId ? (
                    <BowlLayoutMap seatingPlanId={seatingPlanId} />
                ) : loadingHeader ? (
                    <div className="flex items-center gap-3 py-12 text-gray-500 text-sm">
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                                strokeLinecap="round" strokeDasharray="31.4 31.4" />
                        </svg>
                        Loading seating plan…
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 py-10 text-center">
                        No seating plan found for this stadium.
                    </div>
                )}
            </div>
        </div>
    );
}
