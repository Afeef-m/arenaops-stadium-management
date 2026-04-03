"use client";

import React, { useState, useEffect } from "react";
import { calculateSectionCapacity } from "./utils/geometry";
import type { LayoutSection, Bowl, FieldConfig, SeatType } from "./types";

export interface SectionPropertiesPanelProps {
  section: LayoutSection;
  bowls: Bowl[];
  fieldConfig: FieldConfig;
  /** Called when Info (name/color/seatType) Apply is clicked → PUT /api/sections/{id} */
  onChange: (sectionId: string, updates: Partial<LayoutSection>) => void;
  /** Called when Geometry Apply is clicked → PUT /api/sections/{id}/geometry */
  onChangeGeometry: (sectionId: string, updates: Partial<LayoutSection>) => void;
  onDelete: (sectionId: string) => void;
  disabled?: boolean;
}

type TabType = 'info' | 'geometry' | 'bowl';

export function SectionPropertiesPanel({
  section,
  bowls,
  fieldConfig,
  onChange,
  onChangeGeometry,
  onDelete,
  disabled = false,
}: SectionPropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [localSection, setLocalSection] = useState<LayoutSection>(section);

  // Sync with parent when a different section is selected
  useEffect(() => {
    setLocalSection(section);
    setActiveTab('info');
  }, [section.id]);

  // Keep local state fresh if parent pushes updates (e.g. after auto-save)
  useEffect(() => {
    setLocalSection(section);
  }, [section]);

  // Validate geometry
  useEffect(() => {
  }, [localSection, fieldConfig]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleUpdate = (updates: Partial<LayoutSection>) => {
    setLocalSection(prev => ({ ...prev, ...updates }));
  };

  /** Info tab: persist name, seatType, color via PUT /api/sections/{id} */
  const handleApplyInfo = () => {
    onChange(section.id, {
      name: localSection.name,
      seatType: localSection.seatType,
      color: localSection.color,
    });
  };

  /** Geometry tab: persist shape + position + radii + rows via PUT /api/sections/{id}/geometry */
  const handleApplyGeometry = () => {
    onChangeGeometry(section.id, localSection);
  };

  const handleApply = activeTab === 'info' ? handleApplyInfo
    : activeTab === 'geometry' ? handleApplyGeometry
    : undefined;

  const handleDelete = () => {
    if (confirm(`Delete section "${localSection.name}"?`)) {
      onDelete(section.id);
    }
  };

  const handleBowlAssign = (bowlId: string | null) => {
    handleUpdate({ bowlId });
  };

  // Capacity preview (computed from rows & seatsPerRow)
  const capacity = calculateSectionCapacity(
    localSection.rows,
    localSection.seatsPerRow,
    localSection.verticalAisles || [],
    localSection.horizontalAisles || []
  );

  const assignedBowl = bowls.find(b => b.id === localSection.bowlId);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="section-properties-panel">
      {/* Header */}
      <div className="panel-header">
        <h3 className="panel-title">{localSection.name}</h3>
        {localSection.isLocked && <span className="locked-badge">🔒 Locked</span>}
      </div>

      {/* Tabs — Info | Geometry | Bowl */}
      <div className="tabs-container">
        {(['info', 'geometry', 'bowl'] as TabType[]).map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">

        {/* ── Info Tab ── */}
        {activeTab === 'info' && (
          <div className="section">
            <div className="form-group">
              <label className="form-label">Section Name</label>
              <input
                type="text"
                value={localSection.name}
                onChange={e => { if (e.target.value.trim()) handleUpdate({ name: e.target.value }); }}
                disabled={disabled}
                className="form-input"
                placeholder="e.g., Section 101"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Seat Type</label>
              <select
                value={localSection.seatType}
                onChange={e => handleUpdate({ seatType: e.target.value as SeatType })}
                disabled={disabled}
                className="form-select"
              >
                <option value="standard">Standard</option>
                <option value="vip">VIP</option>
                <option value="premium">Premium</option>
                <option value="economy">Economy</option>
                <option value="accessible">Accessible</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={localSection.color}
                  onChange={e => handleUpdate({ color: e.target.value })}
                  disabled={disabled}
                  className="color-input"
                />
                <span className="color-value">{localSection.color}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localSection.isActive}
                  onChange={() => handleUpdate({ isActive: !localSection.isActive })}
                  disabled={disabled}
                  className="checkbox-input"
                />
                Active
              </label>
            </div>

            <button
              type="button"
              className="delete-button"
              onClick={handleDelete}
              disabled={disabled}
            >
              Delete Section
            </button>
          </div>
        )}

        {/* ── Geometry Tab ── */}
        {activeTab === 'geometry' && (
          <div className="section">
            {/* Shape */}
            <div className="form-group">
              <label className="form-label">Shape</label>
              <div className="button-group">
                <button
                  type="button"
                  className={`form-button ${localSection.shape === 'arc' ? 'active' : ''}`}
                  onClick={() => handleUpdate({ shape: 'arc' })}
                  disabled={disabled}
                >
                  Arc
                </button>
                <button
                  type="button"
                  className={`form-button ${localSection.shape === 'rectangle' ? 'active' : ''}`}
                  onClick={() => handleUpdate({ shape: 'rectangle' })}
                  disabled={disabled}
                >
                  Rectangle
                </button>
              </div>
            </div>

            {/* Position */}
            <div className="form-group">
              <label className="form-label">Center X</label>
              <input
                type="number"
                value={localSection.centerX}
                onChange={e => handleUpdate({ centerX: parseFloat(e.target.value) })}
                disabled={disabled} min="0" max="1400" step="1"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Center Y</label>
              <input
                type="number"
                value={localSection.centerY}
                onChange={e => handleUpdate({ centerY: parseFloat(e.target.value) })}
                disabled={disabled} min="0" max="900" step="1"
                className="form-input"
              />
            </div>

            {/* Arc-specific */}
            {localSection.shape === 'arc' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Inner Radius: <span className="value">{localSection.innerRadius}px</span></label>
                  <input type="range" value={localSection.innerRadius}
                    onChange={e => handleUpdate({ innerRadius: parseFloat(e.target.value) })}
                    disabled={disabled} min="0" max="400" step="5" className="form-range" />
                </div>
                <div className="form-group">
                  <label className="form-label">Outer Radius: <span className="value">{localSection.outerRadius}px</span></label>
                  <input type="range" value={localSection.outerRadius}
                    onChange={e => handleUpdate({ outerRadius: parseFloat(e.target.value) })}
                    disabled={disabled} min="0" max="500" step="5" className="form-range" />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Angle (°)</label>
                  <input type="number" value={localSection.startAngle}
                    onChange={e => handleUpdate({ startAngle: parseFloat(e.target.value) % 360 })}
                    disabled={disabled} min="0" max="360" step="1" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">End Angle (°)</label>
                  <input type="number" value={localSection.endAngle}
                    onChange={e => handleUpdate({ endAngle: parseFloat(e.target.value) % 360 })}
                    disabled={disabled} min="0" max="360" step="1" className="form-input" />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Width: <span className="value">{localSection.width}px</span></label>
                  <input type="range" value={localSection.width}
                    onChange={e => handleUpdate({ width: parseFloat(e.target.value) })}
                    disabled={disabled} min="50" max="600" step="10" className="form-range" />
                </div>
                <div className="form-group">
                  <label className="form-label">Height: <span className="value">{localSection.height}px</span></label>
                  <input type="range" value={localSection.height}
                    onChange={e => handleUpdate({ height: parseFloat(e.target.value) })}
                    disabled={disabled} min="50" max="600" step="10" className="form-range" />
                </div>
                <div className="form-group">
                  <label className="form-label">Rotation: <span className="value">{localSection.rotation}°</span></label>
                  <input type="range" value={localSection.rotation}
                    onChange={e => handleUpdate({ rotation: parseFloat(e.target.value) % 360 })}
                    disabled={disabled} min="0" max="360" step="1" className="form-range" />
                </div>
              </>
            )}

            {/* Seating config (moved from old Seating tab) */}
            <div className="section-divider">Seating</div>

            <div className="form-group">
              <label className="form-label">Rows</label>
              <input
                type="number"
                value={localSection.rows}
                onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) handleUpdate({ rows: v }); }}
                disabled={disabled} min="1" max="100" step="1"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seats per Row</label>
              <input
                type="number"
                value={localSection.seatsPerRow}
                onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) handleUpdate({ seatsPerRow: v }); }}
                disabled={disabled} min="1" max="100" step="1"
                className="form-input"
              />
            </div>

            <div className="capacity-display">
              <span className="capacity-label">Calculated Capacity:</span>
              <span className="capacity-value">{capacity.toLocaleString()} seats</span>
            </div>
          </div>
        )}

        {/* ── Bowl Tab ── */}
        {activeTab === 'bowl' && (
          <div className="section">
            <div className="form-group">
              <label className="form-label">Assign to Bowl</label>
              <select
                value={localSection.bowlId || ''}
                onChange={e => handleBowlAssign(e.target.value || null)}
                disabled={disabled}
                className="form-select"
              >
                <option value="">Not Assigned</option>
                {bowls.map(bowl => (
                  <option key={bowl.id} value={bowl.id}>
                    {bowl.name} ({bowl.sectionIds.length} sections)
                  </option>
                ))}
              </select>
            </div>

            {assignedBowl && (
              <div className="bowl-info">
                <div className="bowl-color" style={{ backgroundColor: assignedBowl.color }} />
                <div className="bowl-details">
                  <p className="bowl-name">{assignedBowl.name}</p>
                  <p className="bowl-status">{assignedBowl.isActive ? '✓ Active' : '✗ Inactive'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Apply button — hidden on Bowl tab (bowl assignment auto-applies via select) */}
      {activeTab !== 'bowl' && handleApply && (
        <div className="panel-footer">
          <button
            type="button"
            className="apply-button"
            onClick={handleApply}
            disabled={disabled}
          >
            Apply Changes
          </button>
        </div>
      )}

      <style jsx>{`
        .section-properties-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #fff;
          border-left: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .panel-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .locked-badge {
          font-size: 0.75rem;
          background: #fef2f2;
          color: #dc2626;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          flex-shrink: 0;
        }

        .tabs-container {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab-button {
          flex: 1;
          padding: 0.75rem 0.5rem;
          border: none;
          border-bottom: 2px solid transparent;
          background: #f9fafb;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          color: #6b7280;
        }

        .tab-button:hover { color: #111827; background: #f3f4f6; }

        .tab-button.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
          background: #fff;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .section-divider {
          margin-top: 0.5rem;
          padding-bottom: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #9ca3af;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #374151;
        }

        .value {
          font-weight: 600;
          color: #3b82f6;
          margin-left: 0.35rem;
        }

        .form-input,
        .form-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input:disabled,
        .form-select:disabled { opacity: 0.5; background: #f9fafb; cursor: not-allowed; }

        .form-range { padding: 0; cursor: pointer; width: 100%; }
        .form-range:disabled { cursor: not-allowed; }

        .button-group { display: flex; gap: 0.5rem; }

        .form-button {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .form-button:hover:not(:disabled) { border-color: #3b82f6; background: #eff6ff; }
        .form-button.active { border-color: #3b82f6; background: #3b82f6; color: #fff; }
        .form-button:disabled { opacity: 0.5; cursor: not-allowed; }

        .color-picker-group { display: flex; align-items: center; gap: 0.75rem; }

        .color-input {
          width: 50px;
          height: 40px;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          cursor: pointer;
          padding: 2px;
        }

        .color-value { font-size: 0.875rem; color: #6b7280; font-family: monospace; }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .checkbox-input { width: 18px; height: 18px; cursor: pointer; }
        .checkbox-input:disabled { cursor: not-allowed; opacity: 0.5; }

        .capacity-display {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 0.375rem;
        }

        .capacity-label { font-size: 0.8125rem; color: #166534; }
        .capacity-value { font-size: 0.875rem; font-weight: 600; color: #16a34a; }

        .bowl-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .bowl-color { width: 36px; height: 36px; border-radius: 0.375rem; border: 1px solid #d1d5db; flex-shrink: 0; }
        .bowl-name { margin: 0; font-size: 0.875rem; font-weight: 600; color: #111827; }
        .bowl-status { margin: 0.2rem 0 0 0; font-size: 0.75rem; color: #6b7280; }

        .delete-button {
          padding: 0.5rem 1rem;
          border: 1px solid #fca5a5;
          border-radius: 0.375rem;
          background: #fef2f2;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .delete-button:hover:not(:disabled) { background: #fee2e2; border-color: #f87171; }
        .delete-button:disabled { opacity: 0.5; cursor: not-allowed; }

        .validation-errors, .validation-warnings {
          margin: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.375rem;
        }

        .validation-errors { border: 1px solid #fca5a5; background: #fef2f2; }
        .validation-warnings { border: 1px solid #fed7aa; background: #fffbeb; }

        .validation-title { margin: 0 0 0.4rem 0; font-size: 0.8125rem; font-weight: 600; color: #dc2626; }
        .validation-warnings .validation-title { color: #b45309; }

        .validation-list { margin: 0; padding-left: 1.1rem; font-size: 0.8125rem; color: #7f1d1d; }
        .validation-warnings .validation-list { color: #92400e; }
        .validation-list li { margin: 0.2rem 0; }

        .panel-footer {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .apply-button {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: background 0.15s;
        }

        .apply-button:hover:not(:disabled) { background: #2563eb; }
        .apply-button:disabled { background: #9ca3af; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
