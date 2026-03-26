/**
 * Geometry Utilities for Stadium Layout Builder
 *
 * Contains mathematical calculations for:
 * - Field dimension to radius conversion
 * - Section positioning around field
 * - Seat coordinate calculations
 * - Arc and circle geometry
 */

import type { FieldConfig, FieldShape, Point } from "../types";

// ============================================================================
// Constants
// ============================================================================

export const CANVAS_CENTER_X = 700; // Center of 1400px canvas
export const CANVAS_CENTER_Y = 450; // Center of 900px canvas

// Conversion factors for visualization (field units to pixels)
export const YARDS_TO_PIXELS = 2.5;
export const METERS_TO_PIXELS = 3.0;

// ============================================================================
// Field Dimension Calculations
// ============================================================================

/**
 * Calculate minimum inner radius based on field dimensions
 * This is the functional constraint - seating cannot be closer than this
 *
 * @param fieldConfig - Field configuration
 * @returns Minimum inner radius in pixels
 */
export function calculateMinimumInnerRadius(fieldConfig: FieldConfig): number {
  const { shape, length, width, bufferZone, unit } = fieldConfig;

  // Convert field dimensions to pixels
  const scale = unit === 'yards' ? YARDS_TO_PIXELS : METERS_TO_PIXELS;
  const lengthPx = length * scale;
  const widthPx = width * scale;
  const bufferPx = bufferZone * scale;

  if (shape === 'round') {
    // Round field: radius = length/2 + buffer
    return (lengthPx / 2) + bufferPx;
  } else {
    // Rectangle field: radius = diagonal/2 + buffer
    // Uses diagonal distance from center to corner
    const halfLength = lengthPx / 2;
    const halfWidth = widthPx / 2;
    const diagonal = Math.sqrt(halfLength ** 2 + halfWidth ** 2);
    return diagonal + bufferPx;
  }
}

/**
 * Calculate field dimensions in pixels for rendering
 *
 * @param fieldConfig - Field configuration
 * @returns Field dimensions in pixels
 */
export function getFieldDimensionsInPixels(fieldConfig: FieldConfig): {
  lengthPx: number;
  widthPx: number;
  radiusPx: number;
} {
  const scale = fieldConfig.unit === 'yards' ? YARDS_TO_PIXELS : METERS_TO_PIXELS;
  const lengthPx = fieldConfig.length * scale;
  const widthPx = fieldConfig.width * scale;
  const radiusPx = fieldConfig.shape === 'round' ? lengthPx / 2 : 0;

  return { lengthPx, widthPx, radiusPx };
}

/**
 * Update field config with calculated minimum inner radius
 *
 * @param fieldConfig - Current field configuration
 * @returns Updated field configuration with minimumInnerRadius set
 */
export function updateFieldConfigWithRadius(fieldConfig: FieldConfig): FieldConfig {
  return {
    ...fieldConfig,
    minimumInnerRadius: calculateMinimumInnerRadius(fieldConfig),
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate field dimensions are within acceptable ranges
 *
 * @param fieldConfig - Field configuration to validate
 * @returns Validation result with error message if invalid
 */
export function validateFieldDimensions(fieldConfig: FieldConfig): {
  valid: boolean;
  error?: string;
} {
  const { shape, length, width, bufferZone, unit } = fieldConfig;

  // Dimension limits (in original units)
  const MIN_LENGTH = unit === 'yards' ? 50 : 45;
  const MAX_LENGTH = unit === 'yards' ? 150 : 135;
  const MIN_WIDTH = unit === 'yards' ? 40 : 35;
  const MAX_WIDTH = unit === 'yards' ? 100 : 90;
  const MIN_BUFFER = unit === 'yards' ? 10 : 9;
  const MAX_BUFFER = unit === 'yards' ? 30 : 27;

  if (length < MIN_LENGTH || length > MAX_LENGTH) {
    return {
      valid: false,
      error: `Length must be between ${MIN_LENGTH} and ${MAX_LENGTH} ${unit}`,
    };
  }

  if (shape === 'rectangle' && (width < MIN_WIDTH || width > MAX_WIDTH)) {
    return {
      valid: false,
      error: `Width must be between ${MIN_WIDTH} and ${MAX_WIDTH} ${unit}`,
    };
  }

  if (bufferZone < MIN_BUFFER || bufferZone > MAX_BUFFER) {
    return {
      valid: false,
      error: `Buffer zone must be between ${MIN_BUFFER} and ${MAX_BUFFER} ${unit}`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Coordinate Transformations
// ============================================================================

/**
 * Convert polar coordinates to Cartesian coordinates
 *
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param radius - Radius from center
 * @param angleDegrees - Angle in degrees (0° = right, 90° = top)
 * @returns Cartesian point
 */
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleDegrees: number
): Point {
  const angleRadians = (angleDegrees - 90) * (Math.PI / 180);
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians),
  };
}

/**
 * Convert Cartesian coordinates to polar coordinates
 *
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param point - Point to convert
 * @returns Polar coordinates (radius, angle in degrees)
 */
export function cartesianToPolar(
  centerX: number,
  centerY: number,
  point: Point
): { radius: number; angleDegrees: number } {
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  const radius = Math.sqrt(dx ** 2 + dy ** 2);
  const angleRadians = Math.atan2(dy, dx);
  const angleDegrees = (angleRadians * 180 / Math.PI) + 90;

  return { radius, angleDegrees: angleDegrees < 0 ? angleDegrees + 360 : angleDegrees };
}

// ============================================================================
// Arc Geometry
// ============================================================================

/**
 * Create SVG path for an arc section (curved seating)
 *
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param innerRadius - Inner radius of arc
 * @param outerRadius - Outer radius of arc
 * @param startAngle - Start angle in degrees
 * @param endAngle - End angle in degrees
 * @returns SVG path string
 */
export function createArcPath(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const end = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const startInner = polarToCartesian(centerX, centerY, innerRadius, startAngle);
  const endInner = polarToCartesian(centerX, centerY, innerRadius, endAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${start.x} ${start.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

/**
 * Calculate points along an arc
 *
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param radius - Radius
 * @param startAngle - Start angle in degrees
 * @param endAngle - End angle in degrees
 * @param numPoints - Number of points to calculate
 * @returns Array of points
 */
export function getArcPoints(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  numPoints: number
): Point[] {
  const points: Point[] = [];
  const angleStep = (endAngle - startAngle) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const angle = startAngle + i * angleStep;
    points.push(polarToCartesian(centerX, centerY, radius, angle));
  }

  return points;
}

// ============================================================================
// Distance Calculations
// ============================================================================

/**
 * Calculate Euclidean distance between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance in pixels
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx ** 2 + dy ** 2);
}

/**
 * Calculate if a point is within a distance of another point
 *
 * @param point - Point to check
 * @param target - Target point
 * @param threshold - Maximum distance
 * @returns True if within threshold
 */
export function isWithinDistance(point: Point, target: Point, threshold: number): boolean {
  return distance(point, target) <= threshold;
}

// ============================================================================
// Angle Utilities
// ============================================================================

/**
 * Normalize angle to 0-360 range
 *
 * @param angleDegrees - Angle in degrees
 * @returns Normalized angle
 */
export function normalizeAngle(angleDegrees: number): number {
  let normalized = angleDegrees % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Calculate angle between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Angle in degrees
 */
export function angleBetweenPoints(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angleRadians = Math.atan2(dy, dx);
  return normalizeAngle((angleRadians * 180 / Math.PI) + 90);
}

/**
 * Snap angle to nearest increment (for UI alignment)
 *
 * @param angleDegrees - Angle in degrees
 * @param snapIncrement - Snap increment (e.g., 15 for 15° snaps)
 * @returns Snapped angle
 */
export function snapAngle(angleDegrees: number, snapIncrement: number = 15): number {
  return Math.round(angleDegrees / snapIncrement) * snapIncrement;
}

// ============================================================================
// Field Shape Helpers
// ============================================================================

/**
 * Get field shape display name
 *
 * @param shape - Field shape
 * @returns Display name
 */
export function getFieldShapeDisplayName(shape: FieldShape): string {
  return shape === 'round' ? 'Round (Circle)' : 'Rectangle';
}

/**
 * Get default width for field based on shape and length
 * Used when switching from round to rectangle
 *
 * @param shape - Target field shape
 * @param length - Field length
 * @param unit - Field unit
 * @returns Recommended width
 */
export function getDefaultFieldWidth(shape: FieldShape, length: number, unit: string): number {
  if (shape === 'round') {
    return length; // For round, width = length (diameter)
  } else {
    // For rectangle, use typical aspect ratios
    if (unit === 'yards') {
      // Football field: ~100 x 53.3 yards
      return Math.round(length * 0.533);
    } else {
      // Soccer field: ~100 x 64 meters (more square)
      return Math.round(length * 0.64);
    }
  }
}

// ============================================================================
// Rectangle Geometry
// ============================================================================

/**
 * Create SVG path for a rectangle section (rectangular seating)
 *
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param width - Width of rectangle
 * @param height - Height of rectangle
 * @param rotation - Rotation in degrees
 * @returns SVG path string for a closed rectangle
 */
export function createRectanglePath(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotation: number = 0
): string {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const angle = (rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Calculate rotated corners relative to center
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];

  // Apply rotation and translation
  const rotatedCorners = corners.map(corner => ({
    x: centerX + corner.x * cos - corner.y * sin,
    y: centerY + corner.x * sin + corner.y * cos,
  }));

  // Build SVG path (moveto first corner, lineto others, close path)
  const pathParts = [
    `M ${rotatedCorners[0].x} ${rotatedCorners[0].y}`,
    ...rotatedCorners.slice(1).map(corner => `L ${corner.x} ${corner.y}`),
    'Z',
  ];

  return pathParts.join(' ');
}

/**
 * Validate section geometry constraints
 *
 * @param section - Section to validate (partial)
 * @param fieldConfig - Field configuration for constraints
 * @param canvasWidth - Canvas width (for bounds checking)
 * @param canvasHeight - Canvas height (for bounds checking)
 * @returns Validation result with error/warning messages
 */
export function validateSectionGeometry(
  section: {
    shape: 'arc' | 'rectangle';
    centerX: number;
    centerY: number;
    innerRadius?: number;
    outerRadius?: number;
    width?: number;
    height?: number;
    rotation?: number;
    rows?: number;
    seatsPerRow?: number;
  },
  fieldConfig?: FieldConfig,
  canvasWidth: number = 1400,
  canvasHeight: number = 900
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Canvas bounds check
  if (section.centerX < 0 || section.centerX > canvasWidth) {
    errors.push(`Center X must be between 0 and ${canvasWidth}`);
  }
  if (section.centerY < 0 || section.centerY > canvasHeight) {
    errors.push(`Center Y must be between 0 and ${canvasHeight}`);
  }

  if (section.shape === 'arc') {
    const innerRadius = section.innerRadius || 0;
    const outerRadius = section.outerRadius || 0;

    if (innerRadius <= 0) {
      errors.push('Inner radius must be greater than 0');
    }
    if (outerRadius <= 0) {
      errors.push('Outer radius must be greater than 0');
    }
    if (innerRadius >= outerRadius) {
      errors.push('Inner radius must be less than outer radius');
    }

    // Check minimum inner radius constraint
    if (fieldConfig && innerRadius < fieldConfig.minimumInnerRadius) {
      errors.push(
        `Inner radius must be at least ${Math.round(fieldConfig.minimumInnerRadius)} pixels ` +
        `to respect field minimum constraint`
      );
    }

    // Check if arc extends beyond canvas
    const maxRadius = Math.max(
      Math.hypot(section.centerX, section.centerY),
      Math.hypot(section.centerX - canvasWidth, section.centerY),
      Math.hypot(section.centerX, section.centerY - canvasHeight),
      Math.hypot(section.centerX - canvasWidth, section.centerY - canvasHeight)
    );
    if (outerRadius > maxRadius + 100) {
      warnings.push('Section may extend beyond canvas boundaries');
    }
  }

  if (section.shape === 'rectangle') {
    const width = section.width || 0;
    const height = section.height || 0;

    if (width <= 0) {
      errors.push('Width must be greater than 0');
    }
    if (height <= 0) {
      errors.push('Height must be greater than 0');
    }

    // Check if bounds exceed canvas
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    if (
      section.centerX - halfWidth < 0 ||
      section.centerX + halfWidth > canvasWidth ||
      section.centerY - halfHeight < 0 ||
      section.centerY + halfHeight > canvasHeight
    ) {
      warnings.push('Section extends beyond canvas boundaries');
    }
  }

  // Capacity check
  if (section.rows && section.seatsPerRow) {
    const capacity = section.rows * section.seatsPerRow;
    if (capacity < 300) {
      warnings.push(`Capacity (${capacity}) is below typical minimum of 300 seats`);
    }
    if (capacity > 2000) {
      warnings.push(`Capacity (${capacity}) is above typical maximum of 2000 seats`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate section capacity
 *
 * @param rows - Number of rows
 * @param seatsPerRow - Seats per row
 * @param verticalAisles - Vertical aisle indices (optional)
 * @param horizontalAisles - Horizontal aisle indices (optional)
 * @returns Total capacity
 */
export function calculateSectionCapacity(
  rows: number,
  seatsPerRow: number,
  verticalAisles: number[] = [],
  horizontalAisles: number[] = []
): number {
  // Simple calculation: rows × seatsPerRow
  // Aisle impact is negligible and will be precise in Phase 3 seat generation
  return rows * seatsPerRow;
}

// ============================================================================
// Exports
// ============================================================================

export const GeometryUtils = {
  calculateMinimumInnerRadius,
  getFieldDimensionsInPixels,
  updateFieldConfigWithRadius,
  validateFieldDimensions,
  polarToCartesian,
  cartesianToPolar,
  createArcPath,
  createRectanglePath,
  getArcPoints,
  distance,
  isWithinDistance,
  normalizeAngle,
  angleBetweenPoints,
  snapAngle,
  getFieldShapeDisplayName,
  getDefaultFieldWidth,
  validateSectionGeometry,
  calculateSectionCapacity,
};
