"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCanvas } from "@/features/stadium-owner/stadium-layout-builder/hooks/useCanvas";
import { FieldRenderer, FieldGradientDefs } from "@/features/stadium-owner/stadium-layout-builder/components/FieldRenderer";
import { createArcPath, createRectanglePath } from "@/features/stadium-owner/stadium-layout-builder/utils/geometry";

import type { Section, Landmark, FieldConfig, Bowl } from "@/services/stadiumViewService";
import { GeometryType, LandmarkType, SeatType } from "@/services/stadiumViewService";

interface HoverPayload {
  sectionId: string | null;
  position: { x: number; y: number } | null;
  world: { x: number; y: number } | null;
  section: Section | null;
}

interface StadiumCanvasProps {
  sections: Section[];
  landmarks: Landmark[];
  fieldConfig?: FieldConfig;
  bowls?: Bowl[];
  className?: string;
  onHoverChange?: (payload: HoverPayload) => void;
  width?: number;
  height?: number;
}

const seatTypeFallbackColors: Record<SeatType, string> = {
  [SeatType.Vip]: "#FFD700",
  [SeatType.Premium]: "#A78BFA",
  [SeatType.Standard]: "#60A5FA",
  [SeatType.Economy]: "#34D399",
  [SeatType.Accessible]: "#F97316",
};

const landmarkColors: Record<LandmarkType, string> = {
  [LandmarkType.Stage]: "#F59E0B",
  [LandmarkType.Gate]: "#38BDF8",
  [LandmarkType.Exit]: "#FB7185",
  [LandmarkType.Restroom]: "#A78BFA",
};

export function StadiumCanvas({
  sections,
  landmarks,
  fieldConfig,
  bowls = [],
  className,
  onHoverChange,
  width = 1400,
  height = 900,
}: StadiumCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvas = useCanvas({ canvasWidth: width, canvasHeight: height, minZoom: 0.3, maxZoom: 5.0 });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  // Hover state
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);

  // Convert stadiumViewService FieldConfig to Layout Builder's FieldConfig equivalent
  const builderFieldConfig = useMemo(() => {
    if (!fieldConfig || !fieldConfig.field) {
      return {
        shape: "round" as const,
        length: 100,
        width: 100,
        unit: "meters" as const,
        bufferZone: 15,
        minimumInnerRadius: 65,
      };
    }
    const isRound = Math.abs(fieldConfig.field.width - fieldConfig.field.height) < 5;
    return {
      shape: (isRound ? "round" : "rectangle") as "round" | "rectangle",
      length: fieldConfig.field.width,
      width: fieldConfig.field.height,
      unit: "meters" as const,
      bufferZone: 15,
      minimumInnerRadius: 65,
    };
  }, [fieldConfig]);

  // Canvas Handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      setIsPanning(false);
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!panStart) {
        // Handle Hover
        if (svgRef.current) {
          const pt = canvas.clientToCanvas(e.clientX, e.clientY, svgRef.current);
          // Very basic hit test bounding check (could be improved mathematically)
          // Simplified hit detection for hover (since sections are SVGs, we can rely on mouseEnter of the path instead)
        }
        return;
      }

      setIsPanning(true);
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      canvas.setPan({
        x: canvas.pan.x + dx,
        y: canvas.pan.y + dy,
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [panStart, canvas]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      if (!svgRef.current) return;
      const delta = -e.deltaY * 0.001;
      const newZoom = canvas.zoom * (1 + delta);
      const mousePos = canvas.clientToCanvas(e.clientX, e.clientY, svgRef.current);
      canvas.zoomTo(newZoom, mousePos);
    },
    [canvas]
  );

  const renderGrid = () => {
    const gridSize = 50;
    const lines = [];

    for (let x = 0; x <= width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#1e293b" // dark theme grid
          strokeWidth={x % (gridSize * 2) === 0 ? 1 : 0.5}
        />
      );
    }
    for (let y = 0; y <= height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#1e293b"
          strokeWidth={y % (gridSize * 2) === 0 ? 1 : 0.5}
        />
      );
    }
    return <g id="grid">{lines}</g>;
  };

  const notifyHover = (section: Section | null, evt: React.MouseEvent) => {
    setHoveredSectionId(section?.sectionId || null);
    if (!onHoverChange) return;

    if (section && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      onHoverChange({
        sectionId: section.sectionId,
        position: { x: evt.clientX - rect.left, y: evt.clientY - rect.top },
        world: { x: section.posX, y: section.posY },
        section,
      });
    } else {
      onHoverChange({ sectionId: null, position: null, world: null, section: null });
    }
  };

  const renderSection = (section: Section) => {
    // Find matching bowl
    const bowl = bowls.find((b) => b.sectionIds.includes(section.sectionId));
    let displayColor = bowl?.color;
    if (!displayColor) {
      displayColor = section.color ?? (section.seatType ? seatTypeFallbackColors[section.seatType] : "#64748B");
    }

    const isHovered = hoveredSectionId === section.sectionId;

    let path = "";
    if (section.geometryType === GeometryType.Arc && section.geometry) {
      path = createArcPath(
        section.posX,
        section.posY,
        section.geometry.innerRadius,
        section.geometry.outerRadius,
        section.geometry.startAngle,
        section.geometry.endAngle
      );
    } else if (section.geometryType === GeometryType.Rectangle && section.geometry) {
      path = createRectanglePath(
        section.posX,
        section.posY,
        section.geometry.width,
        section.geometry.height,
        section.geometry.rotation
      );
    } else {
      // Fallback tiny rectangle
      path = createRectanglePath(section.posX, section.posY, 50, 50, 0);
    }

    return (
      <g
        key={section.sectionId}
        className="section transition-all duration-150"
        onMouseEnter={(e) => notifyHover(section, e)}
        onMouseMove={(e) => notifyHover(section, e)}
        onMouseLeave={(e) => notifyHover(null, e)}
        style={{ cursor: "pointer" }}
      >
        <path
          d={path}
          fill={displayColor}
          fillOpacity={isHovered ? 0.8 : 0.5}
          stroke={isHovered ? "#ffffff" : "#9ca3af"}
          strokeWidth={isHovered ? 2 : 1.5}
          className="transition-all duration-150"
        />
        {/* Outline / Center dot */}
        <circle cx={section.posX} cy={section.posY} r={4} fill="#6b7280" opacity={0.5} pointerEvents="none" />

        {/* Name / capacity at sufficient zoom */}
        {canvas.zoom > 0.5 && (
          <g pointerEvents="none">
            <text
              x={section.posX}
              y={section.posY - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight={isHovered ? 600 : 400}
              style={{ textShadow: "0 0 2px rgba(0,0,0,0.8)" }}
            >
              {section.name}
            </text>
            <text
              x={section.posX}
              y={section.posY + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#e2e8f0"
              fontSize="10"
              style={{ textShadow: "0 0 2px rgba(0,0,0,0.8)" }}
            >
              {section.capacity} seats
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className={cn("relative w-full h-full bg-[#030712] overflow-hidden rounded-2xl", className)}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? "grabbing" : "grab", userSelect: "none" }}
      >
        {/* Define dynamic field gradients */}
        <FieldGradientDefs />

        {/* Grid lines */}
        {renderGrid()}

        {/* Main Transformed Canvas Content */}
        <g transform={canvas.getTransform()}>
          {/* Field Component from Event Builder */}
          <FieldRenderer fieldConfig={builderFieldConfig} showMarkings={true} opacity={1.0} />

          {/* Landmarks (like stages, exits) */}
          {landmarks.map((landmark) => {
            const color = landmarkColors[landmark.type] ?? "#94A3B8";
            return (
              <g key={landmark.featureId}>
                <rect
                  x={landmark.posX - landmark.width / 2}
                  y={landmark.posY - landmark.height / 2}
                  width={landmark.width}
                  height={landmark.height}
                  fill={color}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.5"
                />
                <text
                  x={landmark.posX}
                  y={landmark.posY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {landmark.label || landmark.type}
                </text>
              </g>
            );
          })}

          {/* Render Sections (colored accurately via bowls) */}
          {sections.map(renderSection)}
        </g>
      </svg>

      {/* Zoom UI Overlays */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-[#0f172a]/90 border border-white/10 rounded-lg p-1.5 shadow-xl backdrop-blur-sm">
        <button
          onClick={canvas.zoomIn}
          className="w-8 h-8 flex flex-col justify-center items-center rounded bg-transparent hover:bg-white/10 text-white font-bold transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <span className="text-sm min-w-[50px] text-center text-white/80 font-medium">
          {Math.round(canvas.zoom * 100)}%
        </span>
        <button
          onClick={canvas.zoomOut}
          className="w-8 h-8 flex flex-col justify-center items-center rounded bg-transparent hover:bg-white/10 text-white font-bold transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <button
          onClick={canvas.zoomToFit}
          className="w-8 h-8 flex flex-col justify-center items-center rounded bg-transparent hover:bg-white/10 text-white font-bold transition-colors"
          title="Reset View"
        >
          ⌂
        </button>
      </div>
    </div>
  );
}

export default StadiumCanvas;
