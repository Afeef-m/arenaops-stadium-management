"use client";

import { polarToCartesian, normalizeAngle } from "./geometry";
import type { FieldConfig, LayoutSection, LayoutSeat, SeatType } from "../types";

/**
 * Seat Generation Engine
 *
 * Converts section geometry (rows, seats/row, aisles) into individual seat objects
 * with calculated canvas coordinates. Supports both arc and rectangle sections.
 */

// ============================================================================
// Constants
// ============================================================================

export const SEAT_TYPE_COLORS = {
  vip: '#FFD700',        // Gold
  premium: '#3B82F6',     // Blue
  standard: '#10B981',    // Green
  economy: '#6B7280',     // Gray
  accessible: '#EC4899',  // Pink
};

export const SEAT_RADIUS_BASE = 3;
export const SEAT_RADIUS_HOVER = 4.5;
export const SEAT_RADIUS_SELECTED = 5.5;

export const SEAT_LABEL_ZOOM_THRESHOLD = 0.7;
export const SEAT_LABEL_FONT_SIZE = 8;

// ============================================================================
// Row Label Generation
// ============================================================================

/**
 * Convert numeric index to alphabetic row label
 * Algorithm: Base-26 conversion
 *
 * Examples:
 * 0 → "A"
 * 1 → "B"
 * 25 → "Z"
 * 26 → "AA"
 * 27 → "AB"
 * 701 → "ZZ"
 * 702 → "AAA"
 */
export function toRowLabel(index: number): string {
  let value = index;
  let label = '';

  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return label;
}

// ============================================================================
// Seat Type Pricing Zone Calculation
// ============================================================================

/**
 * Determine seat type based on distance from field (for arc sections)
 *
 * Pricing zones are based on row radius ratio within section:
 * - 0-25%: VIP (closest to field)
 * - 25-50%: Premium
 * - 50-75%: Standard
 * - 75-100%: Economy (farthest from field)
 */
export function calculateSeatTypeFromRadius(
  rowRadius: number,
  innerRadius: number,
  outerRadius: number,
  defaultType?: SeatType
): SeatType {
  // If explicitly set, use that
  if (defaultType && defaultType !== 'standard') {
    return defaultType;
  }

  // Calculate position within section (0.0 to 1.0)
  const denominator = Math.max(outerRadius - innerRadius, 1);
  const ratio = Math.max(0, Math.min(1, (rowRadius - innerRadius) / denominator));

  // Assign zone based on ratio
  if (ratio < 0.25) return 'vip';
  if (ratio < 0.5) return 'premium';
  if (ratio < 0.75) return 'standard';
  return 'economy';
}

// ============================================================================
// Row Spacing & Angle Calculations
// ============================================================================

/**
 * Calculate even spacing between rows
 */
export function calculateRowSpacing(
  innerRadius: number,
  outerRadius: number,
  rowCount: number
): number {
  if (rowCount <= 1) return 0;
  return (outerRadius - innerRadius) / rowCount;
}

/**
 * Calculate angle per seat accounting for vertical aisles
 */
export function calculateAnglePerSeat(
  startAngle: number,
  endAngle: number,
  seatsPerRow: number,
  verticalAisles: number[] = []
): number {
  const angleSpan = endAngle - startAngle;
  if (seatsPerRow <= 1) return 0;

  // Account for aisle gaps: each aisle reduces total span
  const aisleCount = verticalAisles.filter(idx => idx < seatsPerRow).length;
  const aisleGapAngle = (angleSpan / seatsPerRow) * 0.5; // 50% of a seat angle
  const effectiveSpan = angleSpan - (aisleGapAngle * aisleCount);

  return effectiveSpan / (seatsPerRow - 1);
}

// ============================================================================
// Aisle Detection
// ============================================================================

/**
 * Check if a seat index should be skipped due to vertical aisle
 */
export function isVerticalAislePosition(
  seatIndex: number,
  verticalAisles: number[]
): boolean {
  return verticalAisles.includes(seatIndex);
}

/**
 * Check if a row index should be skipped due to horizontal aisle
 */
export function isHorizontalAislePosition(
  rowIndex: number,
  horizontalAisles: number[]
): boolean {
  return horizontalAisles.includes(rowIndex);
}

// ============================================================================
// Arc Section Seat Generation
// ============================================================================

/**
 * Generate seats for an arc (curved) section
 *
 * Distributes seats evenly around a circular arc, respects aisles,
 * and assigns seat types based on distance from center.
 */
export function generateArcSeats(section: LayoutSection): LayoutSeat[] {
  const seats: LayoutSeat[] = [];
  const rowSpacing = calculateRowSpacing(
    section.innerRadius,
    section.outerRadius,
    section.rows
  );

  // Angle configuration
  const startAngle = section.startAngle;
  const endAngle = section.endAngle;
  const angleSpan = endAngle - startAngle;

  // Calculate angle per seat (accounting for aisles)
  const anglePerSeat = calculateAnglePerSeat(
    startAngle,
    endAngle,
    section.seatsPerRow,
    section.verticalAisles
  );

  // Generate seats row by row
  for (let rowIndex = 0; rowIndex < section.rows; rowIndex++) {
    // Skip horizontal aisles
    if (isHorizontalAislePosition(rowIndex, section.horizontalAisles)) {
      continue;
    }

    const rowLabel = toRowLabel(rowIndex);
    const rowRadius = section.innerRadius + (rowIndex + 0.5) * rowSpacing;

    // Determine seat type based on radius (for pricing/color)
    const rowSeatType = calculateSeatTypeFromRadius(
      rowRadius,
      section.innerRadius,
      section.outerRadius,
      section.seatType
    );

    // Generate seats in this row
    let seatNumberInRow = 1;
    let currentAngle = startAngle;

    for (let seatIndex = 0; seatIndex < section.seatsPerRow; seatIndex++) {
      // Skip vertical aisles
      if (isVerticalAislePosition(seatIndex, section.verticalAisles)) {
        currentAngle += anglePerSeat * 1.5; // Account for aisle skip
        continue;
      }

      const seatNumber = seatNumberInRow++;

      // Calculate seat position using polar coordinates
      const position = polarToCartesian(
        section.centerX,
        section.centerY,
        rowRadius,
        currentAngle
      );

      // Create seat object
      const seat: LayoutSeat = {
        seatId: `${section.id}-${rowLabel}${seatNumber}`,
        sectionId: section.id,
        sectionName: section.name,
        rowNumber: rowIndex,
        rowLabel,
        seatNumber,
        x: Math.round(position.x),
        y: Math.round(position.y),
        type: rowSeatType,
        price: 0, // Set in event mode (Phase 4)
        disabled: false,
      };

      seats.push(seat);
      currentAngle += anglePerSeat;
    }
  }

  return seats;
}

// ============================================================================
// Rectangle Section Seat Generation
// ============================================================================

/**
 * Generate seats for a rectangle section
 *
 * Creates a grid of seats, respects rotation and aisles,
 * assigns uniform seat type.
 */
export function generateRectangleSeats(section: LayoutSection): LayoutSeat[] {
  const seats: LayoutSeat[] = [];

  // Rectangle dimensions
  const halfWidth = section.width / 2;
  const halfHeight = section.height / 2;
  const rotation = (section.rotation * Math.PI) / 180; // Convert to radians
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  // Calculate spacing
  const rowHeight = halfHeight * 2 / section.rows;
  const seatWidth = halfWidth * 2 / section.seatsPerRow;

  // Generate seats row by row
  for (let rowIndex = 0; rowIndex < section.rows; rowIndex++) {
    // Skip horizontal aisles
    if (isHorizontalAislePosition(rowIndex, section.horizontalAisles)) {
      continue;
    }

    const rowLabel = toRowLabel(rowIndex);

    // Row Y position (relative to center)
    const rowY =
      -halfHeight + (rowIndex + 0.5) * rowHeight - halfHeight * 0.5;

    // Generate seats in this row
    let seatNumberInRow = 1;

    for (let seatIndex = 0; seatIndex < section.seatsPerRow; seatIndex++) {
      // Skip vertical aisles
      if (isVerticalAislePosition(seatIndex, section.verticalAisles)) {
        continue;
      }

      const seatNumber = seatNumberInRow++;

      // Seat X position (relative to center)
      const seatX =
        -halfWidth + (seatIndex + 0.5) * seatWidth - halfWidth * 0.5;

      // Apply rotation transform
      const rotatedX = seatX * cos - rowY * sin;
      const rotatedY = seatX * sin + rowY * cos;

      // Translate to section center
      const finalX = section.centerX + rotatedX;
      const finalY = section.centerY + rotatedY;

      // Create seat object
      const seat: LayoutSeat = {
        seatId: `${section.id}-${rowLabel}${seatNumber}`,
        sectionId: section.id,
        sectionName: section.name,
        rowNumber: rowIndex,
        rowLabel,
        seatNumber,
        x: Math.round(finalX),
        y: Math.round(finalY),
        type: section.seatType,
        price: 0, // Set in event mode (Phase 4)
        disabled: false,
      };

      seats.push(seat);
    }
  }

  return seats;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Generate all seats for a section
 *
 * Main function that validates and dispatches to shape-specific generators.
 */
export function generateSeatsForSection(
  section: LayoutSection,
  fieldConfig?: FieldConfig
): LayoutSeat[] {
  // Validate section
  if (section.rows <= 0 || section.seatsPerRow <= 0) {
    console.warn(`Cannot generate seats for section ${section.id}: invalid row/seat count`);
    return [];
  }

  // Validate aisle indices
  const validVerticalAisles = section.verticalAisles.filter(
    idx => idx >= 0 && idx < section.seatsPerRow
  );

  const validHorizontalAisles = section.horizontalAisles.filter(
    idx => idx >= 0 && idx < section.rows
  );

  // Dispatch to shape-specific generator
  if (section.shape === 'arc') {
    return generateArcSeats({
      ...section,
      verticalAisles: validVerticalAisles,
      horizontalAisles: validHorizontalAisles,
    });
  } else {
    // rectangle
    return generateRectangleSeats({
      ...section,
      verticalAisles: validVerticalAisles,
      horizontalAisles: validHorizontalAisles,
    });
  }
}

/**
 * Batch generate all seats for all sections
 */
export function generateAllSeats(
  sections: LayoutSection[],
  fieldConfig?: FieldConfig
): LayoutSeat[] {
  return sections.flatMap(section => generateSeatsForSection(section, fieldConfig));
}
