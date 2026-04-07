"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { coreService } from "@/services/coreService";
import type { SeatingPlan, Section } from "@/services/stadiumViewService";
import { CapacitySummaryPanel } from "@/components/stadium/CapacitySummaryPanel";
import { StadiumLegend } from "@/components/stadium/StadiumLegend";
import { SectionDetailTooltip } from "@/components/stadium/SectionDetailTooltip";
import { StadiumCanvas } from "@/components/stadium/StadiumCanvas";

interface StadiumLayoutViewProps {
  stadiumId: string;
  className?: string;
}

export function StadiumLayoutView({ stadiumId, className }: StadiumLayoutViewProps) {
  const [seatingPlan, setSeatingPlan] = useState<SeatingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<Section | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    // First, fetch the seating plans for the stadium
    coreService
      .getSeatingPlans(stadiumId)
      .then((response) => {
        if (!active) return;
        
        if (!response.success || !response.data || response.data.length === 0) {
          setError("No seating plan found for this stadium.");
          setLoading(false);
          return;
        }
        
        // Get the first seating plan (assuming 1:1 relationship)
        const seatingPlanId = response.data[0].seatingPlanId;
        
        // Now fetch the full seating plan with sections and landmarks
        return coreService.getStadiumViewSeatingPlan(seatingPlanId);
      })
      .then((plan) => {
        if (!active || !plan) return;
        setSeatingPlan(plan);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load stadium layout:", err);
        setError("Unable to load stadium layout.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [stadiumId]);

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Skeleton className="h-12 w-64 bg-white/5" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-[600px] w-full rounded-2xl bg-white/5" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
            <Skeleton className="h-40 w-full rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!seatingPlan || error) {
    return (
      <div className={cn("rounded-2xl border border-white/10 bg-[#0b1220]/80 p-6 text-white", className)}>
        <div className="text-sm uppercase tracking-widest text-rose-300">Layout Error</div>
        <div className="mt-2 text-lg font-semibold">{error ?? "No seating plan available."}</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <div className="text-xs uppercase tracking-widest text-gray-400">View Stadium Layout</div>
        <div className="mt-2 text-2xl font-semibold text-white">{seatingPlan.name}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="relative h-[600px] rounded-2xl border border-white/10 bg-[#0b1220]/80 p-3">
          <StadiumCanvas
            sections={seatingPlan.sections}
            landmarks={seatingPlan.landmarks}
            fieldConfig={seatingPlan.fieldConfig}
            bowls={seatingPlan.bowls}
            onHoverChange={(payload) => {
              setHoveredSection(payload.section);
              setCursorPosition(payload.position);
            }}
          />
          {hoveredSection && cursorPosition && (
            <SectionDetailTooltip
              section={hoveredSection}
              position={{ x: cursorPosition.x + 12, y: cursorPosition.y + 12 }}
            />
          )}
        </div>

        <div className="space-y-4">
          <CapacitySummaryPanel seatingPlan={seatingPlan} />
          <StadiumLegend />
        </div>
      </div>
    </div>
  );
}

export default StadiumLayoutView;
