"use client";

import React, { useMemo, useState } from "react";
import { LayoutSeat, ViewMode, SEAT_TYPE_COLORS, SEAT_RADIUS_BASE, SEAT_RADIUS_HOVER, SEAT_RADIUS_SELECTED, SEAT_LABEL_ZOOM_THRESHOLD } from "../types";

// Performance threshold: above this, only render selected section's seats
const SEAT_RENDER_THRESHOLD = 5000;

export interface SeatRendererProps {
  seats: LayoutSeat[];
  selectedSeatIds: Set<string>;
  selectedSectionId: string | null;  // For performance optimization
  onSeatClick: (seatId: string, shiftKey: boolean, ctrlKey?: boolean) => void;
  viewMode: ViewMode;
  zoomLevel: number;
  disabled?: boolean;
}

export function SeatRenderer({
  seats,
  selectedSeatIds,
  selectedSectionId,
  onSeatClick,
  viewMode,
  zoomLevel,
  disabled = false,
}: SeatRendererProps) {
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Performance optimization: if > threshold seats, only render selected section + selected seats
  const useOptimizedRendering = seats.length > SEAT_RENDER_THRESHOLD;

  // Filter seats for rendering (performance optimization)
  const seatsToRender = useMemo(() => {
    if (!useOptimizedRendering) {
      return seats; // Render all seats for small stadiums
    }

    // For large stadiums: render only selected section + any selected seats
    return seats.filter(seat =>
      seat.sectionId === selectedSectionId || selectedSeatIds.has(seat.seatId)
    );
  }, [seats, selectedSectionId, selectedSeatIds, useOptimizedRendering]);

  // Determine label visibility threshold
  const showLabels = zoomLevel > SEAT_LABEL_ZOOM_THRESHOLD;
  const hoveredSeat = hoveredSeatId ? seatsToRender.find(s => s.seatId === hoveredSeatId) : null;
  const hoveredRowLabel = hoveredSeat?.rowLabel;

  // Memoize and render all seats grouped by section
  const seatsBySection = useMemo(() => {
    const grouped = new Map<string, React.ReactNode[]>();

    seatsToRender.forEach(seat => {
      if (!grouped.has(seat.sectionId)) {
        grouped.set(seat.sectionId, []);
      }

      const isSelected = selectedSeatIds.has(seat.seatId);
      const isHovered = hoveredSeatId === seat.seatId;
      const isInHoveredRow = hoveredRowLabel && seat.rowLabel === hoveredRowLabel;
      const seatColor = SEAT_TYPE_COLORS[seat.type] || SEAT_TYPE_COLORS.standard;
      const seatRadius = isSelected ? SEAT_RADIUS_SELECTED : isHovered ? SEAT_RADIUS_HOVER : SEAT_RADIUS_BASE;

      grouped.get(seat.sectionId)!.push(
        <g
          key={seat.seatId}
          className={`seat ${isSelected ? 'selected' : ''} ${seat.disabled ? 'disabled' : ''} ${isInHoveredRow ? 'in-hovered-row' : ''}`}
          onMouseEnter={(e) => {
            if (!disabled) {
              setHoveredSeatId(seat.seatId);
              const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
              setTooltipPos({ x: rect.left, y: rect.top });
            }
          }}
          onMouseLeave={() => {
            setHoveredSeatId(null);
            setTooltipPos(null);
          }}
          onClick={e => {
            e.stopPropagation();
            onSeatClick(seat.seatId, e.shiftKey, e.ctrlKey);
          }}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          {/* Selection glow effect (only for selected seats) */}
          {isSelected && (
            <circle
              cx={seat.x}
              cy={seat.y}
              r={SEAT_RADIUS_SELECTED + 2}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={0.8}
              opacity={0.3}
              className="seat-glow"
              pointerEvents="none"
            />
          )}

          {/* Main seat circle */}
          <circle
            cx={seat.x}
            cy={seat.y}
            r={seatRadius}
            fill={seatColor}
            fillOpacity={seat.disabled ? 0.4 : isSelected ? 0.85 : isInHoveredRow ? 0.8 : 0.7}
            stroke={isSelected ? '#3b82f6' : isInHoveredRow ? '#60a5fa' : 'none'}
            strokeWidth={isSelected ? 2 : isInHoveredRow ? 1 : 0}
            className="seat-circle"
            pointerEvents="none"
          />

          {/* Disabled seat indicator (X pattern) */}
          {seat.disabled && (
            <>
              <line
                x1={seat.x - 2.5}
                y1={seat.y - 2.5}
                x2={seat.x + 2.5}
                y2={seat.y + 2.5}
                stroke={isSelected ? '#f87171' : '#dc2626'}
                strokeWidth={0.6}
                pointerEvents="none"
              />
              <line
                x1={seat.x - 2.5}
                y1={seat.y + 2.5}
                x2={seat.x + 2.5}
                y2={seat.y - 2.5}
                stroke={isSelected ? '#f87171' : '#dc2626'}
                strokeWidth={0.6}
                pointerEvents="none"
              />
            </>
          )}

          {/* Seat label (zoom-aware) */}
          {showLabels && (
            <text
              x={seat.x}
              y={seat.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={seat.disabled ? '#9ca3af' : '#fff'}
              fontSize="7"
              fontWeight="600"
              pointerEvents="none"
              className="seat-label"
              opacity={seat.disabled ? 0.7 : 1}
            >
              {seat.seatNumber}
            </text>
          )}
        </g>
      );
    });

    return grouped;
  }, [seatsToRender, selectedSeatIds, hoveredSeatId, hoveredRowLabel, showLabels, disabled, onSeatClick]);

  // Only render seats in 'seats' view mode (after all hooks)
  if (viewMode !== 'seats') {
    return null;
  }

  return (
    <g className="seat-layer">
      {Array.from(seatsBySection.entries()).map(([sectionId, seatNodes]) => (
        <g key={`section-${sectionId}`} className="seat-section">
          {seatNodes}
        </g>
      ))}

      {/* Tooltip */}
      {hoveredSeat && !disabled && (
        <g className="seat-tooltip">
          <text
            x={hoveredSeat.x}
            y={hoveredSeat.y - 8}
            textAnchor="middle"
            dominantBaseline="auto"
            fill="#fff"
            fontSize="9"
            fontWeight="600"
            pointerEvents="none"
            className="tooltip-text"
          >
            {hoveredSeat.rowLabel}
            {hoveredSeat.seatNumber}
          </text>
        </g>
      )}

      <style jsx>{`
        .seat-layer {
          pointer-events: auto;
        }

        .seat {
          transition: all 0.12s ease-out;
        }

        .seat:not(.disabled):hover .seat-circle {
          filter: brightness(1.25);
        }

        .seat.selected .seat-circle {
          filter: brightness(1.05);
        }

        .seat.in-hovered-row:not(.selected) .seat-circle {
          filter: brightness(1.15);
        }

        .seat-circle {
          transition: all 0.12s ease-out;
        }

        .seat-glow {
          animation: glow-pulse 2s ease-in-out infinite;
          transition: all 0.12s ease-out;
        }

        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.3;
            r: ${SEAT_RADIUS_SELECTED + 2}px;
          }
          50% {
            opacity: 0.5;
            r: ${SEAT_RADIUS_SELECTED + 3}px;
          }
        }

        .seat-label {
          text-shadow: 0 0 1px rgba(0, 0, 0, 0.8);
          user-select: none;
          font-family: system-ui, -apple-system, sans-serif;
          transition: all 0.12s ease-out;
        }

        .seat.disabled .seat-label {
          opacity: 0.5;
        }

        .seat-tooltip {
          pointer-events: none;
        }

        .tooltip-text {
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.8), 0 0 6px rgba(59, 130, 246, 0.4);
          user-select: none;
          font-family: system-ui, -apple-system, sans-serif;
          animation: tooltip-fade-in 0.15s ease-out;
        }

        @keyframes tooltip-fade-in {
          from {
            opacity: 0;
            transform: translateY(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </g>
  );
}
