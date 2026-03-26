"use client";

import React, { useRef, useState, useCallback } from "react";
import { useCanvas } from "./hooks/useCanvas";
import type { FieldConfig, LayoutSection, Bowl, ViewMode, Point } from "./types";

export interface LayoutCanvasProps {
  width?: number;
  height?: number;

  // Data
  fieldConfig: FieldConfig;
  bowls: Bowl[];
  sections: LayoutSection[];
  selectedSectionId: string | null;

  // Interaction handlers
  onSectionSelect: (sectionId: string | null) => void;
  onSectionDoubleClick?: (sectionId: string) => void;
  onSectionDragStart?: (sectionId: string, offset: Point) => void;
  onSectionDragMove?: (sectionId: string, position: Point) => void;
  onSectionDragEnd?: (sectionId: string) => void;

  // View options
  viewMode: ViewMode;
  showBowlZones?: boolean;
  showGrid?: boolean;
}

/**
 * Layout Canvas - Main SVG rendering component
 *
 * Renders the stadium layout with field, sections, seats, and bowl zones.
 * Handles zoom, pan, and section drag interactions.
 */
export function LayoutCanvas({
  width = 1400,
  height = 900,
  fieldConfig,
  bowls,
  sections,
  selectedSectionId,
  onSectionSelect,
  onSectionDoubleClick,
  onSectionDragStart,
  onSectionDragMove,
  onSectionDragEnd,
  viewMode = 'overview',
  showBowlZones = true,
  showGrid = true,
}: LayoutCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvas = useCanvas({ canvasWidth: width, canvasHeight: height });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);

  // ============================================================================
  // Pan Handling
  // ============================================================================

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Left click only

    // Start panning
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning || !panStart) return;

    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;

    canvas.setPan({
      x: canvas.pan.x + dx,
      y: canvas.pan.y + dy,
    });

    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, canvas]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  // ============================================================================
  // Zoom Handling
  // ============================================================================

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    if (!svgRef.current) return;

    const delta = -e.deltaY * 0.001;
    const newZoom = canvas.zoom * (1 + delta);

    // Zoom towards mouse position
    const mousePos = canvas.clientToCanvas(e.clientX, e.clientY, svgRef.current);
    canvas.zoomTo(newZoom, mousePos);
  }, [canvas]);

  // ============================================================================
  // Section Interaction
  // ============================================================================

  const handleSectionClick = useCallback((sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSectionSelect(sectionId);
  }, [onSectionSelect]);

  const handleSectionDoubleClick = useCallback((sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSectionDoubleClick?.(sectionId);
  }, [onSectionDoubleClick]);

  // ============================================================================
  // Render Grid Background
  // ============================================================================

  const renderGrid = () => {
    if (!showGrid) return null;

    const gridSize = 50;
    const lines = [];

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#e5e7eb"
          strokeWidth={x % (gridSize * 2) === 0 ? 1 : 0.5}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={y % (gridSize * 2) === 0 ? 1 : 0.5}
        />
      );
    }

    return <g id="grid">{lines}</g>;
  };

  // ============================================================================
  // Render Field
  // ============================================================================

  const renderField = () => {
    const centerX = width / 2;
    const centerY = height / 2;

    if (fieldConfig.shape === 'round') {
      const radius = (fieldConfig.length / 2) * 2; // Scale for visualization

      return (
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="url(#field-gradient)"
          stroke="#10b981"
          strokeWidth={3}
        />
      );
    } else {
      // Rectangle field
      const fieldWidth = fieldConfig.length * 2; // Scale for visualization
      const fieldHeight = fieldConfig.width * 2;

      return (
        <rect
          x={centerX - fieldWidth / 2}
          y={centerY - fieldHeight / 2}
          width={fieldWidth}
          height={fieldHeight}
          rx={10}
          fill="url(#field-gradient)"
          stroke="#10b981"
          strokeWidth={3}
        />
      );
    }
  };

  // ============================================================================
  // Render Sections (Placeholder)
  // ============================================================================

  const renderSection = (section: LayoutSection) => {
    const isSelected = section.id === selectedSectionId;
    const bowl = bowls.find(b => b.id === section.bowlId);

    return (
      <g
        key={section.id}
        className="section"
        onClick={(e) => handleSectionClick(section.id, e)}
        onDoubleClick={(e) => handleSectionDoubleClick(section.id, e)}
        style={{ cursor: 'pointer' }}
      >
        {/* Placeholder rectangle for section */}
        <rect
          x={section.centerX - 50}
          y={section.centerY - 30}
          width={100}
          height={60}
          fill={bowl?.color || section.color}
          fillOpacity={isSelected ? 0.8 : 0.4}
          stroke={isSelected ? '#3b82f6' : '#9ca3af'}
          strokeWidth={isSelected ? 3 : 1}
          rx={5}
        />
        <text
          x={section.centerX}
          y={section.centerY}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="#000"
          fontSize={12}
          fontWeight={isSelected ? 600 : 400}
          pointerEvents="none"
        >
          {section.name}
        </text>
        <text
          x={section.centerX}
          y={section.centerY + 15}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="#666"
          fontSize={10}
          pointerEvents="none"
        >
          {section.calculatedCapacity} seats
        </text>
      </g>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="layout-canvas-container">
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
        style={{ cursor: isPanning ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        {/* Gradients */}
        <defs>
          <linearGradient id="field-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#16a34a', stopOpacity: 0.9 }} />
          </linearGradient>
        </defs>

        {/* Background grid */}
        {renderGrid()}

        {/* Transformed content */}
        <g transform={canvas.getTransform()}>
          {/* Field */}
          {renderField()}

          {/* Sections */}
          {sections.map(renderSection)}
        </g>
      </svg>

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button onClick={canvas.zoomIn} title="Zoom In">+</button>
        <span>{Math.round(canvas.zoom * 100)}%</span>
        <button onClick={canvas.zoomOut} title="Zoom Out">-</button>
        <button onClick={canvas.zoomToFit} title="Reset View">⌂</button>
      </div>

      <style jsx>{`
        .layout-canvas-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: #f9fafb;
          overflow: hidden;
        }

        .zoom-controls {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .zoom-controls button {
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          background: #fff;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.15s;
        }

        .zoom-controls button:hover {
          background: #f3f4f6;
        }

        .zoom-controls span {
          font-size: 0.875rem;
          min-width: 50px;
          text-align: center;
        }

        .section {
          transition: all 0.15s;
        }

        .section:hover rect {
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}
