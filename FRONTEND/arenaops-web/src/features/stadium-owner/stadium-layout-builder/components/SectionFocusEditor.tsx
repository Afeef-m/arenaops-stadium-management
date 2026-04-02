"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import type { LayoutSection, LayoutSeat } from "../types";
import { SEAT_TYPE_COLORS } from "../types";

// Large seat radius for easy editing
const SEAT_RADIUS = 14;
const SEAT_GAP = 4;
const ROW_GAP = 8;
const PADDING = 60;

export interface SectionFocusEditorProps {
  section: LayoutSection;
  seats: LayoutSeat[];
  selectedSeatIds: Set<string>;
  onSeatClick: (seatId: string, shiftKey: boolean, ctrlKey?: boolean) => void;
  onSeatsSelect: (seatIds: Set<string>) => void;
  onSeatUpdate: (seatId: string, updates: Partial<LayoutSeat>) => void;
  onSeatsUpdate: (seatIds: string[], updates: Partial<LayoutSeat>) => void;
  onSeatDelete: (seatIds: string[]) => void;
  onSeatAdd: (seat: LayoutSeat) => void;
  onApplyChanges: () => void;
  onExit: () => void;
  disabled?: boolean;
}

/**
 * SectionFocusEditor - Full-screen section editing view
 *
 * Renders a section's seats in a normalized grid layout for easy editing.
 * Seats are displayed large and in rows, making it easy to select and edit.
 */
export function SectionFocusEditor({
  section,
  seats,
  selectedSeatIds,
  onSeatClick,
  onSeatsSelect,
  onSeatUpdate,
  onSeatsUpdate,
  onSeatDelete,
  onSeatAdd,
  onApplyChanges,
  onExit,
  disabled = false,
}: SectionFocusEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'select' | 'delete' | 'add'>('select');
  const [pendingChanges, setPendingChanges] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  // Group seats by row for display
  const seatsByRow = useMemo(() => {
    const grouped = new Map<string, LayoutSeat[]>();

    // Sort seats by row and seat number
    const sortedSeats = [...seats].sort((a, b) => {
      if (a.rowNumber !== b.rowNumber) return a.rowNumber - b.rowNumber;
      return a.seatNumber - b.seatNumber;
    });

    sortedSeats.forEach(seat => {
      if (!grouped.has(seat.rowLabel)) {
        grouped.set(seat.rowLabel, []);
      }
      grouped.get(seat.rowLabel)!.push(seat);
    });

    return grouped;
  }, [seats]);

  // Handle scroll wheel zoom
  const handleScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(prev => {
        const direction = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.5, Math.min(3, prev + direction));
        return newZoom;
      });
    }
  }, []);

  // Handle pan with mouse drag (when zoom > 1)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom > 1 && (e.button === 1 || (e.button === 0 && e.altKey))) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  }, [zoom, panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && panStart) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  // Calculate dimensions for the normalized view
  const layoutDimensions = useMemo(() => {
    const rowCount = seatsByRow.size;
    const maxSeatsInRow = Math.max(...Array.from(seatsByRow.values()).map(r => r.length), 1);

    const seatWidth = SEAT_RADIUS * 2 + SEAT_GAP;
    const seatHeight = SEAT_RADIUS * 2 + ROW_GAP;

    const contentWidth = maxSeatsInRow * seatWidth + PADDING * 2;
    const contentHeight = rowCount * seatHeight + PADDING * 2;

    return { rowCount, maxSeatsInRow, seatWidth, seatHeight, contentWidth, contentHeight };
  }, [seatsByRow]);

  // Handle seat click based on edit mode
  const handleSeatClick = useCallback((seat: LayoutSeat, e: React.MouseEvent) => {
    e.stopPropagation();

    if (editMode === 'delete') {
      onSeatDelete([seat.seatId]);
      setPendingChanges(true);
    } else if (editMode === 'select') {
      onSeatClick(seat.seatId, e.shiftKey, e.ctrlKey);
    }
  }, [editMode, onSeatClick, onSeatDelete]);

  // Handle adding a new seat
  const handleAddSeat = useCallback((rowLabel: string, afterSeatNumber: number) => {
    const rowSeats = seatsByRow.get(rowLabel) || [];
    const maxSeatNum = Math.max(...rowSeats.map(s => s.seatNumber), 0);

    const newSeat: LayoutSeat = {
      seatId: `${section.id}-${rowLabel}${maxSeatNum + 1}-${Date.now()}`,
      sectionId: section.id,
      sectionName: section.name,
      rowNumber: rowSeats[0]?.rowNumber || 0,
      rowLabel,
      seatNumber: maxSeatNum + 1,
      x: 0, // Will be recalculated
      y: 0,
      type: section.seatType || 'standard',
      price: 0,
      disabled: false,
    };

    onSeatAdd(newSeat);
    setPendingChanges(true);
  }, [seatsByRow, section, onSeatAdd]);

  // Handle bulk disable/enable
  const handleBulkDisableToggle = useCallback(() => {
    if (selectedSeatIds.size === 0) return;
    const selectedSeats = seats.filter(s => selectedSeatIds.has(s.seatId));
    const allDisabled = selectedSeats.every(s => s.disabled);
    onSeatsUpdate(Array.from(selectedSeatIds), { disabled: !allDisabled });
    setPendingChanges(true);
  }, [selectedSeatIds, seats, onSeatsUpdate]);

  // Handle delete selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedSeatIds.size === 0) return;
    if (confirm(`Delete ${selectedSeatIds.size} selected seat(s)?`)) {
      onSeatDelete(Array.from(selectedSeatIds));
      setPendingChanges(true);
    }
  }, [selectedSeatIds, onSeatDelete]);

  // Handle select all in row
  const handleSelectRow = useCallback((rowLabel: string) => {
    const rowSeats = seatsByRow.get(rowLabel) || [];
    onSeatsSelect(new Set(rowSeats.map(s => s.seatId)));
  }, [seatsByRow, onSeatsSelect]);

  // Handle apply changes
  const handleApply = useCallback(() => {
    onApplyChanges();
    setPendingChanges(false);
  }, [onApplyChanges]);

  // Get selected seats info
  const selectedSeatsInfo = useMemo(() => {
    const selected = seats.filter(s => selectedSeatIds.has(s.seatId));
    let disabledCount = 0;

    selected.forEach(s => {
      if (s.disabled) disabledCount++;
    });

    return { count: selected.length, disabledCount };
  }, [seats, selectedSeatIds]);

  const rowLabels = Array.from(seatsByRow.keys());

  return (
    <div className="section-focus-editor" ref={containerRef}>
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <button className="back-button" onClick={onExit}>
            ← Back to Stadium
          </button>
          <div className="section-info">
            <h2>{section.name}</h2>
            <span className="seat-count">{seats.length} seats • {seatsByRow.size} rows • {section.seatType || 'standard'}</span>
          </div>
        </div>
        <div className="header-right">
          {pendingChanges && (
            <span className="pending-indicator">Unsaved changes</span>
          )}
          <button
            className="apply-button"
            onClick={handleApply}
            disabled={!pendingChanges}
          >
            Apply Changes
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="tool-group">
          <span className="tool-label">Mode:</span>
          <button
            className={`tool-button ${editMode === 'select' ? 'active' : ''}`}
            onClick={() => setEditMode('select')}
          >
            Select
          </button>
          <button
            className={`tool-button ${editMode === 'delete' ? 'active' : ''}`}
            onClick={() => setEditMode('delete')}
          >
            Delete
          </button>
          <button
            className={`tool-button ${editMode === 'add' ? 'active' : ''}`}
            onClick={() => setEditMode('add')}
          >
            Add
          </button>
        </div>

        {selectedSeatIds.size > 0 && (
          <div className="tool-group selection-tools">
            <span className="tool-label">{selectedSeatIds.size} selected:</span>
            <button
              className="tool-button"
              onClick={handleBulkDisableToggle}
              title="Toggle disabled"
            >
              {selectedSeatsInfo.disabledCount === selectedSeatsInfo.count ? 'Enable' : 'Disable'}
            </button>
            <button
              className="tool-button danger"
              onClick={handleDeleteSelected}
              title="Delete selected"
            >
              Delete
            </button>
          </div>
        )}

        <div className="tool-group zoom-indicator">
          <span className="tool-label">Zoom: {Math.round(zoom * 100)}%</span>
          <span className="tool-hint">(Ctrl + Scroll to zoom{zoom > 1 ? ', Alt+Drag to pan' : ''})</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div
        className="seat-grid-container"
        ref={gridContainerRef}
        onWheel={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="seat-grid" style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: 'top center', transition: isPanning ? 'none' : 'transform 0.1s ease-out', cursor: zoom > 1 && !isPanning ? 'grab' : zoom > 1 && isPanning ? 'grabbing' : 'default' }}>
          {/* Field direction indicator */}
          <div className="field-indicator">
            <span>FIELD</span>
          </div>

          {/* Rows */}
          {rowLabels.map((rowLabel, rowIndex) => {
            const rowSeats = seatsByRow.get(rowLabel) || [];

            return (
              <div key={rowLabel} className="seat-row">
                {/* Row label (clickable to select all) */}
                <button
                  className="row-label"
                  onClick={() => handleSelectRow(rowLabel)}
                  title={`Select all seats in row ${rowLabel}`}
                >
                  {rowLabel}
                </button>

                {/* Seats in row */}
                <div className="seats-container">
                  {rowSeats.map((seat, seatIndex) => {
                    const isSelected = selectedSeatIds.has(seat.seatId);
                    const isHovered = hoveredSeatId === seat.seatId;
                    // Use section's seatType for color (all seats in section are same type)
                    const seatColor = SEAT_TYPE_COLORS[section.seatType] || SEAT_TYPE_COLORS.standard;

                    return (
                      <div
                        key={seat.seatId}
                        className={`seat ${isSelected ? 'selected' : ''} ${seat.disabled ? 'disabled' : ''} ${isHovered ? 'hovered' : ''}`}
                        onClick={(e) => handleSeatClick(seat, e)}
                        onMouseEnter={() => setHoveredSeatId(seat.seatId)}
                        onMouseLeave={() => setHoveredSeatId(null)}
                        style={{
                          backgroundColor: seatColor,
                          cursor: editMode === 'delete' ? 'crosshair' : 'pointer',
                        }}
                        title={`${seat.rowLabel}${seat.seatNumber}`}
                      >
                        <span className="seat-number">{seat.seatNumber}</span>
                        {seat.disabled && <span className="disabled-x">✕</span>}
                      </div>
                    );
                  })}

                  {/* Add seat button at end of row */}
                  {editMode === 'add' && (
                    <button
                      className="add-seat-button"
                      onClick={() => handleAddSeat(rowLabel, rowSeats.length)}
                      title={`Add seat to row ${rowLabel}`}
                    >
                      +
                    </button>
                  )}
                </div>

                {/* Row label (right side) */}
                <span className="row-label-right">{rowLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selection Info Panel */}
      {selectedSeatIds.size > 0 && (
        <div className="selection-panel">
          <h4>Selection Details</h4>
          <div className="selection-stats">
            <div className="stat">
              <span className="stat-label">Selected:</span>
              <span className="stat-value">{selectedSeatsInfo.count} seats</span>
            </div>
            {selectedSeatsInfo.disabledCount > 0 && (
              <div className="stat">
                <span className="stat-label">Disabled:</span>
                <span className="stat-value">{selectedSeatsInfo.disabledCount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredSeatId && (
        <div className="hover-tooltip">
          {(() => {
            const seat = seats.find(s => s.seatId === hoveredSeatId);
            if (!seat) return null;
            return (
              <>
                <strong>{seat.rowLabel}{seat.seatNumber}</strong>
                <span>Status: {seat.disabled ? 'Disabled' : 'Active'}</span>
              </>
            );
          })()}
        </div>
      )}

      <style jsx>{`
        .section-focus-editor {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: #1e293b;
          color: #fff;
          z-index: 100;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #0f172a;
          border-bottom: 1px solid #334155;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .back-button {
          padding: 0.5rem 1rem;
          border: 1px solid #475569;
          border-radius: 0.375rem;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.15s;
        }

        .back-button:hover {
          background: #334155;
          color: #fff;
        }

        .section-info h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .seat-count {
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .pending-indicator {
          color: #fbbf24;
          font-size: 0.875rem;
        }

        .apply-button {
          padding: 0.625rem 1.5rem;
          border: none;
          border-radius: 0.375rem;
          background: #22c55e;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .apply-button:hover:not(:disabled) {
          background: #16a34a;
        }

        .apply-button:disabled {
          background: #475569;
          cursor: not-allowed;
        }

        .editor-toolbar {
          display: flex;
          gap: 2rem;
          padding: 0.75rem 1.5rem;
          background: #1e293b;
          border-bottom: 1px solid #334155;
        }

        .tool-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tool-label {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-right: 0.25rem;
        }

        .tool-button {
          padding: 0.375rem 0.75rem;
          border: 1px solid #475569;
          border-radius: 0.25rem;
          background: transparent;
          color: #e2e8f0;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tool-button:hover {
          background: #334155;
        }

        .tool-button.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }

        .tool-button.danger {
          border-color: #ef4444;
          color: #ef4444;
        }

        .tool-button.danger:hover {
          background: #ef4444;
          color: #fff;
        }

        .selection-tools {
          padding-left: 1rem;
          border-left: 1px solid #475569;
        }

        .zoom-indicator {
          margin-left: auto;
        }

        .tool-hint {
          font-size: 0.75rem;
          color: #64748b;
        }

        .seat-grid-container {
          flex: 1;
          overflow: auto;
          padding: 2rem;
          display: flex;
          justify-content: center;
        }

        .seat-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: #0f172a;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .field-indicator {
          text-align: center;
          padding: 0.75rem;
          background: linear-gradient(to bottom, #166534, #15803d);
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
          color: #bbf7d0;
          letter-spacing: 0.1em;
        }

        .seat-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .row-label {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #334155;
          border: 1px solid #475569;
          border-radius: 0.25rem;
          color: #e2e8f0;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .row-label:hover {
          background: #475569;
          border-color: #3b82f6;
        }

        .row-label-right {
          width: 32px;
          text-align: center;
          color: #64748b;
          font-size: 0.75rem;
        }

        .seats-container {
          display: flex;
          gap: ${SEAT_GAP}px;
          flex-wrap: nowrap;
        }

        .seat {
          width: ${SEAT_RADIUS * 2}px;
          height: ${SEAT_RADIUS * 2}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.15s;
          border: 2px solid transparent;
        }

        .seat:hover {
          transform: scale(1.1);
          z-index: 1;
        }

        .seat.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .seat.disabled {
          opacity: 0.5;
        }

        .seat-number {
          font-size: 0.9rem;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
          line-height: 1;
        }

        .disabled-x {
          position: absolute;
          font-size: 1rem;
          color: #ef4444;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .add-seat-button {
          width: ${SEAT_RADIUS * 2}px;
          height: ${SEAT_RADIUS * 2}px;
          border-radius: 50%;
          border: 2px dashed #475569;
          background: transparent;
          color: #94a3b8;
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .add-seat-button:hover {
          border-color: #22c55e;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }

        .selection-panel {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 0.75rem;
          padding: 1rem 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .selection-panel h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .selection-stats {
          display: flex;
          gap: 1.5rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .stat-label {
          color: #94a3b8;
        }

        .stat-value {
          font-weight: 600;
          color: #fff;
        }

        .type-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .hover-tooltip {
          position: fixed;
          bottom: 5rem;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          border: 1px solid #475569;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .hover-tooltip strong {
          color: #fff;
        }

        .hover-tooltip span {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
