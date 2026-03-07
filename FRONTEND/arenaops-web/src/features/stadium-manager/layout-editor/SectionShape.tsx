"use client";

import React from "react";
import type { LayoutSection } from "./types";
import { SEAT_TYPE_COLORS } from "./utils/seatTypeColors";

interface SectionShapeProps {
  section: LayoutSection;
  isSelected: boolean;
  isHovered?: boolean;
  onMouseDown: (event: React.MouseEvent<SVGGElement>, sectionId: string) => void;
  onClick: (event: React.MouseEvent<SVGGElement>, sectionId: string) => void;
  onMouseEnter?: (sectionId: string) => void;
  onMouseLeave?: () => void;
  onDoubleClick?: (event: React.MouseEvent<SVGGElement>, sectionId: string) => void;
}

const getSectionBounds = (section: LayoutSection) => {
  if (section.type === "circle") {
    const size = section.radius * 2;
    return { width: size, height: size };
  }

  return { width: section.width, height: section.height };
};

const buildCustomPath = (section: LayoutSection) => {
  if (section.customPath) {
    return section.customPath;
  }

  const w = section.width;
  const h = section.height;
  return `M ${w * 0.5} 0 L ${w} ${h * 0.35} L ${w * 0.82} ${h} L ${w * 0.18} ${h} L 0 ${h * 0.35} Z`;
};

export function SectionShape({
  section,
  isSelected,
  isHovered = false,
  onMouseDown,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
}: SectionShapeProps) {
  const { width, height } = getSectionBounds(section);
  const fill = SEAT_TYPE_COLORS[section.seatType];
  const stroke = isSelected || isHovered ? "#22d3ee" : "#0f172a";
  const strokeWidth = isSelected ? 3 : isHovered ? 2.2 : 1.5;
  const centerX = width / 2;
  const centerY = height / 2;
  const transform = `translate(${section.x} ${section.y}) rotate(${section.rotation} ${centerX} ${centerY})`;

  return (
    <g
      transform={transform}
      onMouseDown={(event) => onMouseDown(event, section.id)}
      onClick={(event) => onClick(event, section.id)}
      onMouseEnter={() => onMouseEnter?.(section.id)}
      onMouseLeave={() => onMouseLeave?.()}
      onDoubleClick={(event) => onDoubleClick?.(event, section.id)}
      data-section-id={section.id}
      className="cursor-pointer"
      aria-label={`Section ${section.id}`}
      role="button"
    >
      {section.type === "rectangle" && (
        <rect
          x={0}
          y={0}
          width={section.width}
          height={section.height}
          rx={8}
          fill={fill}
          fillOpacity={0.85}
          stroke={stroke}
          strokeWidth={strokeWidth}
          filter={isSelected ? "url(#layout-selected-glow)" : undefined}
        />
      )}

      {section.type === "circle" && (
        <circle
          cx={section.radius}
          cy={section.radius}
          r={section.radius}
          fill={fill}
          fillOpacity={0.85}
          stroke={stroke}
          strokeWidth={strokeWidth}
          filter={isSelected ? "url(#layout-selected-glow)" : undefined}
        />
      )}

      {section.type === "oval" && (
        <ellipse
          cx={section.width / 2}
          cy={section.height / 2}
          rx={section.width / 2}
          ry={section.height / 2}
          fill={fill}
          fillOpacity={0.85}
          stroke={stroke}
          strokeWidth={strokeWidth}
          filter={isSelected ? "url(#layout-selected-glow)" : undefined}
        />
      )}

      {section.type === "custom" && (
        <path
          d={buildCustomPath(section)}
          fill={fill}
          fillOpacity={0.85}
          stroke={stroke}
          strokeWidth={strokeWidth}
          filter={isSelected ? "url(#layout-selected-glow)" : undefined}
        />
      )}
    </g>
  );
}
