/**
 * Layout Configuration Panel
 *
 * Persistent panel in right sidebar for customizing bowl/section parameters
 * Supports flexible number inputs and per-bowl configuration
 * Shows different controls based on whether a bowl is selected or not
 */

import React, { useState, useEffect } from 'react';
import type { FieldConfig, LayoutSection, Bowl } from '../types';
import { validateLayoutForField } from '../utils/layoutGenerator';

export interface LayoutConfigurationPanelProps {
  fieldConfig: FieldConfig;
  bowls: Bowl[];
  sections: LayoutSection[];
  selectedBowlId?: string;
  onBowlSelect?: (bowlId: string) => void;
  onRegenerateBowl?: (bowlId: string, config: LayoutConfigParams) => void;
  onRegenerateAllSections?: (config: LayoutConfigParams) => void;
  disabled?: boolean;
}

export interface LayoutConfigParams {
  numSections: number;
  seatsPerSection: number;
  rowsPerSection: number;
}

const MIN_SECTIONS = 2;
const MAX_SECTIONS = 20;
const MIN_SEATS = 50;
const MAX_SEATS = 500;
const MIN_ROWS = 2;
const MAX_ROWS = 10;

export function LayoutConfigurationPanel({
  fieldConfig,
  bowls,
  sections,
  selectedBowlId,
  onBowlSelect,
  onRegenerateBowl,
  onRegenerateAllSections,
  disabled = false,
}: LayoutConfigurationPanelProps) {
  const [numSections, setNumSections] = useState(8);
  const [seatsPerSection, setSeatsPerSection] = useState(200);
  const [rowsPerSection, setRowsPerSection] = useState(5);
  const [error, setError] = useState<string | null>(null);

  // Calculate capacity and validation
  const capacity = numSections * seatsPerSection;
  const validation = validateLayoutForField(fieldConfig, numSections, rowsPerSection);
  const isValid = validation.valid && capacity >= 100 && capacity <= 100000;

  // Validation feedback
  useEffect(() => {
    if (!validation.valid) {
      setError(validation.error || 'Invalid configuration');
    } else if (capacity < 100 || capacity > 100000) {
      setError('Capacity must be between 100 and 100,000 seats');
    } else {
      setError(null);
    }
  }, [numSections, seatsPerSection, rowsPerSection, validation]);

  const handleApplyChanges = () => {
    if (!isValid) return;

    const config: LayoutConfigParams = {
      numSections,
      seatsPerSection,
      rowsPerSection,
    };

    // If a bowl is selected, regenerate that bowl only
    // Otherwise regenerate all sections
    if (selectedBowlId && onRegenerateBowl) {
      onRegenerateBowl(selectedBowlId, config);
    } else if (onRegenerateAllSections) {
      onRegenerateAllSections(config);
    }
  };

  const handleReset = () => {
    setNumSections(8);
    setSeatsPerSection(200);
    setRowsPerSection(5);
  };

  return (
    <div className="layout-configuration-panel">
      <div className="panel-header">
        <h3 className="panel-title">Layout Configuration</h3>
      </div>

      {sections.length === 0 && (
        <div className="empty-state">
          <p className="empty-message">Generate a layout first, then customize it here.</p>
        </div>
      )}

      {sections.length > 0 && (
        <>
          {/* Bowl Selection (if multiple bowls) */}
          {bowls.length > 1 && (
            <div className="bowl-selector">
              <label className="selector-label">Configure Bowl:</label>
              <select
                value={selectedBowlId || ''}
                onChange={(e) => onBowlSelect?.(e.target.value)}
                className="bowl-select"
                disabled={disabled}
              >
                <option value="">All Sections</option>
                {bowls.map(bowl => (
                  <option key={bowl.id} value={bowl.id}>
                    {bowl.name} ({bowl.sectionIds.length} sections)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Number of Sections */}
          <div className="config-control">
            <div className="control-header">
              <label className="control-label">Sections</label>
              <span className="control-value">{numSections}</span>
            </div>
            <div className="input-group">
              <input
                type="range"
                min={MIN_SECTIONS}
                max={MAX_SECTIONS}
                value={numSections}
                onChange={(e) => setNumSections(Number(e.target.value))}
                className="slider"
                disabled={disabled}
              />
              <input
                type="number"
                min={MIN_SECTIONS}
                max={MAX_SECTIONS}
                value={numSections}
                onChange={(e) => setNumSections(Math.max(MIN_SECTIONS, Math.min(MAX_SECTIONS, Number(e.target.value))))}
                className="number-input"
                disabled={disabled}
              />
            </div>
            <div className="range-hint">Range: {MIN_SECTIONS} - {MAX_SECTIONS}</div>
          </div>

          {/* Seats per Section */}
          <div className="config-control">
            <div className="control-header">
              <label className="control-label">Seats / Section</label>
              <span className="control-value">{seatsPerSection}</span>
            </div>
            <div className="input-group">
              <input
                type="range"
                min={MIN_SEATS}
                max={MAX_SEATS}
                step={10}
                value={seatsPerSection}
                onChange={(e) => setSeatsPerSection(Number(e.target.value))}
                className="slider"
                disabled={disabled}
              />
              <input
                type="number"
                min={MIN_SEATS}
                max={MAX_SEATS}
                step={10}
                value={seatsPerSection}
                onChange={(e) => setSeatsPerSection(Math.max(MIN_SEATS, Math.min(MAX_SEATS, Number(e.target.value))))}
                className="number-input"
                disabled={disabled}
              />
            </div>
            <div className="range-hint">Range: {MIN_SEATS} - {MAX_SEATS}</div>
          </div>

          {/* Rows per Section */}
          <div className="config-control">
            <div className="control-header">
              <label className="control-label">Rows / Section</label>
              <span className="control-value">{rowsPerSection}</span>
            </div>
            <div className="input-group">
              <input
                type="range"
                min={MIN_ROWS}
                max={MAX_ROWS}
                value={rowsPerSection}
                onChange={(e) => setRowsPerSection(Number(e.target.value))}
                className="slider"
                disabled={disabled}
              />
              <input
                type="number"
                min={MIN_ROWS}
                max={MAX_ROWS}
                value={rowsPerSection}
                onChange={(e) => setRowsPerSection(Math.max(MIN_ROWS, Math.min(MAX_ROWS, Number(e.target.value))))}
                className="number-input"
                disabled={disabled}
              />
            </div>
            <div className="range-hint">Range: {MIN_ROWS} - {MAX_ROWS}</div>
          </div>

          {/* Capacity Display */}
          <div className={`capacity-display ${isValid ? 'valid' : 'invalid'}`}>
            <div className="capacity-row">
              <span className="capacity-label">Total Capacity</span>
              <span className="capacity-value">{capacity.toLocaleString()}</span>
            </div>
            <div className="capacity-breakdown">
              {numSections} × {seatsPerSection} × {rowsPerSection} rows
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="panel-actions">
            <button
              className="btn-apply"
              onClick={handleApplyChanges}
              disabled={disabled || !isValid}
              title="Regenerate sections with new parameters"
            >
              Apply Changes
            </button>
            <button
              className="btn-reset"
              onClick={handleReset}
              disabled={disabled}
              title="Reset to defaults (8/200/5)"
            >
              Reset
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .layout-configuration-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-right: 1px solid #e5e7eb;
          overflow-y: auto;
        }

        .panel-header {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1rem;
        }

        .panel-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          text-align: center;
        }

        .empty-message {
          color: #9ca3af;
          font-size: 0.875rem;
          margin: 0;
        }

        .bowl-selector {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .selector-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .bowl-select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: #fff;
          cursor: pointer;
        }

        .bowl-select:focus {
          outline: none;
          border-color: #3b82f6;
          ring: 2px;
          ring-color: rgba(59, 130, 246, 0.1);
        }

        .bowl-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .config-control {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .control-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .control-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .control-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #3b82f6;
        }

        .input-group {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .slider {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .number-input {
          width: 70px;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
        }

        .number-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .number-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .range-hint {
          font-size: 0.75rem;
          color: #9ca3af;
          text-align: right;
        }

        .capacity-display {
          padding: 1rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .capacity-display.valid {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
        }

        .capacity-display.invalid {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .capacity-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .capacity-label {
          font-size: 0.8125rem;
          color: #0369a1;
          font-weight: 500;
        }

        .capacity-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0369a1;
        }

        .capacity-breakdown {
          font-size: 0.75rem;
          color: #0369a1;
          opacity: 0.8;
        }

        .error-message {
          padding: 0.75rem;
          background: #fee2e2;
          border-left: 4px solid #dc2626;
          border-radius: 0.375rem;
          color: #991b1b;
          font-size: 0.875rem;
        }

        .panel-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-apply,
        .btn-reset {
          flex: 1;
          padding: 0.625rem 1rem;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          font-size: 0.875rem;
        }

        .btn-apply {
          background: #3b82f6;
          color: #fff;
        }

        .btn-apply:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }

        .btn-apply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-reset {
          background: #fff;
          border: 1px solid #d1d5db;
          color: #6b7280;
        }

        .btn-reset:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-reset:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
