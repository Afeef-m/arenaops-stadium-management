"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LandmarkType, SeatType, type SeatingPlan } from "@/services/stadiumViewService";

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

interface CapacitySummaryPanelProps {
  seatingPlan: SeatingPlan;
  seatTypeColors?: Partial<Record<SeatType, string>>;
  className?: string;
}

const formatNumber = (value: number): string => new Intl.NumberFormat("en-US").format(value);

export function CapacitySummaryPanel({ seatingPlan, seatTypeColors, className }: CapacitySummaryPanelProps) {
  const sections = seatingPlan.sections ?? [];
  const landmarks = seatingPlan.landmarks ?? [];

  const seatTypeTotals = seatTypeOrder.reduce<Record<SeatType, number>>((acc, seatType) => {
    acc[seatType] = 0;
    return acc;
  }, {} as Record<SeatType, number>);

  const sectionTypeCounts = sections.reduce(
    (acc, section) => {
      if (section.type === "Seated") acc.seated += 1;
      if (section.type === "Standing") acc.standing += 1;
      if (section.seatType) acc.bySeatType[section.seatType] += section.capacity;
      return acc;
    },
    { seated: 0, standing: 0, bySeatType: seatTypeTotals }
  );

  const landmarkCounts = landmarkOrder.reduce<Record<LandmarkType, number>>((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<LandmarkType, number>);

  landmarks.forEach((landmark) => {
    if (landmarkCounts[landmark.type] !== undefined) {
      landmarkCounts[landmark.type] += 1;
    }
  });

  const totalCapacity =
    typeof seatingPlan.totalCapacity === "number"
      ? seatingPlan.totalCapacity
      : sections.reduce((acc, section) => acc + section.capacity, 0);

  const resolvedSeatTypeColors: Record<SeatType, string> = {
    ...defaultSeatTypeColors,
    ...(seatTypeColors ?? {}),
  };

  return (
    <Card className={cn("border-white/10 bg-[#0b1220]/80 text-white", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Capacity Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-widest text-gray-400">Total Capacity</div>
          <div className="mt-2 text-3xl font-bold">{formatNumber(totalCapacity)}</div>
        </div>

        <div>
          <div className="mb-3 text-xs uppercase tracking-widest text-gray-400">Seat Type Breakdown</div>
          <div className="space-y-2">
            {seatTypeOrder.map((seatType) => (
              <div key={seatType} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: resolvedSeatTypeColors[seatType] }}
                  />
                  <span className="text-sm font-medium">{seatType}</span>
                </div>
                <span className="text-sm font-semibold">{formatNumber(sectionTypeCounts.bySeatType[seatType])}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-widest text-gray-400">Seated Sections</div>
            <div className="mt-2 text-lg font-semibold">{sectionTypeCounts.seated}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-widest text-gray-400">Standing Sections</div>
            <div className="mt-2 text-lg font-semibold">{sectionTypeCounts.standing}</div>
          </div>
        </div>

        <div>
          <div className="mb-3 text-xs uppercase tracking-widest text-gray-400">Landmarks</div>
          <div className="grid grid-cols-2 gap-2">
            {landmarkOrder.map((type) => (
              <div key={type} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-sm font-medium">{type}</span>
                <span className="text-sm font-semibold">{landmarkCounts[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CapacitySummaryPanel;
