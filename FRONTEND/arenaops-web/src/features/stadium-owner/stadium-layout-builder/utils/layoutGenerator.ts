/**
 * Automatic Layout Generator
 *
 * Generates default stadium layouts with 8 evenly-spaced sections around field
 * - 8 sections (N, NE, E, SE, S, SW, W, NW)
 * - 200 seats per section × 5 rows
 * - Arc geometry positioned based on field dimensions
 * - 1 default bowl with all sections assigned
 */

import type { FieldConfig, Bowl, LayoutSection, SeatType } from "../types";
import { calculateMinimumInnerRadius } from "./geometry";

// ============================================================================
// Constants
// ============================================================================

export const DIRECTIONAL_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const CANVAS_CENTER_X = 700;
const CANVAS_CENTER_Y = 450;

// Section sizing
const DEFAULT_SECTIONS = 8;
const DEFAULT_SEATS_PER_SECTION = 200;
const DEFAULT_ROWS = 5;
const DEFAULT_SEAT_TYPE: SeatType = 'standard';

// Geometry calculations
const ROW_HEIGHT_PIXELS = 15; // Approximate row height for radius calculation
const SECTION_ANGLE_BUFFER = 5; // Gap in degrees between sections

/**
 * Generate default stadium layout with 8 evenly-spaced sections around field
 *
 * @param fieldConfig - Field configuration (determines minimum inner radius)
 * @param numSections - Number of sections (default 8)
 * @param seatsPerSection - Seats per section (default 200)
 * @param rowsPerSection - Rows per section (default 5)
 * @param useDirectionalNames - Use directional names (N, NE, etc.) instead of numbered
 * @returns { bowl, sections } ready for state management
 */
export function generateDefaultLayout(
  fieldConfig: FieldConfig,
  numSections: number = DEFAULT_SECTIONS,
  seatsPerSection: number = DEFAULT_SEATS_PER_SECTION,
  rowsPerSection: number = DEFAULT_ROWS,
  useDirectionalNames: boolean = true
): {
  bowl: Bowl;
  sections: LayoutSection[];
} {
  // Validate parameters
  if (numSections < 2 || numSections > 16) {
    throw new Error(`Invalid numSections: ${numSections} (must be 2-16)`);
  }

  const seatsPerRow = Math.ceil(seatsPerSection / rowsPerSection);

  // ========================================================================
  // Calculate radii based on field dimensions
  // ========================================================================

  const minimumInnerRadius = calculateMinimumInnerRadius(fieldConfig);
  const innerRadius = Math.max(minimumInnerRadius, 100);
  const outerRadius = innerRadius + (rowsPerSection * ROW_HEIGHT_PIXELS);

  // ========================================================================
  // Calculate angles for even distribution
  // ========================================================================

  const totalAngle = 360;
  const anglePerSection = totalAngle / numSections;
  const sectionAngleSpan = anglePerSection - SECTION_ANGLE_BUFFER;

  if (sectionAngleSpan < 20) {
    throw new Error(
      `Angle span too small for ${numSections} sections: ${sectionAngleSpan}° (need at least 20°)`
    );
  }

  // ========================================================================
  // Generate sections
  // ========================================================================

  const sections: LayoutSection[] = [];

  for (let i = 0; i < numSections; i++) {
    const startAngle = i * anglePerSection;
    const endAngle = startAngle + sectionAngleSpan;

    // Get section name (directional or numbered)
    const sectionName = useDirectionalNames
      ? DIRECTIONAL_NAMES[i % DIRECTIONAL_NAMES.length]
      : `Section ${i + 1}`;

    // Calculate capacity
    const calculatedCapacity = seatsPerRow * rowsPerSection;

    // Create section
    const section: LayoutSection = {
      id: `section-${Date.now()}-${i}`,
      name: sectionName,
      bowlId: null, // Will be assigned after bowl creation
      shape: 'arc',
      centerX: CANVAS_CENTER_X,
      centerY: CANVAS_CENTER_Y,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      width: 0, // Not used for arc
      height: 0, // Not used for arc
      rotation: 0,
      rows: rowsPerSection,
      seatsPerRow,
      calculatedCapacity,
      seatType: DEFAULT_SEAT_TYPE,
      verticalAisles: [], // No aisles by default
      horizontalAisles: [],
      isActive: true,
      isLocked: false,
      color: getColorForSectionIndex(i),
    };

    sections.push(section);
  }

  // ========================================================================
  // Create bowl and assign sections
  // ========================================================================

  const sectionIds = sections.map(s => s.id);

  const bowl: Bowl = {
    id: `bowl-${Date.now()}`,
    name: 'Full Bowl',
    color: '#4F9CF9', // Blue
    sectionIds,
    isActive: true,
    displayOrder: 1,
  };

  // Update sections to reference bowl
  sections.forEach(section => {
    section.bowlId = bowl.id;
  });

  console.log(`[layoutGenerator] Generated layout:
    - Bowl: "${bowl.name}"
    - Sections: ${numSections} (${useDirectionalNames ? 'directional' : 'numbered'})
    - Seats per section: ${seatsPerSection}
    - Rows per section: ${rowsPerSection}
    - Total capacity: ${sectionIds.length * seatsPerSection}
    - Inner radius: ${innerRadius}px
    - Outer radius: ${outerRadius}px`);

  return { bowl, sections };
}

/**
 * Get alternating color for section based on index
 * Creates visual variety across sections
 */
function getColorForSectionIndex(index: number): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#14B8A6', // Teal
  ];

  return colors[index % colors.length];
}

/**
 * Validate that generated sections fit within field dimensions
 */
export function validateLayoutForField(
  fieldConfig: FieldConfig,
  numSections: number = DEFAULT_SECTIONS,
  rowsPerSection: number = DEFAULT_ROWS
): { valid: boolean; error?: string } {
  const minimumInnerRadius = calculateMinimumInnerRadius(fieldConfig);
  const outerRadius = minimumInnerRadius + (rowsPerSection * ROW_HEIGHT_PIXELS);

  // Check if layout fits on typical canvas (1400x900)
  const maxRadius = Math.min(700, 450); // Half of canvas width/height
  if (outerRadius > maxRadius) {
    return {
      valid: false,
      error: `Layout too large for field: outer radius ${outerRadius}px exceeds max ${maxRadius}px`,
    };
  }

  // Check angle validity
  const anglePerSection = 360 / numSections;
  const sectionAngleSpan = anglePerSection - SECTION_ANGLE_BUFFER;
  if (sectionAngleSpan < 20) {
    return {
      valid: false,
      error: `Too many sections (${numSections}) for even spacing`,
    };
  }

  return { valid: true };
}
