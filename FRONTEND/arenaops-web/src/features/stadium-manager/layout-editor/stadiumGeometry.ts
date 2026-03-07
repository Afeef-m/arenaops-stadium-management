import type {
  LayoutField,
  LayoutRow,
  LayoutSeat,
  LayoutSection,
  LayoutSettings,
  LayoutType,
  SeatType,
} from "./types";
import { getRowLabel } from "./utils/rowLabel";

type StadiumLayout = {
  field: LayoutField;
  sections: LayoutSection[];
  rows: LayoutRow[];
  seats: LayoutSeat[];
};

const DEFAULT_START_ANGLE = -90;

const clampInt = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, Math.round(value)));
};

const clampFloat = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const normalizeCoord = (value: number) => Number(value.toFixed(3));

const toRadians = (angleInDegrees: number) => (angleInDegrees * Math.PI) / 180;

const polarToEllipse = (
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  angle: number
) => {
  const radians = toRadians(angle);
  return {
    x: normalizeCoord(centerX + radiusX * Math.cos(radians)),
    y: normalizeCoord(centerY + radiusY * Math.sin(radians)),
  };
};

const describeArcSegment = (
  centerX: number,
  centerY: number,
  innerRadiusX: number,
  innerRadiusY: number,
  outerRadiusX: number,
  outerRadiusY: number,
  startAngle: number,
  endAngle: number
) => {
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToEllipse(centerX, centerY, outerRadiusX, outerRadiusY, startAngle);
  const outerEnd = polarToEllipse(centerX, centerY, outerRadiusX, outerRadiusY, endAngle);
  const innerEnd = polarToEllipse(centerX, centerY, innerRadiusX, innerRadiusY, endAngle);
  const innerStart = polarToEllipse(centerX, centerY, innerRadiusX, innerRadiusY, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadiusX} ${outerRadiusY} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadiusX} ${innerRadiusY} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
};

const buildField = (
  centerX: number,
  centerY: number,
  innerRadius: number,
  layoutType: LayoutType
): LayoutField => {
  const xScale = layoutType === "oval" ? 1.25 : 1;
  const yScale = layoutType === "oval" ? 0.9 : 0.95;
  const width = normalizeCoord(innerRadius * 1.6 * xScale);
  const height = normalizeCoord(innerRadius * 0.95 * yScale);

  return {
    x: normalizeCoord(centerX - width / 2),
    y: normalizeCoord(centerY - height / 2),
    width,
    height,
    radius: Math.min(width, height) * 0.08,
  };
};

export const resolveSeatTypeForRadius = (
  rowRadius: number,
  innerRadius: number,
  outerRadius: number
): Exclude<SeatType, "accessible"> => {
  const denominator = Math.max(outerRadius - innerRadius, 1);
  const ratio = clampFloat((rowRadius - innerRadius) / denominator, 0, 1);

  if (ratio < 0.25) return "vip";
  if (ratio < 0.5) return "premium";
  if (ratio < 0.75) return "standard";
  return "economy";
};

export const SECTION_PALETTE: string[] = [
  "#4F9CF9",
  "#34C759",
  "#FFD60A",
  "#FF6B6B",
  "#A78BFA",
  "#00C2A8",
  "#FF9F43",
  "#6EE7B7",
];

export const buildStadiumLayout = (
  layoutType: LayoutType,
  settings: LayoutSettings,
  canvasWidth: number,
  canvasHeight: number
): StadiumLayout => {
  const totalSections = clampInt(settings.totalSections, 4, 32);
  const rowsPerSection = clampInt(settings.rowsPerSection, 1, 40);
  const seatsPerRow = clampInt(settings.seatsPerRow, 1, 120);
  const aisleEvery = clampInt(settings.aisleEvery, 0, 30);
  const innerRadius = clampFloat(settings.innerRadius, 80, canvasWidth / 2 - 120);
  const outerRadius = clampFloat(settings.outerRadius, innerRadius + 40, canvasWidth / 2 - 40);
  const pricing = settings.pricing;

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  const anglePerSection = 360 / totalSections;
  const xScale = layoutType === "oval" ? 1.2 : 1;
  const yScale = layoutType === "oval" ? 0.85 : 1;

  const innerRadiusX = innerRadius * xScale;
  const innerRadiusY = innerRadius * yScale;
  const outerRadiusX = outerRadius * xScale;
  const outerRadiusY = outerRadius * yScale;

  const sections: LayoutSection[] = [];
  const seatCount = rowsPerSection * seatsPerRow;
  const rows: LayoutRow[] = [];
  const seats: LayoutSeat[] = [];

  if (layoutType === "custom") {
    return {
      field: buildField(centerX, centerY, innerRadius, "circle"),
      sections,
      rows,
      seats,
    };
  }

  const rowSpacing = (outerRadius - innerRadius) / rowsPerSection;

  for (let index = 0; index < totalSections; index += 1) {
    const startAngle = DEFAULT_START_ANGLE + index * anglePerSection;
    const endAngle = startAngle + anglePerSection;
    const localCenterX = outerRadiusX;
    const localCenterY = outerRadiusY;
    const path = describeArcSegment(
      localCenterX,
      localCenterY,
      innerRadiusX,
      innerRadiusY,
      outerRadiusX,
      outerRadiusY,
      startAngle,
      endAngle
    );

    const sectionId = `SEC-${String(index + 1).padStart(2, "0")}`;
    sections.push({
      id: sectionId,
      type: "custom",
      seatType: "standard",
      overrideSeatType: false,
      color: SECTION_PALETTE[index % SECTION_PALETTE.length] ?? "#4F9CF9",
      x: normalizeCoord(centerX - outerRadiusX),
      y: normalizeCoord(centerY - outerRadiusY),
      width: normalizeCoord(outerRadiusX * 2),
      height: normalizeCoord(outerRadiusY * 2),
      radius: 0,
      rotation: 0,
      seatCount,
      customPath: path,
    });

    const aisleGapCount =
      aisleEvery > 0 ? Math.floor((seatsPerRow - 1) / aisleEvery) : 0;
    const baseAngleSpan = endAngle - startAngle;
    const gapAngle = baseAngleSpan / seatsPerRow * 0.6;
    const effectiveSpan = baseAngleSpan - gapAngle * aisleGapCount;
    const seatAngleStep =
      seatsPerRow > 1 ? effectiveSpan / (seatsPerRow - 1) : 0;

    for (let rowIndex = 0; rowIndex < rowsPerSection; rowIndex += 1) {
      const rowNumber = rowIndex + 1;
      const rowLabel = getRowLabel(rowIndex);
      const rowRadius = innerRadius + rowIndex * rowSpacing;
      const radiusX = rowRadius * xScale;
      const radiusY = rowRadius * yScale;
      const rowId = `${sectionId}-${rowLabel}`;

      rows.push({
        id: rowId,
        sectionId,
        rowNumber,
        rowLabel,
        centerX,
        centerY,
        radiusX: normalizeCoord(radiusX),
        radiusY: normalizeCoord(radiusY),
        startAngle,
        endAngle,
      });

      const zoneSeatType = resolveSeatTypeForRadius(
        rowRadius,
        innerRadius,
        outerRadius
      );
      const seatPrice = pricing[zoneSeatType];

      for (let seatIndex = 0; seatIndex < seatsPerRow; seatIndex += 1) {
        const seatNumber = seatIndex + 1;
        const gapCount =
          aisleEvery > 0 ? Math.floor(seatIndex / aisleEvery) : 0;
        const seatAngle = startAngle + seatIndex * seatAngleStep + gapCount * gapAngle;
        const point = polarToEllipse(centerX, centerY, radiusX, radiusY, seatAngle);
        seats.push({
          seatId: `${sectionId}-${rowLabel}-${seatNumber}`,
          sectionId,
          rowNumber,
          rowLabel,
          seatNumber,
          x: point.x,
          y: point.y,
          type: zoneSeatType,
          price: seatPrice,
          disabled: false,
        });
      }
    }
  }

  return {
    field: buildField(centerX, centerY, innerRadius, layoutType),
    sections,
    rows,
    seats,
  };
};
