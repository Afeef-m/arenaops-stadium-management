import type {
  LandmarkTemplate,
  SeatTemplate,
  SectionTemplate,
} from "@/components/seat-map/types";

export type GeneratorLayoutType = "circle" | "oval";

export interface StadiumGeneratorConfig {
  totalSections: number;
  rowsPerSection: number;
  seatsPerRow: number;
  seatSpacing: number;
  innerRadius: number;
  outerRadius: number;
}

export interface GeneratedRow {
  rowId: string;
  sectionId: string;
  rowLabel: string;
  rowIndex: number;
  radius: number;
  radiusX: number;
  radiusY: number;
  seatIds: string[];
}

export interface GeneratedSection extends SectionTemplate {
  sectionIndex: number;
  startAngle: number;
  endAngle: number;
  rowIds: string[];
}

export interface GeneratedStadiumLayout {
  stadiumId: string;
  type: GeneratorLayoutType;
  config: StadiumGeneratorConfig;
  sections: GeneratedSection[];
  rows: GeneratedRow[];
  seats: SeatTemplate[];
  landmarks: LandmarkTemplate[];
  centerX: number;
  centerY: number;
  viewBox: string;
}

export interface StadiumSavePayload {
  stadiumId: string;
  type: GeneratorLayoutType;
  config: StadiumGeneratorConfig;
  sections: SectionTemplate[];
}

export interface GeneratorMathSnapshot {
  anglePerSection: number;
  radiusStep: number;
  seatAngleStep: number;
}
