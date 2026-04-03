/**
 * Selection Algorithms for Stadium Layout Builder
 *
 * Provides utilities for advanced seat selection:
 * - Drag-rectangle selection (seats within bounding box)
 * - Ctrl+click range selection (linear row range in same section)
 * - Point-in-polygon tests for future lasso selection
 */

import type { Point, LayoutSeat, LayoutSection } from '../types';

// ============================================================================
// Drag-Rectangle Selection
// ============================================================================

/**
 * Find all seats within a bounding rectangle
 * Used for drag-select rectangle functionality
 *
 * @param rect - Bounding rectangle with x, y, width, height
 * @param allSeats - All available seats to filter
 * @returns Set of seat IDs within the rectangle
 */
export function getSeatsBoundingRect(
  rect: { x: number; y: number; width: number; height: number },
  allSeats: LayoutSeat[]
): Set<string> {
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);

  const selectedSeatIds = new Set<string>();

  for (const seat of allSeats) {
    // Check if seat center is within bounds
    // Seat radius is 8px, so we check the center point
    if (seat.x >= minX && seat.x <= maxX && seat.y >= minY && seat.y <= maxY) {
      selectedSeatIds.add(seat.seatId);
    }
  }

  return selectedSeatIds;
}

/**
 * Calculate the bounding rectangle from two points
 * Used when dragging to define selection area
 *
 * @param start - Start point (mouseDown)
 * @param end - End point (current mouse position)
 * @returns Normalized rectangle
 */
export function calculateBoundingRect(
  start: Point,
  end: Point
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

/**
 * Calculate distance between two points (2D Euclidean distance)
 * Used to detect drag threshold (5px minimum)
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance in pixels
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ============================================================================
// Ctrl+Click Range Selection
// ============================================================================

/**
 * Get all seats in a row range within a section
 * Used for Ctrl+click range selection between two seats in same section
 *
 * Selects all seats from minRow to maxRow (inclusive), maintaining within same section
 *
 * @param startSeatId - First seat ID
 * @param endSeatId - Second seat ID
 * @param section - Section containing both seats
 * @param allSeats - All available seats
 * @returns Set of seat IDs in the range
 */
export function getRangeSelection(
  startSeatId: string,
  endSeatId: string,
  section: LayoutSection,
  allSeats: LayoutSeat[]
): Set<string> {
  // Find the two seats
  const startSeat = allSeats.find(s => s.seatId === startSeatId);
  const endSeat = allSeats.find(s => s.seatId === endSeatId);

  if (!startSeat || !endSeat) {
    return new Set([startSeatId, endSeatId]);
  }

  // Verify both in same section
  if (startSeat.sectionId !== section.id || endSeat.sectionId !== section.id) {
    return new Set([startSeatId, endSeatId]);
  }

  // Get row range
  const minRow = Math.min(startSeat.rowNumber, endSeat.rowNumber);
  const maxRow = Math.max(startSeat.rowNumber, endSeat.rowNumber);

  // Select all seats in rows between minRow and maxRow
  const selectedSeatIds = new Set<string>();

  for (const seat of allSeats) {
    if (
      seat.sectionId === section.id &&
      seat.rowNumber >= minRow &&
      seat.rowNumber <= maxRow
    ) {
      selectedSeatIds.add(seat.seatId);
    }
  }

  return selectedSeatIds;
}

// ============================================================================
// Polygon Containment (for future lasso selection)
// ============================================================================

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * Used for lasso selection in Phase 5b (deferred)
 *
 * @param point - Point to test
 * @param polygon - Polygon vertices in order
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  let j = polygon.length - 1;

  for (let i = 0; i < polygon.length; i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
    j = i;
  }

  return inside;
}

/**
 * Check if a point is inside a circle
 * Useful for custom seed selection near cursor
 *
 * @param point - Point to test
 * @param center - Circle center
 * @param radius - Circle radius
 * @returns true if point is inside circle
 */
export function isPointInCircle(point: Point, center: Point, radius: number): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return Math.sqrt(dx * dx + dy * dy) <= radius;
}
