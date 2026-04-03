/**
 * SelectionRectangle Component
 *
 * Visual feedback overlay during drag-select rectangle mode
 * Shows the selection boundary and seat count in real-time
 */

import React from 'react';

export interface SelectionRectangleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  seatCount: number;
}

export const SelectionRectangle: React.FC<SelectionRectangleProps> = ({
  x,
  y,
  width,
  height,
  seatCount,
}) => {
  // Only render if rectangle has minimum size
  if (Math.abs(width) < 1 || Math.abs(height) < 1) {
    return null;
  }

  // Normalize coordinates (handle dragging in any direction)
  const rectX = Math.min(x, x + width);
  const rectY = Math.min(y, y + height);
  const rectWidth = Math.abs(width);
  const rectHeight = Math.abs(height);

  return (
    <g data-selection="rectangle" pointerEvents="none">
      {/* Semi-transparent fill */}
      <rect
        x={rectX}
        y={rectY}
        width={rectWidth}
        height={rectHeight}
        fill="rgba(59, 130, 246, 0.1)"
        stroke="rgb(59, 130, 246)"
        strokeWidth="2"
        strokeDasharray="5,5"
        rx="2"
      />

      {/* Seat count label - positioned at top-left of rectangle */}
      <g>
        {/* Background for label (semi-opaque) */}
        <rect
          x={rectX + 4}
          y={Math.max(rectY - 24, 0)}
          width="60"
          height="20"
          fill="rgba(30, 41, 59, 0.95)"
          rx="2"
        />
        {/* Text label */}
        <text
          x={rectX + 34}
          y={Math.max(rectY - 8, 12)}
          fill="rgb(226, 232, 240)"
          fontSize="12"
          fontWeight="500"
          textAnchor="middle"
          pointerEvents="none"
        >
          {seatCount} seats
        </text>
      </g>

      {/* Corner indicators for better visual feedback */}
      <circle cx={rectX} cy={rectY} r="2" fill="rgb(59, 130, 246)" />
      <circle cx={rectX + rectWidth} cy={rectY} r="2" fill="rgb(59, 130, 246)" />
      <circle cx={rectX} cy={rectY + rectHeight} r="2" fill="rgb(59, 130, 246)" />
      <circle
        cx={rectX + rectWidth}
        cy={rectY + rectHeight}
        r="2"
        fill="rgb(59, 130, 246)"
      />
    </g>
  );
};

SelectionRectangle.displayName = 'SelectionRectangle';
