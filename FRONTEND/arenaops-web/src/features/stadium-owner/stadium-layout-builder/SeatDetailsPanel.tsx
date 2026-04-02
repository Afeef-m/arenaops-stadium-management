"use client";

import React, { useState, useRef, useEffect } from "react";
import type { LayoutSeat, SeatType } from "./types";
import { SEAT_TYPE_COLORS } from "./types";

export interface SeatDetailsPanelProps {
  selectedSeats: LayoutSeat[];
  onUpdate: (seatId: string, updates: Partial<LayoutSeat>) => void;
  onBulkUpdate: (seatIds: string[], updates: Partial<LayoutSeat>) => void;
  onDelete?: (seatIds: string[]) => void;
  onAddSeat?: (seat: LayoutSeat) => void;
  onSelectAllInRow?: (rowLabel: string) => void;
  onSelectAllInSection?: (sectionId: string) => void;
  onClearSelection?: () => void;
  disabled?: boolean;
}

type TabType = 'info' | 'properties' | 'position' | 'bulk' | 'actions';

/**
 * Seat Details Panel
 *
 * Right sidebar panel for viewing and editing selected seat(s) properties.
 * Adapts display based on single vs bulk selection.
 */
export function SeatDetailsPanel({
  selectedSeats,
  onUpdate,
  onBulkUpdate,
  onDelete,
  onAddSeat,
  onSelectAllInRow,
  onSelectAllInSection,
  onClearSelection,
  disabled = false,
}: SeatDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const disabledCheckboxRef = useRef<HTMLInputElement>(null);

  // Set indeterminate property on disabled checkbox
  useEffect(() => {
    if (disabledCheckboxRef.current) {
      const isIndeterminate =
        selectedSeats.some(s => s.disabled) &&
        selectedSeats.some(s => !s.disabled);
      disabledCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedSeats]);

  if (selectedSeats.length === 0) {
    return null;
  }

  const isBulk = selectedSeats.length > 1;
  const firstSeat = selectedSeats[0];

  // ============================================================================
  // Single Seat View
  // ============================================================================

  if (!isBulk) {
    const seat = firstSeat;
    const seatTypeColor = SEAT_TYPE_COLORS[seat.type];

    return (
      <div className="seat-details-panel">
        {/* Header */}
        <div className="panel-header">
          <h3 className="panel-title">
            Seat {seat.rowLabel}
            {seat.seatNumber}
          </h3>
          <span className="seat-location">
            {seat.sectionId}
          </span>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>
          <button
            className={`tab-button ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            Properties
          </button>
          <button
            className={`tab-button ${activeTab === 'position' ? 'active' : ''}`}
            onClick={() => setActiveTab('position')}
          >
            Position
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="section">
              <div className="info-group">
                <label className="info-label">Row</label>
                <span className="info-value">{seat.rowLabel}</span>
              </div>

              <div className="info-group">
                <label className="info-label">Seat Number</label>
                <span className="info-value">{seat.seatNumber}</span>
              </div>

              <div className="info-group">
                <label className="info-label">Section</label>
                <span className="info-value">{seat.sectionId}</span>
              </div>

              <div className="info-group">
                <label className="info-label">Seat ID</label>
                <span className="info-value code">{seat.seatId}</span>
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="section">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  value={seat.type}
                  onChange={e =>
                    onUpdate(seat.seatId, { type: e.target.value as any })
                  }
                  disabled={disabled}
                  className="form-select"
                >
                  <option value="vip">VIP</option>
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                  <option value="economy">Economy</option>
                  <option value="accessible">Accessible</option>
                </select>
              </div>

              <div className="type-color" style={{ backgroundColor: seatTypeColor }}>
                <span className="color-label">{seat.type.toUpperCase()}</span>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={seat.disabled}
                    onChange={e =>
                      onUpdate(seat.seatId, { disabled: e.target.checked })
                    }
                    disabled={disabled}
                    className="checkbox-input"
                  />
                  Disabled
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  value={seat.price}
                  onChange={e =>
                    onUpdate(seat.seatId, {
                      price: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  disabled={disabled}
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Position Tab */}
          {activeTab === 'position' && (
            <div className="section">
              <div className="info-group">
                <label className="info-label">Canvas X</label>
                <span className="info-value">{seat.x}px</span>
              </div>

              <div className="info-group">
                <label className="info-label">Canvas Y</label>
                <span className="info-value">{seat.y}px</span>
              </div>

              <div className="info-group">
                <label className="info-label">Row Label</label>
                <span className="info-value">{seat.rowLabel}</span>
              </div>

              <div className="info-group">
                <label className="info-label">Row Number</label>
                <span className="info-value">{seat.rowNumber + 1}</span>
              </div>

              <button
                className="quick-select-button"
                onClick={() => onSelectAllInRow?.(seat.rowLabel)}
              >
                Select All in Row
              </button>

              <button
                className="quick-select-button secondary"
                onClick={() => onSelectAllInSection?.(seat.sectionId)}
              >
                Select All in Section
              </button>
            </div>
          )}
        </div>

        <style jsx>{`
          .seat-details-panel {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #fff;
            border-left: 1px solid #e5e7eb;
            overflow: hidden;
          }

          .panel-header {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
          }

          .panel-title {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: #111827;
          }

          .seat-location {
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 0.25rem;
            display: block;
          }

          .tabs-container {
            display: flex;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
            overflow-x: auto;
          }

          .tab-button {
            flex: 0 0 auto;
            padding: 0.75rem 1rem;
            border: none;
            border-bottom: 2px solid transparent;
            background: #f9fafb;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
            color: #6b7280;
          }

          .tab-button:hover {
            color: #111827;
            background: #f3f4f6;
          }

          .tab-button.active {
            border-bottom-color: #3b82f6;
            color: #3b82f6;
            background: #fff;
          }

          .tab-content {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
          }

          .section {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .info-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .info-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .info-value {
            font-size: 0.875rem;
            font-weight: 500;
            color: #111827;
          }

          .info-value.code {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.75rem;
            background: #f3f4f6;
            padding: 0.5rem;
            border-radius: 0.375rem;
            word-break: break-all;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
          }

          .form-select,
          .form-input {
            padding: 0.5rem 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-family: inherit;
          }

          .form-select:focus,
          .form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-select:disabled,
          .form-input:disabled {
            opacity: 0.5;
            background: #f9fafb;
            cursor: not-allowed;
          }

          .type-color {
            padding: 1rem;
            border-radius: 0.375rem;
            text-align: center;
            margin: 0.5rem 0;
          }

          .color-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #fff;
            text-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
          }

          .checkbox-input {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }

          .checkbox-input:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          .quick-select-button,
          .quick-select-button.secondary {
            padding: 0.5rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            background: #fff;
            color: #3b82f6;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
          }

          .quick-select-button:hover:not(:disabled) {
            background: #eff6ff;
            border-color: #3b82f6;
          }

          .quick-select-button.secondary {
            background: #f3f4f6;
            color: #6b7280;
            border-color: #d1d5db;
          }

          .quick-select-button.secondary:hover:not(:disabled) {
            background: #e5e7eb;
          }

          .quick-select-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  // ============================================================================
  // Bulk Seat View
  // ============================================================================

  // Calculate statistics
  const typeCount = {
    vip: selectedSeats.filter(s => s.type === 'vip').length,
    premium: selectedSeats.filter(s => s.type === 'premium').length,
    standard: selectedSeats.filter(s => s.type === 'standard').length,
    economy: selectedSeats.filter(s => s.type === 'economy').length,
    accessible: selectedSeats.filter(s => s.type === 'accessible').length,
  };

  const disabledCount = selectedSeats.filter(s => s.disabled).length;
  const avgPrice = Math.round(
    selectedSeats.reduce((sum, s) => sum + s.price, 0) / selectedSeats.length
  );

  // Check if types are mixed
  const typesMixed = Object.values(typeCount).filter(c => c > 0).length > 1;

  const handleBulkTypeChange = (newType: string) => {
    onBulkUpdate(
      selectedSeats.map(s => s.seatId),
      { type: newType as any }
    );
  };

  const handleBulkDisabledChange = (disabled: boolean) => {
    onBulkUpdate(
      selectedSeats.map(s => s.seatId),
      { disabled }
    );
  };

  const handleBulkPriceChange = (price: number) => {
    onBulkUpdate(
      selectedSeats.map(s => s.seatId),
      { price: Math.max(0, price) }
    );
  };

  return (
    <div className="seat-details-panel bulk">
      {/* Header */}
      <div className="panel-header">
        <h3 className="panel-title">{selectedSeats.length} Seats Selected</h3>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          Edit
        </button>
        <button
          className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          Actions
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Bulk Edit Tab */}
        {activeTab === 'bulk' && (
          <div className="section">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                value={typesMixed ? 'mixed' : selectedSeats[0].type}
                onChange={e => {
                  if (e.target.value !== 'mixed') {
                    handleBulkTypeChange(e.target.value);
                  }
                }}
                disabled={disabled}
                className="form-select"
              >
                {typesMixed && <option value="mixed">Mixed Types</option>}
                <option value="vip">VIP</option>
                <option value="premium">Premium</option>
                <option value="standard">Standard</option>
                <option value="economy">Economy</option>
                <option value="accessible">Accessible</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  ref={disabledCheckboxRef}
                  type="checkbox"
                  checked={selectedSeats.some(s => s.disabled)}
                  onChange={e => handleBulkDisabledChange(e.target.checked)}
                  disabled={disabled}
                  className="checkbox-input"
                />
                Disable Selected
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Price</label>
              <input
                type="number"
                value={avgPrice}
                onChange={e => handleBulkPriceChange(parseFloat(e.target.value) || 0)}
                disabled={disabled}
                min="0"
                step="0.01"
                className="form-input"
              />
              <span className="form-hint">Apply to all {selectedSeats.length} seats</span>
            </div>

            {/* Statistics */}
            <div className="stats-box">
              <h4 className="stats-title">Type Distribution</h4>
              <div className="stat-row">
                <span className="stat-label">VIP</span>
                <span className="stat-count">{typeCount.vip}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Premium</span>
                <span className="stat-count">{typeCount.premium}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Standard</span>
                <span className="stat-count">{typeCount.standard}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Economy</span>
                <span className="stat-count">{typeCount.economy}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Accessible</span>
                <span className="stat-count">{typeCount.accessible}</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-row">
                <span className="stat-label">Disabled</span>
                <span className="stat-count">{disabledCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="section">
            <button
              className="action-button primary"
              onClick={() => onSelectAllInRow?.(firstSeat.rowLabel)}
            >
              Select All in Row {firstSeat.rowLabel}
            </button>

            <button
              className="action-button secondary"
              onClick={() => onSelectAllInSection?.(firstSeat.sectionId)}
            >
              Select All in Section
            </button>

            <div className="divider" />

            {selectedSeats.length === 1 && onAddSeat && (
              <button
                className="action-button primary"
                onClick={() => {
                  const seat = selectedSeats[0];
                  // Create new seat with offset position and incremented seat number
                  const newSeat: LayoutSeat = {
                    ...seat,
                    seatId: `seat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    seatNumber: seat.seatNumber + 1,
                    x: seat.x + 20, // Offset 20px to the right
                    y: seat.y,
                  };
                  onAddSeat(newSeat);
                }}
                disabled={disabled}
              >
                + Duplicate Seat
              </button>
            )}

            <button
              className="action-button danger"
              onClick={() => {
                if (confirm(`Delete ${selectedSeats.length} selected seat(s)? This cannot be undone.`)) {
                  onDelete?.(selectedSeats.map(s => s.seatId));
                }
              }}
              disabled={disabled}
            >
              Delete {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''}
            </button>

            <button
              className="action-button secondary"
              onClick={() => onClearSelection?.()}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .seat-details-panel.bulk {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #fff;
          border-left: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .panel-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .panel-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .tabs-container {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab-button {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-bottom: 2px solid transparent;
          background: #f9fafb;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          color: #6b7280;
        }

        .tab-button:hover {
          color: #111827;
          background: #f3f4f6;
        }

        .tab-button.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
          background: #fff;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .form-select,
        .form-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-family: inherit;
        }

        .form-select:focus,
        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-select:disabled,
        .form-input:disabled {
          opacity: 0.5;
          background: #f9fafb;
          cursor: not-allowed;
        }

        .form-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .checkbox-input:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .stats-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 1rem;
        }

        .stats-title {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.875rem;
        }

        .stat-label {
          color: #6b7280;
        }

        .stat-count {
          font-weight: 600;
          color: #111827;
        }

        .stat-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 0.75rem 0;
        }

        .action-button {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-button.primary {
          background: #eff6ff;
          color: #3b82f6;
          border-color: #3b82f6;
        }

        .action-button.primary:hover:not(:disabled) {
          background: #dbeafe;
        }

        .action-button.secondary {
          background: #f3f4f6;
          color: #6b7280;
        }

        .action-button.secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .action-button.danger {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fca5a5;
        }

        .action-button.danger:hover:not(:disabled) {
          background: #fee2e2;
        }

        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
