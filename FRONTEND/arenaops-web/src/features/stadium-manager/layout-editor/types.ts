import type { StadiumGeneratorConfig } from "@/features/stadium-manager/stadium-generator/types";

export type SectionShapeType = "rectangle" | "circle" | "oval" | "custom";
export type LayoutType = "circle" | "oval" | "custom";
export type SeatType = "vip" | "premium" | "standard" | "economy" | "accessible";

export interface SeatPricing {
  vip: number;
  premium: number;
  standard: number;
  economy: number;
  accessible: number;
}

export interface LayoutSection {
  id: string;
  type: SectionShapeType;
  seatType: SeatType;
  overrideSeatType: boolean;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  rotation: number;
  seatCount: number;
  customPath?: string;
}

export interface LayoutSaveItem {
  id: string;
  type: SectionShapeType;
  seatType: SeatType;
  overrideSeatType: boolean;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seatCount: number;
}

export interface LayoutSavePayload {
  stadiumLayout: {
    sections: LayoutSection[];
    rows: LayoutRow[];
    seats: LayoutSeat[];
  };
  layoutSettings: LayoutSettings;
  pricing: SeatPricing;
  currency: string;
  generatedAt: string;
}

export interface LayoutSettings extends StadiumGeneratorConfig {
  rowSmoothness: number;
  aisleEvery: number;
  pricing: SeatPricing;
  currency: string;
}

export interface LayoutField {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

export interface LayoutRow {
  id: string;
  sectionId: string;
  rowNumber: number;
  rowLabel: string;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  startAngle: number;
  endAngle: number;
}

export interface LayoutSeat {
  seatId: string;
  sectionId: string;
  rowNumber: number;
  rowLabel: string;
  seatNumber: number;
  x: number;
  y: number;
  type: SeatType;
  price: number;
  disabled: boolean;
}
