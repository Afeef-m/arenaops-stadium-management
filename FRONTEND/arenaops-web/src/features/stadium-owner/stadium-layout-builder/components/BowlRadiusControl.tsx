/**
 * Bowl Radius Control Panel
 *
 * Allows adjusting inner/outer radius for all sections uniformly
 * Provides sliders with min/max constraints based on field dimensions
 * Auto-regenerates seats when radius changes
 */

import React, { useState, useEffect } from 'react';
import type { FieldConfig, LayoutSection } from '../types';
import { calculateMinimumInnerRadius } from '../utils/geometry';

export interface BowlRadiusControlProps {
  sections: LayoutSection[];
  fieldConfig: FieldConfig;
  onUpdateAllSections: (updates: { innerRadius?: number; outerRadius?: number }) => void;
  onRegenerateSeats: () => void;
  disabled?: boolean;
}

export function BowlRadiusControl({
  sections,
  fieldConfig,
  onUpdateAllSections,
  onRegenerateSeats,
  disabled = false,
}: BowlRadiusControlProps) {
  // Get current radii from first section (assume uniform)
  const firstSection = sections.find(s => s.shape === 'arc');
  const [innerRadius, setInnerRadius] = useState(firstSection?.innerRadius || 100);
  const [outerRadius, setOuterRadius] = useState(firstSection?.outerRadius || 200);

  // Sync with sections when they change
  useEffect(() => {
    if (firstSection) {
      setInnerRadius(firstSection.innerRadius);
      setOuterRadius(firstSection.outerRadius);
    }
  }, [firstSection?.id]);

  // Calculate constraints
  const minimumInnerRadius = calculateMinimumInnerRadius(fieldConfig);
  const sectionHeight = outerRadius - innerRadius;

  const minInner = Math.max(minimumInnerRadius, 50);
  const maxInner = outerRadius - 20;
  const minOuter = innerRadius + 20;
  const maxOuter = 500;

  // Validation
  const isInnerValid = innerRadius >= minInner && innerRadius <= maxInner;
  const isOuterValid = outerRadius >= minOuter && outerRadius <= maxOuter;
  const isValid = isInnerValid && isOuterValid;

  const handleInnerChange = (newValue: number) => {
    setInnerRadius(newValue);
  };

  const handleOuterChange = (newValue: number) => {
    setOuterRadius(newValue);
  };

  const handleApplyChanges = () => {
    if (!isValid) return;

    onUpdateAllSections({
      innerRadius: innerRadius,
      outerRadius: outerRadius,
    });

    // Auto-regenerate seats with new geometry
    setTimeout(() => {
      onRegenerateSeats();
    }, 100);
  };

  const handleReset = () => {
    const defaultInner = minimumInnerRadius + 20;
    const defaultOuter = defaultInner + 75;

    setInnerRadius(defaultInner);
    setOuterRadius(defaultOuter);

    onUpdateAllSections({
      innerRadius: defaultInner,
      outerRadius: defaultOuter,
    });

    setTimeout(() => {
      onRegenerateSeats();
    }, 100);
  };

  return (
    <div className="bowl-radius-control">
      <div className="control-header">
        <h4 className="control-title">Bowl Geometry</h4>
      </div>

      {/* Inner Radius */}
      <div className="radius-control">
        <div className="control-label-row">
          <label className="control-label">Inner Radius</label>
          <span className={`radius-value ${isInnerValid ? '' : 'invalid'}`}>
            {innerRadius}px
          </span>
        </div>
        <input
          type="range"
          min={Math.max(50, minimumInnerRadius)}
          max={outerRadius - 20}
          value={innerRadius}
          onChange={e => handleInnerChange(Number(e.target.value))}
          className="radius-slider"
          disabled={disabled}
        />
        <div className="range-info">
          <span className="min-max">Min: {minInner}px</span>
          <span className="min-max">Max: {maxInner}px</span>
        </div>
      </div>

      {/* Outer Radius */}
      <div className="radius-control">
        <div className="control-label-row">
          <label className="control-label">Outer Radius</label>
          <span className={`radius-value ${isOuterValid ? '' : 'invalid'}`}>
            {outerRadius}px
          </span>
        </div>
        <input
          type="range"
          min={innerRadius + 20}
          max={500}
          value={outerRadius}
          onChange={e => handleOuterChange(Number(e.target.value))}
          className="radius-slider"
          disabled={disabled}
        />
        <div className="range-info">
          <span className="min-max">Min: {minOuter}px</span>
          <span className="min-max">Max: {maxOuter}px</span>
        </div>
      </div>

      {/* Section Height Display */}
      <div className="section-height">
        <span className="height-label">Section Height:</span>
        <span className="height-value">{sectionHeight}px</span>
      </div>

      {/* Validation Warning */}
      {!isValid && (
        <div className="validation-warning">
          ⚠️ Invalid radius configuration. Please adjust values.
        </div>
      )}

      {/* Helpful Info */}
      {isValid && (
        <div className="helpful-info">
          💡 Adjusts geometry for all {sections.length} sections uniformly
        </div>
      )}

      {/* Action Buttons */}
      <div className="control-actions">
        <button
          className="btn-apply"
          onClick={handleApplyChanges}
          disabled={disabled || !isValid}
        >
          Apply Changes
        </button>
        <button
          className="btn-reset"
          onClick={handleReset}
          disabled={disabled}
        >
          Reset to Default
        </button>
      </div>

      <style jsx>{`
        .bowl-radius-control {
          padding: 1rem;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .control-header {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.75rem;
        }

        .control-title {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1f2937;
        }

        .radius-control {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .control-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
        }

        .radius-value {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #3b82f6;
        }

        .radius-value.invalid {
          color: #dc2626;
        }

        .radius-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
        }

        .radius-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.15s;
        }

        .radius-slider::-webkit-slider-thumb:hover {
          background: #2563eb;
          box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
        }

        .radius-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.15s;
        }

        .radius-slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .range-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .min-max {
          font-weight: 500;
        }

        .section-height {
          padding: 0.75rem;
          background: #f3f4f6;
          border-radius: 0.375rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .height-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .height-value {
          font-size: 1rem;
          font-weight: 700;
          color: #1f2937;
        }

        .validation-warning {
          padding: 0.75rem;
          background: #fee2e2;
          border-left: 4px solid #dc2626;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          color: #991b1b;
        }

        .helpful-info {
          padding: 0.75rem;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          color: #92400e;
        }

        .control-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-apply,
        .btn-reset {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }

        .btn-apply {
          background: #3b82f6;
          color: #fff;
        }

        .btn-apply:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-apply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-reset {
          background: #fff;
          color: #6b7280;
          border: 1px solid #d1d5db;
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
