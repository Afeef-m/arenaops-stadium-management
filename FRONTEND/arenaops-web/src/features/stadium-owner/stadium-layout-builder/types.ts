/**
 * Stadium Layout Builder - Type Definitions
 *
 * Core types for the stadium layout builder system used by stadium owners
 * to create reusable seating layout templates and by event managers to
 * customize layouts for specific events.
 */

// ============================================================================
// Field Configuration
// ============================================================================

export type FieldShape = 'round' | 'rectangle';
export type FieldUnit = 'yards' | 'meters';

/**
 * Field configuration with functional constraints
 * Field dimensions determine the minimum inner radius for seating layout
 */
export interface FieldConfig {
  shape: FieldShape;
  length: number;  // Functional: drives minimum inner radius calculation
  width: number;   // Functional: used for rectangle shape
  unit: FieldUnit;
  bufferZone: number;  // Distance between field edge and first row of seats

  // Calculated properties (read-only, derived from above)
  minimumInnerRadius: number;
}

export const DEFAULT_FIELD_CONFIG: FieldConfig = {
  shape: 'round',
  length: 100,
  width: 53.3,
  unit: 'yards',
  bufferZone: 15,
  minimumInnerRadius: 65,
};

// ============================================================================
// Bowl Organization
// ============================================================================

/**
 * Bowl represents a tier or level of seating (e.g., Lower Bowl, Upper Bowl, Club Level)
 * Sections are manually assigned to bowls via drag-and-drop
 */
export interface Bowl {
  id: string;  // UUID
  name: string;  // User-defined name (e.g., "Lower Bowl", "Club Level")
  color: string;  // Visual grouping color (hex)
  sectionIds: string[];  // Sections assigned to this bowl
  isActive: boolean;  // For event managers: can deactivate entire bowl
  displayOrder: number;  // Visual hierarchy (1 = closest to field, 2, 3...)
}

// ============================================================================
// Section Configuration
// ============================================================================

export type SectionShape = 'arc' | 'rectangle';
export type SeatType = 'vip' | 'premium' | 'standard' | 'economy' | 'accessible';

/**
 * Layout section represents a seating area in the stadium
 * Can be arc-shaped (curved around field) or rectangular (custom placement)
 */
export interface LayoutSection {
  id: string;  // UUID
  name: string;  // User-defined name (e.g., "Section 101")
  bowlId: string | null;  // Manual assignment to bowl (nullable if unassigned)

  // Geometry - shape determines which properties are used
  shape: SectionShape;
  centerX: number;  // Center point for arcs, top-left for rectangles
  centerY: number;

  // Arc geometry (used if shape === 'arc')
  innerRadius: number;
  outerRadius: number;
  startAngle: number;  // Degrees (0° = right, 90° = top, 180° = left, 270° = bottom)
  endAngle: number;    // Degrees

  // Rectangle geometry (used if shape === 'rectangle')
  width: number;
  height: number;
  rotation: number;  // Degrees

  // Seating configuration
  rows: number;  // Typical: 25-40
  seatsPerRow: number;  // Typical: 20-30
  calculatedCapacity: number;  // rows × seatsPerRow (minus aisles)
  seatType: SeatType;  // Default seat type for this section

  // Aisles (indices where aisles exist)
  verticalAisles: number[];  // Seat indices (e.g., [10, 20] means aisle after seat 10 and 20)
  horizontalAisles: number[];  // Row indices (e.g., [15] means aisle after row 15)

  // State
  isActive: boolean;  // For event managers: can deactivate section
  isLocked: boolean;  // Prevents editing
  color: string;  // Visual customization
}

// ============================================================================
// Seat Configuration
// ============================================================================

/**
 * Individual seat in a section
 * Generated from section configuration with aisles applied
 */
export interface LayoutSeat {
  seatId: string;  // Unique identifier
  sectionId: string;  // Parent section
  rowNumber: number;  // 0-indexed row number
  rowLabel: string;  // Display label (A, B, C...)
  seatNumber: number;  // 1-indexed seat number within row
  x: number;  // Canvas X coordinate
  y: number;  // Canvas Y coordinate
  type: SeatType;  // Can override section default
  price: number;  // Pricing (0 in template mode, set in event mode)
  disabled: boolean;  // Manually disabled seat
}

// ============================================================================
// Capacity Validation
// ============================================================================

export interface CapacityConstraints {
  section: { min: number; max: number };
  total: { min: number; max: number };
  sectionsCount: { min: number; max: number };
  rowsPerSection: { min: number; max: number };
  seatsPerRow: { min: number; max: number };
}

export const DEFAULT_CONSTRAINTS: CapacityConstraints = {
  section: { min: 600, max: 1200 },
  total: { min: 20000, max: 90000 },
  sectionsCount: { min: 40, max: 80 },
  rowsPerSection: { min: 25, max: 40 },
  seatsPerRow: { min: 20, max: 30 },
};

export type WarningSeverity = 'info' | 'warning' | 'error';

export interface CapacityWarning {
  id: string;
  severity: WarningSeverity;
  message: string;
  sectionId?: string;  // If warning relates to specific section
  field: string;  // 'totalCapacity' | 'sectionCount' | 'sectionCapacity'
  current: number;
  expected: { min: number; max: number };
}

// ============================================================================
// Layout Builder State
// ============================================================================

export type EditorMode = 'stadium' | 'section-detail';
export type ViewMode = 'overview' | 'rows' | 'seats' | 'section-focus';
export type BuilderMode = 'template' | 'event';

/**
 * Main state interface for the layout builder
 */
export interface LayoutBuilderState {
  // Mode
  mode: BuilderMode;  // 'template' (stadium owner) or 'event' (event manager)
  stadiumId: string;
  eventId?: string;  // Required if mode === 'event'

  // Configuration
  fieldConfig: FieldConfig;
  bowls: Bowl[];
  sections: LayoutSection[];
  seats: LayoutSeat[];  // Generated from sections

  // UI State
  selectedSectionId: string | null;
  selectedSeatIds: Set<string>;
  editorMode: EditorMode;  // 'stadium' (overview) or 'section-detail' (zoomed)
  viewMode: ViewMode;  // How to render seats

  // Validation
  validation: CapacityWarning[];

  // Flags
  isLayoutLocked: boolean;  // For event mode: prevents editing after lock
  isDirty: boolean;  // Unsaved changes
}

// ============================================================================
// Canvas State
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface CanvasState {
  zoom: number;  // 0.3 to 5.0
  pan: Point;    // Canvas pan offset
  canvasWidth: number;  // 1400
  canvasHeight: number;  // 900
}

export interface DragState {
  sectionId: string;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
}

// ============================================================================
// Selection State (Phase 5)
// ============================================================================

export type SelectionMode = 'click' | 'drag-rect' | 'range';

export interface SelectionRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  seatCount: number;  // Number of seats within bounds
}

export interface SelectionState {
  selectionStart?: Point;  // mouseDown point
  selectionEnd?: Point;    // current point during drag
  selectionMode: SelectionMode;  // Current mode
  selectionPreview: SelectionRectangle | null;  // For rectangle visualization
  lastSelectedSeatId: string | null;  // For Ctrl+click range selection
}

// ============================================================================
// API Payloads
//============================================================================

export interface SaveTemplatePayload {
  name: string;
  description?: string;
  metadata: {
    fieldConfig: FieldConfig;
    bowls: Bowl[];
    layoutSettings: LayoutSettings;
  };
}

export interface LayoutSettings {
  totalSections: number;
  defaultRowsPerSection: number;
  defaultSeatsPerRow: number;
  radiusIncrement: number;
}

export interface BulkCreateSectionsPayload {
  sections: Array<{
    name: string;
    type: 'Seated' | 'Standing';
    capacity: number;
    color: string;
    positionX: number;
    positionY: number;
    metadata: {
      bowlId: string | null;
      shape: SectionShape;
      geometry: ArcGeometry | RectangleGeometry;
      rows: number;
      seatsPerRow: number;
      seatType: SeatType;
      verticalAisles: number[];
      horizontalAisles: number[];
    };
  }>;
}

export interface ArcGeometry {
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
}

export interface RectangleGeometry {
  width: number;
  height: number;
  rotation: number;
}

export interface BulkCreateSeatsPayload {
  seats: Array<{
    rowLabel: string;
    seatNumber: number;
    seatLabel: string;
    posX: number;
    posY: number;
    isAccessible: boolean;
  }>;
}

// ============================================================================
// Auto-save Draft
// ============================================================================

export interface LayoutDraft {
  fieldConfig: FieldConfig;
  bowls: Bowl[];
  sections: LayoutSection[];
  timestamp: number;
}

// ============================================================================
// Seat Pricing
// ============================================================================

export interface SeatPricing {
  vip: number;
  premium: number;
  standard: number;
  economy: number;
  accessible: number;
}

export const DEFAULT_PRICING: SeatPricing = {
  vip: 180,
  premium: 120,
  standard: 80,
  economy: 50,
  accessible: 60,
};

// ============================================================================
// Section Create/Update Requests
// ============================================================================

export interface SectionCreateRequest {
  name: string;
  shape: SectionShape;
  centerX: number;
  centerY: number;

  // Arc geometry (if shape === 'arc')
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;

  // Rectangle geometry (if shape === 'rectangle')
  width?: number;
  height?: number;
  rotation?: number;

  // Seating configuration
  rows: number;
  seatsPerRow: number;
  seatType: SeatType;
  verticalAisles?: number[];
  horizontalAisles?: number[];

  // Bowl assignment (optional)
  bowlId?: string | null;

  // Display
  color?: string;
  isActive?: boolean;
}

// ============================================================================
// Helper Type Guards
// ============================================================================

export function isArcSection(section: LayoutSection): boolean {
  return section.shape === 'arc';
}

export function isRectangleSection(section: LayoutSection): boolean {
  return section.shape === 'rectangle';
}

export function hasWarnings(warnings: CapacityWarning[], severity: WarningSeverity): boolean {
  return warnings.some(w => w.severity === severity);
}
