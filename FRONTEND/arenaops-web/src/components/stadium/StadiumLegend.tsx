"use client";

import { cn } from "@/lib/utils";
import { LandmarkType, SeatType } from "@/services/stadiumViewService";

const seatTypeOrder: SeatType[] = [
  SeatType.Vip,
  SeatType.Premium,
  SeatType.Standard,
  SeatType.Economy,
  SeatType.Accessible,
];

const landmarkOrder: LandmarkType[] = [
  LandmarkType.Stage,
  LandmarkType.Gate,
  LandmarkType.Exit,
  LandmarkType.Restroom,
];

const defaultSeatTypeColors: Record<SeatType, string> = {
  [SeatType.Vip]: "#FFD700",
  [SeatType.Premium]: "#A78BFA",
  [SeatType.Standard]: "#60A5FA",
  [SeatType.Economy]: "#34D399",
  [SeatType.Accessible]: "#F97316",
};

interface StadiumLegendProps {
  seatTypeColors?: Partial<Record<SeatType, string>>;
  showSeatTypes?: boolean;
  showLandmarks?: boolean;
  className?: string;
}

const IconStage = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="7" width="18" height="10" rx="2" />
    <path d="M3 7h18" />
  </svg>
);

const IconGate = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="5" y="4" width="14" height="16" rx="2" />
    <path d="M12 4v16" />
  </svg>
);

const IconExit = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 12h10" />
    <path d="M10 8l4 4-4 4" />
    <rect x="14" y="5" width="6" height="14" rx="1.5" />
  </svg>
);

const IconRestroom = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="6" r="2.2" />
    <path d="M8.5 20v-6a3.5 3.5 0 0 1 7 0v6" />
  </svg>
);

const landmarkIcons: Record<LandmarkType, JSX.Element> = {
  [LandmarkType.Stage]: <IconStage />,
  [LandmarkType.Gate]: <IconGate />,
  [LandmarkType.Exit]: <IconExit />,
  [LandmarkType.Restroom]: <IconRestroom />,
};

export function StadiumLegend({
  seatTypeColors,
  showSeatTypes = true,
  showLandmarks = true,
  className,
}: StadiumLegendProps) {
  const resolvedSeatTypeColors: Record<SeatType, string> = {
    ...defaultSeatTypeColors,
    ...(seatTypeColors ?? {}),
  };

  return (
    <div className={cn("rounded-xl border border-white/10 bg-[#0b1220]/80 p-4 text-white", className)}>
      <div className="flex flex-wrap gap-6">
        {showSeatTypes && (
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-gray-400">Seat Types</div>
            <div className="flex flex-wrap gap-3">
              {seatTypeOrder.map((seatType) => (
                <div key={seatType} className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: resolvedSeatTypeColors[seatType] }}
                  />
                  <span>{seatType}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showLandmarks && (
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-gray-400">Landmarks</div>
            <div className="flex flex-wrap gap-3">
              {landmarkOrder.map((type) => (
                <div key={type} className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium">
                  <span className="text-emerald-300">{landmarkIcons[type]}</span>
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StadiumLegend;
