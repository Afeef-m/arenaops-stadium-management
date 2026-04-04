"use client";

import { cn } from "@/lib/utils";
import type { Section } from "@/services/stadiumViewService";

interface SectionDetailTooltipProps {
  section: Section | null;
  isPinned?: boolean;
  position?: { x: number; y: number };
  className?: string;
}

export function SectionDetailTooltip({ section, isPinned = false, position, className }: SectionDetailTooltipProps) {
  if (!section) return null;

  const style = position ? { left: position.x, top: position.y } : undefined;

  return (
    <div
      style={style}
      className={cn(
        "z-50 w-64 rounded-xl border border-white/10 bg-[#0b1220]/95 p-4 text-white shadow-2xl backdrop-blur",
        position ? "absolute" : "relative",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-400">Section</div>
          <div className="mt-1 text-lg font-semibold">{section.name}</div>
        </div>
        {isPinned && (
          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
            Pinned
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Type</span>
          <span className="font-medium">{section.type}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Seat Type</span>
          <span className="font-medium">{section.seatType ?? "Unspecified"}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Capacity</span>
          <span className="font-semibold">{section.capacity.toLocaleString()}</span>
        </div>

        {section.type === "Seated" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Rows</span>
              <span className="font-medium">{section.rows ?? "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Seats/Row</span>
              <span className="font-medium">{section.seatsPerRow ?? "N/A"}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SectionDetailTooltip;
