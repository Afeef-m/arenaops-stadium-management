"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useCanvas } from "./hooks/useCanvas";
import { FieldRenderer, FieldGradientDefs } from "./components/FieldRenderer";
import { SeatRenderer } from "./components/SeatRenderer";
import { SelectionRectangle } from "./components/SelectionRectangle";
import { createArcPath, createRectanglePath } from "./utils/geometry";
import { getSeatsBoundingRect, calculateBoundingRect, distance } from "./utils/selectionAlgorithms";
import type { FieldConfig, LayoutSection, Bowl, ViewMode, Point, LayoutSeat } from "./types";

export interface LayoutCanvasProps {
  width?: number;
  height?: number;

  // Data
  fieldConfig: FieldConfig;
  bowls: Bowl[];
  sections: LayoutSection[];
  seats: LayoutSeat[];
  selectedSectionId: string | null;
  selectedSeatIds: Set<string>;

  // Interaction handlers
  onSectionSelect: (sectionId: string | null) => void;
  onSectionDoubleClick?: (sectionId: string) => void;
  onSectionDragStart?: (sectionId: string, offset: Point) => void;
  onSectionDragMove?: (sectionId: string, position: Point) => void;
  onSectionDragEnd?: (sectionId: string) => void;
  onSeatClick?: (seatId: string, shiftKey: boolean, ctrlKey?: boolean) => void;
  onSeatsSelect?: (seatIds: Set<string>) => void;  // For drag-select & bulk operations

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
  seats,
  selectedSectionId,
  selectedSeatIds,
  onSectionSelect,
  onSectionDoubleClick,
  onSectionDragStart,
  onSectionDragMove,
  onSectionDragEnd,
  onSeatClick,
  onSeatsSelect,
  viewMode = 'overview',
  showBowlZones = true,
  showGrid = true,
}: LayoutCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvas = useCanvas({ canvasWidth: width, canvasHeight: height });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);

  // Drag-selection state (Phase 5)
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragSelectStart, setDragSelectStart] = useState<Point | null>(null);

  // ============================================================================
  // Zoom to Section Helper
  // ============================================================================

  const zoomToSection = useCallback((section: LayoutSection) => {
    // Calculate section bounding box
    let minX: number, maxX: number, minY: number, maxY: number;

    if (section.shape === 'arc') {
      // Arc: use outer radius to calculate bounds
      minX = section.centerX - section.outerRadius;
      maxX = section.centerX + section.outerRadius;
      minY = section.centerY - section.outerRadius;
      maxY = section.centerY + section.outerRadius;
    } else {
      // Rectangle: use width/height with rotation
      const halfW = section.width / 2;
      const halfH = section.height / 2;
      // Simplified bounds (ignore rotation for now, add padding)
      minX = section.centerX - halfW - 50;
      maxX = section.centerX + halfW + 50;
      minY = section.centerY - halfH - 50;
      maxY = section.centerY + halfH + 50;
    }

    // Calculate zoom to fit section with padding
    const sectionWidth = maxX - minX;
    const sectionHeight = maxY - minY;
    const padding = 100; // Extra padding around section

    const zoomX = (width - padding * 2) / sectionWidth;
    const zoomY = (height - padding * 2) / sectionHeight;
    const targetZoom = Math.min(zoomX, zoomY, 3.0); // Cap at 3x zoom

    // Calculate pan to center section
    const sectionCenterX = (minX + maxX) / 2;
    const sectionCenterY = (minY + maxY) / 2;

    const targetPanX = width / 2 - sectionCenterX * targetZoom;
    const targetPanY = height / 2 - sectionCenterY * targetZoom;

    // Apply zoom and pan
    canvas.setZoom(targetZoom);
    canvas.setPan({ x: targetPanX, y: targetPanY });
  }, [canvas, width, height]);

  // Auto-zoom when entering section-focus mode
  useEffect(() => {
    if (viewMode === 'section-focus' && selectedSectionId) {
      const section = sections.find(s => s.id === selectedSectionId);
      if (section) {
        // Small delay to let DOM settle
        setTimeout(() => {
          zoomToSection(section);
        }, 100);
      }
    }
  }, [viewMode, selectedSectionId, sections, zoomToSection]);

  // ============================================================================
  // Pan & Drag-Selection Handling (Phase 5)
  // ============================================================================

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Left click only

    if (!svgRef.current) return;

    // Convert to canvas coordinates for drag-selection
    const canvasPoint = canvas.clientToCanvas(e.clientX, e.clientY, svgRef.current);

    // Store initial point for both panning and drag-selection
    const startPoint = { x: e.clientX, y: e.clientY };
    setPanStart(startPoint);
    setDragSelectStart(canvasPoint);
    setIsDragSelecting(false); // Will be determined in handleCanvasMouseMove
    setIsPanning(false);

    // Store selection start in canvas state
    canvas.setSelectionStart(canvasPoint);
  }, [canvas]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!panStart || !svgRef.current) return;

    const currentPoint = { x: e.clientX, y: e.clientY };
    const dragDist = distance(panStart, currentPoint);
    const isDragging = dragDist >= 5;

    if (!isDragging) {
      return; // Below threshold, do nothing yet
    }

    // Past threshold: decide between panning and drag-selection
    const canvasPoint = canvas.clientToCanvas(e.clientX, e.clientY, svgRef.current);

    if (!isDragSelecting && !isPanning) {
      // First time past threshold: decide which mode
      // If we have a seat or section start point, it would have been handled by their click handlers
      // So if we get here, it's empty space -> drag-select
      setIsDragSelecting(true);
    }

    if (isDragSelecting) {
      // Update selection end point
      canvas.setSelectionEnd(canvasPoint);

      // Calculate bounding rectangle
      if (dragSelectStart) {
        const rect = calculateBoundingRect(dragSelectStart, canvasPoint);
        const selectedSeats = getSeatsBoundingRect(rect, seats);

        // Update preview
        canvas.setSelectionPreview({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          seatCount: selectedSeats.size,
        });
      }
    } else {
      // Pan mode
      setIsPanning(true);
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      canvas.setPan({
        x: canvas.pan.x + dx,
        y: canvas.pan.y + dy,
      });

      setPanStart(currentPoint);
    }
  }, [panStart, isDragSelecting, isPanning, dragSelectStart, canvas, seats]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isDragSelecting && dragSelectStart && canvas.selectionEnd && svgRef.current) {
      // Finalize drag-select
      const rect = calculateBoundingRect(dragSelectStart, canvas.selectionEnd);
      const selectedSeats = getSeatsBoundingRect(rect, seats);

      if (selectedSeats.size > 0) {
        onSeatsSelect?.(selectedSeats);
      }
    }

    // Clear state
    setIsPanning(false);
    setPanStart(null);
    setIsDragSelecting(false);
    setDragSelectStart(null);
    canvas.clearSelection();
  }, [isDragSelecting, dragSelectStart, canvas, seats, onSeatsSelect]);

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

    // Zoom to section on double-click
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      zoomToSection(section);
    }

    onSectionDoubleClick?.(sectionId);
  }, [onSectionDoubleClick, sections, zoomToSection]);

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

  // Field now rendered using FieldRenderer component (see JSX below)

  // ============================================================================
  // Render Sections (Proper Geometry)
  // ============================================================================

  const renderSection = (section: LayoutSection) => {
    const isSelected = section.id === selectedSectionId;
    const bowl = bowls.find(b => b.id === section.bowlId);
    const displayColor = bowl?.color || section.color;

    // Generate path based on shape
    let path = '';
    if (section.shape === 'arc') {
      path = createArcPath(
        section.centerX,
        section.centerY,
        section.innerRadius,
        section.outerRadius,
        section.startAngle,
        section.endAngle
      );
    } else {
      path = createRectanglePath(
        section.centerX,
        section.centerY,
        section.width,
        section.height,
        section.rotation
      );
    }

    return (
      <g
        key={section.id}
        className="section"
        onClick={(e) => handleSectionClick(section.id, e)}
        onDoubleClick={(e) => handleSectionDoubleClick(section.id, e)}
        style={{ cursor: 'pointer' }}
      >
        {/* Section shape */}
        <path
          d={path}
          fill={displayColor}
          fillOpacity={isSelected ? 0.8 : 0.5}
          stroke={isSelected ? '#3b82f6' : '#9ca3af'}
          strokeWidth={isSelected ? 3 : 1.5}
          className="section-path"
        />

        {/* Center point indicator */}
        <circle
          cx={section.centerX}
          cy={section.centerY}
          r={isSelected ? 6 : 4}
          fill={isSelected ? '#3b82f6' : '#6b7280'}
          opacity={0.7}
          className="section-center"
          pointerEvents="none"
        />

        {/* Label (only show at reasonable zoom) */}
        {canvas.zoom > 0.5 && (
          <g className="section-label" pointerEvents="none">
            <text
              x={section.centerX}
              y={section.centerY - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#000"
              fontSize="12"
              fontWeight={isSelected ? 600 : 400}
              className="section-name"
            >
              {section.name}
            </text>
            <text
              x={section.centerX}
              y={section.centerY + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#666"
              fontSize="10"
              className="section-capacity"
            >
              {section.calculatedCapacity} seats
            </text>
          </g>
        )}
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
        {/* Gradients and field defs */}
        <FieldGradientDefs />

        {/* Background grid */}
        {renderGrid()}

        {/* Transformed content */}
        <g transform={canvas.getTransform()}>
          {/* Field - hidden in section-focus mode */}
          {viewMode !== 'section-focus' && (
            <FieldRenderer fieldConfig={fieldConfig} showMarkings={true} />
          )}

          {/* Direction indicator for section-focus mode */}
          {viewMode === 'section-focus' && selectedSectionId && (
            <g className="direction-indicator">
              <text
                x={width / 2}
                y={40}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="14"
                fontWeight="500"
              >
                ← Field Direction →
              </text>
              <line
                x1={width / 2 - 100}
                y1={55}
                x2={width / 2 + 100}
                y2={55}
                stroke="#d1d5db"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
            </g>
          )}

          {/* Sections - in section-focus mode, only show selected section */}
          {viewMode === 'section-focus'
            ? sections.filter(s => s.id === selectedSectionId).map(renderSection)
            : sections.map(renderSection)
          }

        {/* Seats */}
          <SeatRenderer
            seats={viewMode === 'section-focus'
              ? seats.filter(s => s.sectionId === selectedSectionId)
              : seats
            }
            selectedSeatIds={selectedSeatIds}
            selectedSectionId={selectedSectionId}
            onSeatClick={(seatId, shiftKey, ctrlKey) => {
              onSeatClick?.(seatId, shiftKey, ctrlKey);
            }}
            viewMode={viewMode === 'section-focus' ? 'seats' : viewMode}
            zoomLevel={canvas.zoom}
          />

          {/* Drag-select rectangle preview (Phase 5) */}
          {canvas.selectionPreview && (
            <SelectionRectangle
              x={canvas.selectionPreview.x}
              y={canvas.selectionPreview.y}
              width={canvas.selectionPreview.width}
              height={canvas.selectionPreview.height}
              seatCount={canvas.selectionPreview.seatCount}
            />
          )}
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

        .section:hover .section-path {
          filter: brightness(1.15);
        }

        .section-path {
          transition: all 0.15s;
        }

        .section-center {
          transition: all 0.15s;
        }

        .section-label {
          user-select: none;
        }

        .section-name {
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
        }

        .section-capacity {
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}
