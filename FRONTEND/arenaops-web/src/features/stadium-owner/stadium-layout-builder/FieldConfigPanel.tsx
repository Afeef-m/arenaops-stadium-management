"use client";

import React, { useState, useEffect } from "react";
import type { FieldConfig, FieldShape, FieldUnit } from "./types";
import {
  calculateMinimumInnerRadius,
  getDefaultFieldWidth,
  getFieldShapeDisplayName,
} from "./utils/geometry";

export interface FieldConfigPanelProps {
  fieldConfig: FieldConfig;
  onChange: (config: FieldConfig) => void;
  disabled?: boolean;
}

/**
 * Field Configuration Panel
 *
 * Allows stadium owners to configure the center field:
 * - Shape (round/rectangle)
 * - Length and width
 * - Unit (yards/meters)
 * - Buffer zone
 *
 * Field dimensions functionally constrain the seating layout
 * by determining the minimum inner radius.
 */
export function FieldConfigPanel({
  fieldConfig,
  onChange,
  disabled = false,
}: FieldConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<FieldConfig>(fieldConfig);


  // Sync with parent when fieldConfig changes
  useEffect(() => {
    setLocalConfig(fieldConfig);
  }, [fieldConfig]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleShapeChange = (shape: FieldShape) => {
    const newWidth = shape === 'round'
      ? localConfig.length // Round uses length as diameter
      : getDefaultFieldWidth(shape, localConfig.length, localConfig.unit);

    const updated = {
      ...localConfig,
      shape,
      width: newWidth,
    };

    updateConfig(updated);
  };

  const handleLengthChange = (length: number) => {
    const updated = { ...localConfig, length };

    // If round, width = length
    if (localConfig.shape === 'round') {
      updated.width = length;
    }

    updateConfig(updated);
  };

  const handleWidthChange = (width: number) => {
    if (localConfig.shape === 'round') return; // Width locked for round fields

    updateConfig({ ...localConfig, width });
  };

  const handleUnitChange = (unit: FieldUnit) => {
    // Convert dimensions when changing units
    const conversionFactor = unit === 'yards' ? 1.094 : 0.9144; // meters to yards or vice versa
    const currentUnit = localConfig.unit;

    if (currentUnit === unit) return; // No change

    const updated = {
      ...localConfig,
      unit,
      length: Math.round(localConfig.length * conversionFactor * 10) / 10,
      width: Math.round(localConfig.width * conversionFactor * 10) / 10,
      bufferZone: Math.round(localConfig.bufferZone * conversionFactor * 10) / 10,
    };

    updateConfig(updated);
  };

  const handleBufferChange = (bufferZone: number) => {
    updateConfig({ ...localConfig, bufferZone });
  };



  const updateConfig = (updated: FieldConfig) => {
    // Calculate minimum inner radius
    const withRadius = {
      ...updated,
      minimumInnerRadius: calculateMinimumInnerRadius(updated),
    };

    setLocalConfig(withRadius);
    onChange(withRadius);
  };

  // ============================================================================
  // Render
  // ============================================================================

  const isRound = localConfig.shape === 'round';
  const minInnerRadiusPx = localConfig.minimumInnerRadius;
  const minInnerRadiusUnits = Math.round(minInnerRadiusPx / (localConfig.unit === 'yards' ? 2.5 : 3.0));

  return (
    <div className="field-config-panel">
      <h3 className="panel-title">Field Configuration</h3>
      <p className="panel-subtitle">
        Field dimensions determine the minimum seating radius
      </p>

      {/* Shape Selector */}
      <div className="config-section">
        <label className="config-label">Field Shape</label>
        <div className="shape-selector">
          <button
            type="button"
            className={`shape-button ${localConfig.shape === 'round' ? 'active' : ''}`}
            onClick={() => handleShapeChange('round')}
            disabled={disabled}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Round</span>
          </button>
          <button
            type="button"
            className={`shape-button ${localConfig.shape === 'rectangle' ? 'active' : ''}`}
            onClick={() => handleShapeChange('rectangle')}
            disabled={disabled}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <rect x="4" y="8" width="24" height="16" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Rectangle</span>
          </button>
        </div>
      </div>

      {/* Unit Selector */}
      <div className="config-section">
        <label className="config-label">Measurement Unit</label>
        <div className="unit-selector">
          <button
            type="button"
            className={`unit-button ${localConfig.unit === 'yards' ? 'active' : ''}`}
            onClick={() => handleUnitChange('yards')}
            disabled={disabled}
          >
            Yards
          </button>
          <button
            type="button"
            className={`unit-button ${localConfig.unit === 'meters' ? 'active' : ''}`}
            onClick={() => handleUnitChange('meters')}
            disabled={disabled}
          >
            Meters
          </button>
        </div>
      </div>

      {/* Dimensions */}
      <div className="config-section">
        <label className="config-label">
          {isRound ? 'Diameter' : 'Length'}
        </label>
        <input
          type="number"
          value={localConfig.length}
          onChange={(e) => handleLengthChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          min={localConfig.unit === 'yards' ? 50 : 45}
          max={localConfig.unit === 'yards' ? 150 : 135}
          step={0.1}
          className="number-input"
        />
        <span className="input-unit">{localConfig.unit}</span>
      </div>

      {!isRound && (
        <div className="config-section">
          <label className="config-label">Width</label>
          <input
            type="number"
            value={localConfig.width}
            onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
            disabled={disabled}
            min={localConfig.unit === 'yards' ? 40 : 35}
            max={localConfig.unit === 'yards' ? 100 : 90}
            step={0.1}
            className="number-input"
          />
          <span className="input-unit">{localConfig.unit}</span>
        </div>
      )}

      {/* Buffer Zone */}
      <div className="config-section">
        <label className="config-label">
          Buffer Zone
          <span className="label-hint">Distance from field edge to seating</span>
        </label>
        <input
          type="range"
          value={localConfig.bufferZone}
          onChange={(e) => handleBufferChange(parseFloat(e.target.value))}
          disabled={disabled}
          min={localConfig.unit === 'yards' ? 10 : 9}
          max={localConfig.unit === 'yards' ? 30 : 27}
          step={0.5}
          className="range-input"
        />
        <div className="range-value">
          {localConfig.bufferZone} {localConfig.unit}
        </div>
      </div>

      {/* Calculated Values */}
      <div className="calculated-section">
        <h4 className="calculated-title">Calculated Constraints</h4>
        <div className="calculated-item">
          <span className="calculated-label">Minimum Inner Radius:</span>
          <span className="calculated-value">
            {minInnerRadiusUnits} {localConfig.unit} ({Math.round(minInnerRadiusPx)} px)
          </span>
        </div>
        <p className="calculated-hint">
          Seating sections cannot be placed closer than this radius from the field center.
        </p>
      </div>



      {/* Visual Preview */}
      <div className="preview-section">
        <h4 className="preview-title">Field Preview</h4>
        <svg width="100%" height="120" viewBox="0 0 200 120" className="field-preview">
          {isRound ? (
            <circle
              cx="100"
              cy="60"
              r="40"
              fill="#22c55e"
              fillOpacity="0.3"
              stroke="#16a34a"
              strokeWidth="2"
            />
          ) : (
            <rect
              x="50"
              y="30"
              width="100"
              height="60"
              rx="4"
              fill="#22c55e"
              fillOpacity="0.3"
              stroke="#16a34a"
              strokeWidth="2"
            />
          )}
          <text x="100" y="115" textAnchor="middle" fill="#6b7280" fontSize="10">
            {getFieldShapeDisplayName(localConfig.shape)}
          </text>
        </svg>
      </div>

      <style jsx>{`
        .field-config-panel {
          padding: 1.5rem;
          background: #fff;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .panel-title {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }

        .panel-subtitle {
          margin: 0 0 1.5rem 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .config-section {
          margin-bottom: 1.5rem;
        }

        .config-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .label-hint {
          display: block;
          font-size: 0.75rem;
          font-weight: 400;
          color: #9ca3af;
          margin-top: 0.125rem;
        }

        .shape-selector,
        .unit-selector {
          display: flex;
          gap: 0.5rem;
        }

        .shape-button,
        .unit-button {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.375rem;
          background: #fff;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 0.875rem;
        }

        .shape-button:hover:not(:disabled),
        .unit-button:hover:not(:disabled) {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .shape-button.active,
        .unit-button.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: #fff;
        }

        .shape-button:disabled,
        .unit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .number-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .number-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-unit {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .range-input {
          width: 100%;
          margin-bottom: 0.5rem;
        }

        .range-value {
          text-align: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: #3b82f6;
        }

        .calculated-section {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 0.375rem;
          margin-top: 1.5rem;
        }

        .calculated-title {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .calculated-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .calculated-label {
          color: #6b7280;
        }

        .calculated-value {
          font-weight: 600;
          color: #16a34a;
        }

        .calculated-hint {
          margin: 0.5rem 0 0 0;
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .validation-error {
          padding: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 1rem;
        }

        .preview-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .preview-title {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .field-preview {
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}
