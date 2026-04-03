/**
 * Field Renderer Component
 *
 * Renders the center field (playing surface) with appropriate markings
 * based on field shape (round/rectangle) and dimensions.
 */

import React from "react";
import type { FieldConfig } from "../types";
import {
  CANVAS_CENTER_X,
  CANVAS_CENTER_Y,
  getFieldDimensionsInPixels,
} from "../utils/geometry";

export interface FieldRendererProps {
  fieldConfig: FieldConfig;
  showMarkings?: boolean;
  opacity?: number;
}

/**
 * FieldRenderer - Renders the playing field at canvas center
 *
 * Features:
 * - Round or rectangle shape
 * - Field markings (center circle, lines)
 * - Gradient fill for realistic grass appearance
 * - Scales based on field dimensions
 */
export function FieldRenderer({
  fieldConfig,
  showMarkings = true,
  opacity = 0.9,
}: FieldRendererProps) {
  const { shape } = fieldConfig;
  const { lengthPx, widthPx, radiusPx } = getFieldDimensionsInPixels(fieldConfig);

  // ============================================================================
  // Round Field Rendering
  // ============================================================================

  if (shape === 'round') {
    return (
      <g id="field" className="field">
        {/* Main field circle */}
        <circle
          cx={CANVAS_CENTER_X}
          cy={CANVAS_CENTER_Y}
          r={radiusPx}
          fill="url(#field-gradient-round)"
          fillOpacity={opacity}
          stroke="#16a34a"
          strokeWidth={3}
        />

        {/* Field markings */}
        {showMarkings && (
          <>
            {/* Center circle */}
            <circle
              cx={CANVAS_CENTER_X}
              cy={CANVAS_CENTER_Y}
              r={radiusPx * 0.2}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeDasharray="5,5"
              opacity={0.6}
            />

            {/* Center dot */}
            <circle
              cx={CANVAS_CENTER_X}
              cy={CANVAS_CENTER_Y}
              r={4}
              fill="#ffffff"
              opacity={0.8}
            />

            {/* Vertical center line */}
            <line
              x1={CANVAS_CENTER_X}
              y1={CANVAS_CENTER_Y - radiusPx}
              x2={CANVAS_CENTER_X}
              y2={CANVAS_CENTER_Y + radiusPx}
              stroke="#ffffff"
              strokeWidth={2}
              strokeDasharray="10,5"
              opacity={0.4}
            />

            {/* Horizontal center line */}
            <line
              x1={CANVAS_CENTER_X - radiusPx}
              y1={CANVAS_CENTER_Y}
              x2={CANVAS_CENTER_X + radiusPx}
              y2={CANVAS_CENTER_Y}
              stroke="#ffffff"
              strokeWidth={2}
              strokeDasharray="10,5"
              opacity={0.4}
            />
          </>
        )}

        {/* Field label */}
        <text
          x={CANVAS_CENTER_X}
          y={CANVAS_CENTER_Y - radiusPx - 15}
          textAnchor="middle"
          fill="#16a34a"
          fontSize={14}
          fontWeight={600}
        >
          {fieldConfig.length} {fieldConfig.unit} ● {shape}
        </text>
      </g>
    );
  }

  // ============================================================================
  // Rectangle Field Rendering
  // ============================================================================

  const fieldX = CANVAS_CENTER_X - lengthPx / 2;
  const fieldY = CANVAS_CENTER_Y - widthPx / 2;

  return (
    <g id="field" className="field">
      {/* Main field rectangle */}
      <rect
        x={fieldX}
        y={fieldY}
        width={lengthPx}
        height={widthPx}
        rx={8}
        fill="url(#field-gradient-rect)"
        fillOpacity={opacity}
        stroke="#16a34a"
        strokeWidth={3}
      />

      {/* Field markings */}
      {showMarkings && (
        <>
          {/* Center circle */}
          <circle
            cx={CANVAS_CENTER_X}
            cy={CANVAS_CENTER_Y}
            r={Math.min(lengthPx, widthPx) * 0.12}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            opacity={0.6}
          />

          {/* Center dot */}
          <circle
            cx={CANVAS_CENTER_X}
            cy={CANVAS_CENTER_Y}
            r={4}
            fill="#ffffff"
            opacity={0.8}
          />

          {/* Center line (vertical) */}
          <line
            x1={CANVAS_CENTER_X}
            y1={fieldY}
            x2={CANVAS_CENTER_X}
            y2={fieldY + widthPx}
            stroke="#ffffff"
            strokeWidth={2}
            opacity={0.5}
          />

          {/* Penalty areas (simplified) */}
          {/* Left penalty box */}
          <rect
            x={fieldX}
            y={CANVAS_CENTER_Y - widthPx * 0.25}
            width={lengthPx * 0.15}
            height={widthPx * 0.5}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            opacity={0.4}
          />

          {/* Right penalty box */}
          <rect
            x={fieldX + lengthPx - lengthPx * 0.15}
            y={CANVAS_CENTER_Y - widthPx * 0.25}
            width={lengthPx * 0.15}
            height={widthPx * 0.5}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            opacity={0.4}
          />

          {/* Goal areas (smaller boxes) */}
          {/* Left goal box */}
          <rect
            x={fieldX}
            y={CANVAS_CENTER_Y - widthPx * 0.15}
            width={lengthPx * 0.08}
            height={widthPx * 0.3}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.5}
            opacity={0.3}
          />

          {/* Right goal box */}
          <rect
            x={fieldX + lengthPx - lengthPx * 0.08}
            y={CANVAS_CENTER_Y - widthPx * 0.15}
            width={lengthPx * 0.08}
            height={widthPx * 0.3}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.5}
            opacity={0.3}
          />
        </>
      )}

      {/* Field label */}
      <text
        x={CANVAS_CENTER_X}
        y={fieldY - 15}
        textAnchor="middle"
        fill="#16a34a"
        fontSize={14}
        fontWeight={600}
      >
        {fieldConfig.length} × {fieldConfig.width} {fieldConfig.unit} ● {shape}
      </text>
    </g>
  );
}

/**
 * Field Gradients Definition
 * Should be added to SVG <defs> section in parent component
 */
export function FieldGradientDefs() {
  return (
    <defs>
      {/* Round field gradient */}
      <radialGradient id="field-gradient-round">
        <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
      </radialGradient>

      {/* Rectangle field gradient */}
      <linearGradient id="field-gradient-rect" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#15803d', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
  );
}
