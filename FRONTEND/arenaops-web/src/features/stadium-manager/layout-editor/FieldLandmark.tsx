"use client";

import React from "react";
import type { LayoutField } from "./types";

type FieldLandmarkProps = {
  field: LayoutField;
};

export function FieldLandmark({ field }: FieldLandmarkProps) {
  const centerX = field.x + field.width / 2;
  const centerY = field.y + field.height / 2;
  const circleRadius = Math.min(field.width, field.height) * 0.16;

  return (
    <g>
      <defs>
        <linearGradient id="field-base-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3da54f" />
          <stop offset="100%" stopColor="#287a3a" />
        </linearGradient>
        <pattern id="field-stripes" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#2f8f44" />
          <rect width="12" height="24" fill="#256b36" opacity="0.28" />
        </pattern>
      </defs>

      <rect
        x={field.x}
        y={field.y}
        width={field.width}
        height={field.height}
        rx={field.radius ?? 8}
        fill="url(#field-base-gradient)"
      />
      <rect
        x={field.x}
        y={field.y}
        width={field.width}
        height={field.height}
        rx={field.radius ?? 8}
        fill="url(#field-stripes)"
        opacity={0.8}
      />
      <rect
        x={field.x}
        y={field.y}
        width={field.width}
        height={field.height}
        rx={field.radius ?? 8}
        fill="none"
        stroke="#f0fdf4"
        strokeWidth={1.2}
        opacity={0.6}
      />
      <line
        x1={centerX}
        y1={field.y + 10}
        x2={centerX}
        y2={field.y + field.height - 10}
        stroke="#f0fdf4"
        strokeWidth={1}
        opacity={0.5}
      />
      <line
        x1={field.x + 10}
        y1={centerY}
        x2={field.x + field.width - 10}
        y2={centerY}
        stroke="#f0fdf4"
        strokeWidth={1}
        opacity={0.4}
      />
      <circle
        cx={centerX}
        cy={centerY}
        r={circleRadius}
        fill="none"
        stroke="#f0fdf4"
        strokeWidth={1}
        opacity={0.5}
      />
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="600"
        fill="#f8fafc"
        opacity={0.9}
        pointerEvents="none"
      >
        FIELD
      </text>
    </g>
  );
}
