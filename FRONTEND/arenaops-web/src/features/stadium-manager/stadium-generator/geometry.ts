import type { LandmarkTemplate, SeatTemplate } from "@/components/seat-map/types";
import type {
  GeneratedRow,
  GeneratedSection,
  GeneratedStadiumLayout,
  GeneratorLayoutType,
  GeneratorMathSnapshot,
  StadiumGeneratorConfig,
  StadiumSavePayload,
} from "./types";

const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 900;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = VIEWBOX_HEIGHT / 2;
const SECTION_START_ANGLE = -90;
const OVAL_X_SCALE = 1.2;
const OVAL_Y_SCALE = 0.82;

const SECTION_COLORS = [
  "#0ea5e9",
  "#0284c7",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#f97316",
  "#ec4899",
  "#a855f7",
];

const normalizeCoord = (value: number) => Number(value.toFixed(3));

const clampInt = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, Math.round(value)));
};

const clampFloat = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const toRowLabel = (index: number): string => {
  let value = index;
  let label = "";

  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return label;
};

const toRadians = (angleInDegrees: number) => {
  return (angleInDegrees * Math.PI) / 180;
};

const pointOnCircle = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const radians = toRadians(angleInDegrees);
  return {
    x: normalizeCoord(centerX + radius * Math.cos(radians)),
    y: normalizeCoord(centerY + radius * Math.sin(radians)),
  };
};

const pointOnOval = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const radians = toRadians(angleInDegrees);
  return {
    x: normalizeCoord(centerX + radius * OVAL_X_SCALE * Math.cos(radians)),
    y: normalizeCoord(centerY + radius * OVAL_Y_SCALE * Math.sin(radians)),
  };
};

const resolveSpacedStep = (
  baseStep: number,
  itemCount: number,
  totalSpan: number,
  spacingFactor: number
) => {
  if (itemCount <= 0) {
    return 0;
  }

  const desiredStep = baseStep * spacingFactor;
  const maxStep = totalSpan / itemCount;
  return Math.min(desiredStep, maxStep);
};

const buildConfig = (config: StadiumGeneratorConfig): StadiumGeneratorConfig => {
  const totalSections = clampInt(config.totalSections, 2, 48);
  const rowsPerSection = clampInt(config.rowsPerSection, 1, 40);
  const seatsPerRow = clampInt(config.seatsPerRow, 1, 120);
  const seatSpacing = clampFloat(config.seatSpacing, 0.35, 1.8);
  const innerRadius = clampFloat(config.innerRadius, 60, 320);
  const outerRadius = clampFloat(config.outerRadius, innerRadius + 20, 360);

  return {
    totalSections,
    rowsPerSection,
    seatsPerRow,
    seatSpacing,
    innerRadius,
    outerRadius,
  };
};

export const getGeneratorMathSnapshot = (
  config: StadiumGeneratorConfig
): GeneratorMathSnapshot => {
  const normalizedConfig = buildConfig(config);
  const sectionAngle = 360 / normalizedConfig.totalSections;
  const radiusStep =
    (normalizedConfig.outerRadius - normalizedConfig.innerRadius) /
    normalizedConfig.rowsPerSection;
  const seatAngleStep = sectionAngle / normalizedConfig.seatsPerRow;

  return {
    anglePerSection: normalizeCoord(sectionAngle),
    radiusStep: normalizeCoord(radiusStep),
    seatAngleStep: normalizeCoord(seatAngleStep),
  };
};

const buildLandmarks = (
  seatingPlanId: string,
  layoutType: GeneratorLayoutType,
  innerRadius: number
): LandmarkTemplate[] => {
  const width =
    layoutType === "oval"
      ? normalizeCoord(innerRadius * 1.85)
      : normalizeCoord(innerRadius * 1.65);
  const height =
    layoutType === "oval"
      ? normalizeCoord(innerRadius * 1.15)
      : normalizeCoord(innerRadius * 1.55);

  return [
    {
      featureId: "GEN-FIELD-01",
      seatingPlanId,
      type: "FIELD",
      label: "FIELD",
      posX: normalizeCoord(CENTER_X - width / 2),
      posY: normalizeCoord(CENTER_Y - height / 2),
      width,
      height,
    },
  ];
};

interface BuildLayoutInput {
  stadiumId: string;
  layoutType: GeneratorLayoutType;
  config: StadiumGeneratorConfig;
}

export const buildGeneratedStadiumLayout = ({
  stadiumId,
  layoutType,
  config,
}: BuildLayoutInput): GeneratedStadiumLayout => {
  const normalizedConfig = buildConfig(config);
  const seatingPlanId = `${stadiumId}-generated-plan`;
  const anglePerSection = 360 / normalizedConfig.totalSections;
  const baseRadiusStep =
    (normalizedConfig.outerRadius - normalizedConfig.innerRadius) /
    normalizedConfig.rowsPerSection;
  const baseSeatAngleStep = anglePerSection / normalizedConfig.seatsPerRow;

  const radiusStep = resolveSpacedStep(
    baseRadiusStep,
    normalizedConfig.rowsPerSection,
    normalizedConfig.outerRadius - normalizedConfig.innerRadius,
    normalizedConfig.seatSpacing
  );
  const seatAngleStep = resolveSpacedStep(
    baseSeatAngleStep,
    normalizedConfig.seatsPerRow,
    anglePerSection,
    normalizedConfig.seatSpacing
  );

  const occupiedRowBand = radiusStep * normalizedConfig.rowsPerSection;
  const occupiedSeatBand = seatAngleStep * normalizedConfig.seatsPerRow;
  const firstRowRadius =
    normalizedConfig.innerRadius +
    (normalizedConfig.outerRadius - normalizedConfig.innerRadius - occupiedRowBand) / 2 +
    radiusStep / 2;
  const firstSeatAngleOffset =
    (anglePerSection - occupiedSeatBand) / 2 + seatAngleStep / 2;

  const sections: GeneratedSection[] = [];
  const rows: GeneratedRow[] = [];
  const seats: SeatTemplate[] = [];

  for (let sectionIndex = 0; sectionIndex < normalizedConfig.totalSections; sectionIndex++) {
    const sectionId = `SEC-${String(sectionIndex + 1).padStart(2, "0")}`;
    const startAngle = SECTION_START_ANGLE + sectionIndex * anglePerSection;
    const endAngle = startAngle + anglePerSection;
    const color = SECTION_COLORS[sectionIndex % SECTION_COLORS.length];
    const rowIds: string[] = [];

    for (let rowIndex = 0; rowIndex < normalizedConfig.rowsPerSection; rowIndex++) {
      const rowLabel = toRowLabel(rowIndex);
      const rowId = `${sectionId}-ROW-${rowLabel}`;
      const rowRadius = normalizeCoord(firstRowRadius + rowIndex * radiusStep);
      const seatIds: string[] = [];

      for (let seatIndex = 0; seatIndex < normalizedConfig.seatsPerRow; seatIndex++) {
        const seatNumber = seatIndex + 1;
        const seatAngle = startAngle + firstSeatAngleOffset + seatIndex * seatAngleStep;
        const point =
          layoutType === "oval"
            ? pointOnOval(CENTER_X, CENTER_Y, rowRadius, seatAngle)
            : pointOnCircle(CENTER_X, CENTER_Y, rowRadius, seatAngle);
        const seatId = `${sectionId}-${rowLabel}${seatNumber}`;

        seats.push({
          seatId,
          sectionId,
          rowLabel,
          seatNumber,
          seatLabel: `${rowLabel}${seatNumber}`,
          posX: point.x,
          posY: point.y,
          isActive: true,
          isAccessible:
            rowIndex === normalizedConfig.rowsPerSection - 1 && seatNumber % 6 === 0,
        });
        seatIds.push(seatId);
      }

      rows.push({
        rowId,
        sectionId,
        rowLabel,
        rowIndex,
        radius: rowRadius,
        radiusX:
          layoutType === "oval"
            ? normalizeCoord(rowRadius * OVAL_X_SCALE)
            : rowRadius,
        radiusY:
          layoutType === "oval"
            ? normalizeCoord(rowRadius * OVAL_Y_SCALE)
            : rowRadius,
        seatIds,
      });
      rowIds.push(rowId);
    }

    sections.push({
      sectionId,
      seatingPlanId,
      name: `Section ${sectionIndex + 1}`,
      category: "Seated",
      seatType: "Standard",
      color,
      geometry: {
        geometryType: "Arc",
        centerX: CENTER_X,
        centerY: CENTER_Y,
        innerRadius: normalizedConfig.innerRadius,
        outerRadius: normalizedConfig.outerRadius,
        startAngle,
        endAngle,
      },
      capacity: normalizedConfig.rowsPerSection * normalizedConfig.seatsPerRow,
      isActive: true,
      sectionIndex,
      startAngle,
      endAngle,
      rowIds,
    });
  }

  return {
    stadiumId,
    type: layoutType,
    config: normalizedConfig,
    sections,
    rows,
    seats,
    landmarks: buildLandmarks(seatingPlanId, layoutType, normalizedConfig.innerRadius),
    centerX: CENTER_X,
    centerY: CENTER_Y,
    viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`,
  };
};

export const buildSavePayload = (
  layout: GeneratedStadiumLayout
): StadiumSavePayload => {
  return {
    stadiumId: layout.stadiumId,
    type: layout.type,
    config: layout.config,
    sections: layout.sections,
  };
};
