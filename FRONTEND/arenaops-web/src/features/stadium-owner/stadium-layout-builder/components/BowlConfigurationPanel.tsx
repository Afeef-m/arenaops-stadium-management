/**
 * Bowl Configuration Panel
 *
 * Displays current bowl configuration after auto-generation
 * Allows editing parameters and regenerating with new settings
 * Shown in right sidebar when no seats are selected
 */

import React, { useMemo } from 'react';
import type { FieldConfig, LayoutSection } from '../types';
import type { GenerationParams } from './GenerationParametersDialog';

export interface BowlConfigurationPanelProps {
  sections: LayoutSection[];
  fieldConfig: FieldConfig;
  onEditParameters: () => void;
  disabled?: boolean;
}

export function BowlConfigurationPanel({
  sections,
  fieldConfig,
  onEditParameters,
  disabled = false,
}: BowlConfigurationPanelProps) {
  // Calculate current parameters from sections
  const config = useMemo(() => {
    const numSections = sections.length;
    const totalCapacity = sections.reduce((sum, s) => sum + s.calculatedCapacity, 0);
    const avgCapacity = numSections > 0 ? Math.round(totalCapacity / numSections) : 0;

    // Try to determine seatsPerSection and rowsPerSection from sections
    // (assume uniform configuration if regenerated from dialog)
    const firstSection = sections[0];
    const seatsPerSection = firstSection?.calculatedCapacity || 200;
    const rowsPerSection = firstSection?.rows || 5;

    return {
      numSections,
      totalCapacity,
      avgCapacity,
      seatsPerSection,
      rowsPerSection,
    };
  }, [sections]);

  return (
    <div className="bowl-configuration-panel">
      <div className="panel-header">
        <h3 className="panel-title">Bowl Configuration</h3>
      </div>

      {/* Current Configuration */}
      <div className="config-info">
        <div className="config-row">
          <span className="label">Sections:</span>
          <span className="value">{config.numSections}</span>
        </div>
        <div className="config-row">
          <span className="label">Seats/Section:</span>
          <span className="value">{config.seatsPerSection}</span>
        </div>
        <div className="config-row">
          <span className="label">Rows/Section:</span>
          <span className="value">{config.rowsPerSection}</span>
        </div>
      </div>

      {/* Capacity Stats */}
      <div className="capacity-card">
        <div className="capacity-row">
          <span className="capacity-label">Total Capacity</span>
          <span className="capacity-value">{config.totalCapacity.toLocaleString()}</span>
        </div>
        <div className="capacity-row">
          <span className="capacity-label">Avg per Section</span>
          <span className="capacity-value">{config.avgCapacity}</span>
        </div>
      </div>

      {/* Configuration Breakdown */}
      <div className="config-breakdown">
        <p className="breakdown-text">
          {config.numSections} sections × {config.seatsPerSection} seats × {config.rowsPerSection} rows = {config.totalCapacity.toLocaleString()} total
        </p>
      </div>

      {/* Action Buttons */}
      <div className="panel-actions">
        <button
          className="btn-edit"
          onClick={onEditParameters}
          disabled={disabled}
          title="Edit sections, seats, rows and regenerate"
        >
          ✏️ Edit Parameters
        </button>
      </div>

      <style jsx>{`
        .bowl-configuration-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-right: 1px solid #e5e7eb;
          min-height: 300px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .config-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .config-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .config-row .label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .config-row .value {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .capacity-card {
          padding: 1rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 0.375rem;
        }

        .capacity-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .capacity-row:last-child {
          margin-bottom: 0;
        }

        .capacity-label {
          font-size: 0.8125rem;
          color: #0369a1;
          font-weight: 500;
        }

        .capacity-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0369a1;
        }

        .config-breakdown {
          padding: 0.75rem 1rem;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 0.375rem;
        }

        .breakdown-text {
          margin: 0;
          font-size: 0.8125rem;
          color: #92400e;
          line-height: 1.4;
        }

        .panel-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn-edit {
          padding: 0.625rem 1rem;
          border: 1px solid #3b82f6;
          border-radius: 0.375rem;
          background: #fff;
          color: #3b82f6;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 0.875rem;
        }

        .btn-edit:hover:not(:disabled) {
          background: #f0f9ff;
          border-color: #2563eb;
          color: #2563eb;
        }

        .btn-edit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
