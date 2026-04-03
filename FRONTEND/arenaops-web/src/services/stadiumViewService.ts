import seatingPlanMock from '@/mocks/seatingPlanMock.json';

export enum SeatType {
  Vip = 'VIP',
  Premium = 'Premium',
  Standard = 'Standard',
  Economy = 'Economy',
  Accessible = 'Accessible',
}

export enum GeometryType {
  Arc = 'arc',
  Rectangle = 'rectangle',
}

export enum LandmarkType {
  Stage = 'STAGE',
  Gate = 'GATE',
  Exit = 'EXIT',
  Restroom = 'RESTROOM',
}

export interface GeometryDataArc {
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
}

export interface GeometryDataRect {
  width: number;
  height: number;
  rotation: number;
}

export type SectionGeometry =
  | { geometryType: GeometryType.Arc; geometry: GeometryDataArc }
  | { geometryType: GeometryType.Rectangle; geometry: GeometryDataRect };

export interface Landmark {
  featureId: string;
  seatingPlanId: string;
  type: LandmarkType;
  label?: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
}

export interface SectionBase {
  sectionId: string;
  seatingPlanId: string;
  name: string;
  type: 'Seated' | 'Standing';
  capacity: number;
  seatType?: SeatType;
  color?: string;
  posX: number;
  posY: number;
  rows?: number;
  seatsPerRow?: number;
}

export type Section =
  | (SectionBase & { geometryType: GeometryType.Arc; geometry: GeometryDataArc })
  | (SectionBase & { geometryType: GeometryType.Rectangle; geometry: GeometryDataRect })
  | (SectionBase & { geometryType?: undefined; geometry?: undefined });

export interface FieldConfig {
  field: {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    rotation: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  };
  stage?: {
    enabled: boolean;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    rotation: number;
    fillColor?: string;
  };
  labels?: {
    show: boolean;
    fieldLabel?: string;
  };
}

export interface SeatingPlan {
  seatingPlanId: string;
  stadiumId: string;
  name: string;
  description?: string;
  fieldConfigMetadata?: string;
  fieldConfig?: FieldConfig;
  totalCapacity?: number;
  sections: Section[];
  landmarks: Landmark[];
}

type GeometryDataRaw = string | Record<string, unknown> | null | undefined;

type SectionApi = Omit<SectionBase, 'capacity' | 'posX' | 'posY'> & {
  capacity?: number | null;
  seatType?: string | null;
  posX?: number | null;
  posY?: number | null;
  rows?: number | null;
  seatsPerRow?: number | null;
  geometryType?: string | null;
  geometryData?: GeometryDataRaw;
  color?: string | null;
};

type LandmarkApi = Omit<Landmark, 'type' | 'posX' | 'posY' | 'width' | 'height'> & {
  type: string;
  posX?: number | null;
  posY?: number | null;
  width?: number | null;
  height?: number | null;
};

type SeatingPlanApi = Omit<SeatingPlan, 'sections' | 'landmarks' | 'fieldConfig'> & {
  fieldConfigMetadata?: string | null;
  sections?: SectionApi[] | null;
  landmarks?: LandmarkApi[] | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const isSeatType = (value: unknown): value is SeatType =>
  value === SeatType.Vip ||
  value === SeatType.Premium ||
  value === SeatType.Standard ||
  value === SeatType.Economy ||
  value === SeatType.Accessible;

const isLandmarkType = (value: unknown): value is LandmarkType =>
  value === LandmarkType.Stage || value === LandmarkType.Gate || value === LandmarkType.Exit || value === LandmarkType.Restroom;

const isGeometryType = (value: unknown): value is GeometryType =>
  value === GeometryType.Arc || value === GeometryType.Rectangle;

export const isGeometryDataArc = (value: unknown): value is GeometryDataArc => {
  if (!isRecord(value)) return false;
  return (
    typeof value.innerRadius === 'number' &&
    typeof value.outerRadius === 'number' &&
    typeof value.startAngle === 'number' &&
    typeof value.endAngle === 'number'
  );
};

export const isGeometryDataRect = (value: unknown): value is GeometryDataRect => {
  if (!isRecord(value)) return false;
  return typeof value.width === 'number' && typeof value.height === 'number' && typeof value.rotation === 'number';
};

const parseJsonObject = (value: unknown): unknown => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return undefined;
    }
  }
  if (isRecord(value)) return value;
  return undefined;
};

const parseSectionGeometry = (geometryTypeRaw: unknown, geometryDataRaw: unknown): Partial<SectionGeometry> => {
  if (!isGeometryType(geometryTypeRaw)) return {};
  const parsed = parseJsonObject(geometryDataRaw);

  if (geometryTypeRaw === GeometryType.Arc && isGeometryDataArc(parsed)) {
    return { geometryType: GeometryType.Arc, geometry: parsed };
  }
  if (geometryTypeRaw === GeometryType.Rectangle && isGeometryDataRect(parsed)) {
    return { geometryType: GeometryType.Rectangle, geometry: parsed };
  }
  return {};
};

const normalizeSection = (section: SectionApi): Section => {
  const geometry = parseSectionGeometry(section.geometryType, section.geometryData);
  const seatType = isSeatType(section.seatType) ? section.seatType : undefined;

  const base: SectionBase = {
    sectionId: section.sectionId,
    seatingPlanId: section.seatingPlanId,
    name: section.name,
    type: section.type,
    capacity: asNumber(section.capacity, 0),
    seatType,
    color: asString(section.color),
    posX: asNumber(section.posX, 0),
    posY: asNumber(section.posY, 0),
    rows: typeof section.rows === 'number' ? section.rows : undefined,
    seatsPerRow: typeof section.seatsPerRow === 'number' ? section.seatsPerRow : undefined,
  };

  if (geometry.geometryType === GeometryType.Arc && geometry.geometry) {
    return { ...base, geometryType: GeometryType.Arc, geometry: geometry.geometry };
  }
  if (geometry.geometryType === GeometryType.Rectangle && geometry.geometry) {
    return { ...base, geometryType: GeometryType.Rectangle, geometry: geometry.geometry };
  }
  return base;
};

const normalizeLandmark = (landmark: LandmarkApi): Landmark => {
  const type = isLandmarkType(landmark.type) ? landmark.type : LandmarkType.Gate;
  return {
    featureId: landmark.featureId,
    seatingPlanId: landmark.seatingPlanId,
    type,
    label: landmark.label,
    posX: asNumber(landmark.posX, 0),
    posY: asNumber(landmark.posY, 0),
    width: asNumber(landmark.width, 24),
    height: asNumber(landmark.height, 24),
  };
};

const normalizeFieldConfig = (fieldConfigMetadata: unknown): { fieldConfigMetadata?: string; fieldConfig?: FieldConfig } => {
  const metadata = typeof fieldConfigMetadata === 'string' ? fieldConfigMetadata : undefined;
  const parsed = parseJsonObject(fieldConfigMetadata);
  if (!metadata || !isRecord(parsed)) return { fieldConfigMetadata: metadata };

  // Minimal validation: ensure `field` exists with the required numeric properties; otherwise omit parsed config.
  if (!isRecord(parsed.field)) return { fieldConfigMetadata: metadata };
  const field = parsed.field;
  const fieldCfg: FieldConfig['field'] = {
    centerX: asNumber(field.centerX, 0),
    centerY: asNumber(field.centerY, 0),
    width: asNumber(field.width, 600),
    height: asNumber(field.height, 300),
    rotation: asNumber(field.rotation, 0),
    fillColor: asString(field.fillColor),
    strokeColor: asString(field.strokeColor),
    strokeWidth: typeof field.strokeWidth === 'number' ? field.strokeWidth : undefined,
  };

  const result: FieldConfig = { field: fieldCfg };
  if (isRecord(parsed.stage)) {
    const stage = parsed.stage;
    result.stage = {
      enabled: Boolean(stage.enabled),
      centerX: asNumber(stage.centerX, 0),
      centerY: asNumber(stage.centerY, 0),
      width: asNumber(stage.width, 420),
      height: asNumber(stage.height, 120),
      rotation: asNumber(stage.rotation, 0),
      fillColor: asString(stage.fillColor),
    };
  }
  if (isRecord(parsed.labels)) {
    const labels = parsed.labels;
    result.labels = {
      show: Boolean(labels.show),
      fieldLabel: asString(labels.fieldLabel),
    };
  }

  return { fieldConfigMetadata: metadata, fieldConfig: result };
};

const normalizeSeatingPlan = (plan: SeatingPlanApi): SeatingPlan => {
  const sections = Array.isArray(plan.sections) ? plan.sections.map(normalizeSection) : [];
  const landmarks = Array.isArray(plan.landmarks) ? plan.landmarks.map(normalizeLandmark) : [];
  const field = normalizeFieldConfig(plan.fieldConfigMetadata);

  const totalCapacity =
    typeof plan.totalCapacity === 'number' && plan.totalCapacity > 0 ? plan.totalCapacity : sections.reduce((acc, s) => acc + s.capacity, 0);

  return {
    seatingPlanId: plan.seatingPlanId,
    stadiumId: plan.stadiumId,
    name: plan.name,
    description: plan.description,
    ...field,
    totalCapacity,
    sections,
    landmarks,
  };
};

export const getSeatingPlan = async (): Promise<SeatingPlan> => {
  // Task 1 uses mock data by default; API integration comes later.
  return normalizeSeatingPlan(seatingPlanMock as SeatingPlanApi);
};

