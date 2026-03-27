/**
 * Layout Configuration Panel
 *
 * Displays current layout statistics and bowl information
 */

import React from 'react';
import type { FieldConfig, LayoutSection, Bowl } from '../types';

export interface LayoutConfigurationPanelProps {
  fieldConfig: FieldConfig;
  bowls: Bowl[];
  sections: LayoutSection[];
  selectedBowlId?: string;
  onBowlSelect?: (bowlId: string) => void;
  disabled?: boolean;
}

export function LayoutConfigurationPanel({
  fieldConfig,
  bowls,
  sections,
  selectedBowlId,
  onBowlSelect,
  disabled = false,
}: LayoutConfigurationPanelProps) {
  // Calculate total capacity
  const totalCapacity = sections.reduce((sum, section) => sum + section.calculatedCapacity, 0);

  return (
    <div className="layout-configuration-panel">
      <div className="panel-header">
        <h3 className="panel-title">Layout Information</h3>
      </div>

      {sections.length === 0 && (
        <div className="empty-state">
          <p className="empty-message">Create sections to see layout statistics.</p>
        </div>
      )}

      {sections.length > 0 && (
        <>
          {/* Bowl Selection (if multiple bowls) */}
          {bowls.length > 1 && (
            <div className="bowl-selector">
              <label className="selector-label">View Bowl:</label>
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

          {/* Layout Statistics */}
          <div className="stats-display">
            <div className="stat-row">
              <span className="stat-label">Total Sections</span>
              <span className="stat-value">{sections.length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total Capacity</span>
              <span className="stat-value">{totalCapacity.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Bowls</span>
              <span className="stat-value">{bowls.length}</span>
            </div>
          </div>

          <div className="info-message">
            💡 Use the section creator and editor to customize your layout.
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

        .stats-display {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 0.375rem;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #0369a1;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0369a1;
        }

        .info-message {
          padding: 0.75rem;
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          border-radius: 0.375rem;
          color: #92400e;
          font-size: 0.875rem;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
