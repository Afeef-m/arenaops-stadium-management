"use client";

import React, { useState, useEffect } from "react";
import { validateSectionGeometry, calculateSectionCapacity } from "./utils/geometry";
import type { LayoutSection, Bowl, FieldConfig, SeatType } from "./types";

export interface SectionPropertiesPanelProps {
  section: LayoutSection;
  bowls: Bowl[];
  fieldConfig: FieldConfig;
  onChange: (sectionId: string, updates: Partial<LayoutSection>) => void;
  onDelete: (sectionId: string) => void;
  disabled?: boolean;
}

type TabType = 'info' | 'geometry' | 'seating' | 'aisles' | 'bowl';

/**
 * Section Properties Panel
 *
 * Right sidebar component for editing selected section properties.
 * Provides tabbed interface for managing section geometry, seating, and assignment.
 */
export function SectionPropertiesPanel({
  section,
  bowls,
  fieldConfig,
  onChange,
  onDelete,
  disabled = false,
}: SectionPropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [localSection, setLocalSection] = useState<LayoutSection>(section);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Sync with parent
  useEffect(() => {
    setLocalSection(section);
  }, [section]);

  // Validate section geometry
  useEffect(() => {
    const validation = validateSectionGeometry(
      localSection,
      fieldConfig,
      1400,
      900
    );
    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);
  }, [localSection, fieldConfig]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleUpdate = (updates: Partial<LayoutSection>) => {
    const updated = { ...localSection, ...updates };
    setLocalSection(updated);
    onChange(section.id, updates);
  };

  const handleNameChange = (name: string) => {
    if (name.trim()) {
      handleUpdate({ name });
    }
  };

  const handleShapeChange = (shape: 'arc' | 'rectangle') => {
    // When changing shape, keep existing geometry and let user adjust
    handleUpdate({ shape });
  };

  const handleColorChange = (color: string) => {
    handleUpdate({ color });
  };

  const handleActiveToggle = () => {
    handleUpdate({ isActive: !localSection.isActive });
  };

  const handleCenterXChange = (centerX: number) => {
    if (!isNaN(centerX)) handleUpdate({ centerX });
  };

  const handleCenterYChange = (centerY: number) => {
    if (!isNaN(centerY)) handleUpdate({ centerY });
  };

  // Arc-specific handlers
  const handleInnerRadiusChange = (innerRadius: number) => {
    if (!isNaN(innerRadius) && innerRadius > 0) {
      handleUpdate({ innerRadius });
    }
  };

  const handleOuterRadiusChange = (outerRadius: number) => {
    if (!isNaN(outerRadius) && outerRadius > 0) {
      handleUpdate({ outerRadius });
    }
  };

  const handleStartAngleChange = (startAngle: number) => {
    if (!isNaN(startAngle)) {
      const normalized = startAngle % 360;
      handleUpdate({ startAngle: normalized < 0 ? normalized + 360 : normalized });
    }
  };

  const handleEndAngleChange = (endAngle: number) => {
    if (!isNaN(endAngle)) {
      const normalized = endAngle % 360;
      handleUpdate({ endAngle: normalized < 0 ? normalized + 360 : normalized });
    }
  };

  // Rectangle-specific handlers
  const handleWidthChange = (width: number) => {
    if (!isNaN(width) && width > 0) handleUpdate({ width });
  };

  const handleHeightChange = (height: number) => {
    if (!isNaN(height) && height > 0) handleUpdate({ height });
  };

  const handleRotationChange = (rotation: number) => {
    if (!isNaN(rotation)) {
      const normalized = rotation % 360;
      handleUpdate({ rotation: normalized < 0 ? normalized + 360 : normalized });
    }
  };

  // Seating handlers
  const handleRowsChange = (rows: number) => {
    if (!isNaN(rows) && rows > 0) handleUpdate({ rows });
  };

  const handleSeatsPerRowChange = (seatsPerRow: number) => {
    if (!isNaN(seatsPerRow) && seatsPerRow > 0) handleUpdate({ seatsPerRow });
  };

  const handleSeatTypeChange = (seatType: SeatType) => {
    handleUpdate({ seatType });
  };

  // Aisles handlers
  const handleVerticalAislesChange = (value: string) => {
    const indices = value
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 0 && n < localSection.seatsPerRow);
    handleUpdate({ verticalAisles: indices });
  };

  const handleHorizontalAislesChange = (value: string) => {
    const indices = value
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 0 && n < localSection.rows);
    handleUpdate({ horizontalAisles: indices });
  };

  // Bowl assignment handler
  const handleBowlAssign = (bowlId: string | null) => {
    handleUpdate({ bowlId });
  };

  const handleDelete = () => {
    if (confirm(`Delete section "${localSection.name}"?`)) {
      onDelete(section.id);
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const assignedBowl = bowls.find(b => b.id === localSection.bowlId);
  const capacity = calculateSectionCapacity(
    localSection.rows,
    localSection.seatsPerRow,
    localSection.verticalAisles,
    localSection.horizontalAisles
  );

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

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
        <button
          className={`tab-button ${activeTab === 'geometry' ? 'active' : ''}`}
          onClick={() => setActiveTab('geometry')}
        >
          Geometry
        </button>
        <button
          className={`tab-button ${activeTab === 'seating' ? 'active' : ''}`}
          onClick={() => setActiveTab('seating')}
        >
          Seating
        </button>
        <button
          className={`tab-button ${activeTab === 'aisles' ? 'active' : ''}`}
          onClick={() => setActiveTab('aisles')}
        >
          Aisles
        </button>
        <button
          className={`tab-button ${activeTab === 'bowl' ? 'active' : ''}`}
          onClick={() => setActiveTab('bowl')}
        >
          Bowl
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="section">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                value={localSection.name}
                onChange={e => handleNameChange(e.target.value)}
                disabled={disabled}
                className="form-input"
                placeholder="e.g., Section 101"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shape</label>
              <div className="button-group">
                <button
                  type="button"
                  className={`form-button ${localSection.shape === 'arc' ? 'active' : ''}`}
                  onClick={() => handleShapeChange('arc')}
                  disabled={disabled}
                >
                  Arc
                </button>
                <button
                  type="button"
                  className={`form-button ${localSection.shape === 'rectangle' ? 'active' : ''}`}
                  onClick={() => handleShapeChange('rectangle')}
                  disabled={disabled}
                >
                  Rectangle
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={localSection.color}
                  onChange={e => handleColorChange(e.target.value)}
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
                  onChange={handleActiveToggle}
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

        {/* Geometry Tab */}
        {activeTab === 'geometry' && (
          <div className="section">
            <div className="form-group">
              <label className="form-label">Center X</label>
              <input
                type="number"
                value={localSection.centerX}
                onChange={e => handleCenterXChange(parseFloat(e.target.value))}
                disabled={disabled}
                min="0"
                max="1400"
                step="1"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Center Y</label>
              <input
                type="number"
                value={localSection.centerY}
                onChange={e => handleCenterYChange(parseFloat(e.target.value))}
                disabled={disabled}
                min="0"
                max="900"
                step="1"
                className="form-input"
              />
            </div>

            {localSection.shape === 'arc' ? (
              <>
                <div className="form-group">
                  <label className="form-label">
                    Inner Radius: <span className="value">{localSection.innerRadius}px</span>
                  </label>
                  <input
                    type="range"
                    value={localSection.innerRadius}
                    onChange={e => handleInnerRadiusChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    min="0"
                    max="400"
                    step="5"
                    className="form-range"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Outer Radius: <span className="value">{localSection.outerRadius}px</span>
                  </label>
                  <input
                    type="range"
                    value={localSection.outerRadius}
                    onChange={e => handleOuterRadiusChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    min="0"
                    max="500"
                    step="5"
                    className="form-range"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Angle (°)</label>
                  <input
                    type="number"
                    value={localSection.startAngle}
                    onChange={e => handleStartAngleChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    min="0"
                    max="360"
                    step="1"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Angle (°)</label>
                  <input
                    type="number"
                    value={localSection.endAngle}
                    onChange={e => handleEndAngleChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    min="0"
                    max="360"
                    step="1"
                    className="form-input"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">
                    Width: <span className="value">{localSection.width}px</span>
                  </label>
                  <input
                    type="range"
                    value={localSection.width}
                    onChange={e => handleWidthChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    min="50"
                    max="600"
                    step="10"
                    className="form-range"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Height: <span className="value">{localSection.height}px</span>
                  </label>
                  <input
                    type="range"
                    value={localSection.height}
                    onChange={e => handleHeightChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    min="50"
                    max="600"
                    step="10"
                    className="form-range"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Rotation: <span className="value">{localSection.rotation}°</span>
                  </label>
                  <input
                    type="range"
                    value={localSection.rotation}
                    onChange={e => handleRotationChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    min="0"
                    max="360"
                    step="1"
                    className="form-range"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Seating Tab */}
        {activeTab === 'seating' && (
          <div className="section">
            <div className="form-group">
              <label className="form-label">Rows</label>
              <input
                type="number"
                value={localSection.rows}
                onChange={e => handleRowsChange(parseFloat(e.target.value))}
                disabled={disabled}
                min="1"
                max="100"
                step="1"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Seats Per Row</label>
              <input
                type="number"
                value={localSection.seatsPerRow}
                onChange={e => handleSeatsPerRowChange(parseFloat(e.target.value))}
                disabled={disabled}
                min="1"
                max="100"
                step="1"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Seat Type</label>
              <select
                value={localSection.seatType}
                onChange={e => handleSeatTypeChange(e.target.value as SeatType)}
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

            <div className="capacity-display">
              <span className="capacity-label">Calculated Capacity:</span>
              <span className="capacity-value">{capacity.toLocaleString()} seats</span>
            </div>
          </div>
        )}

        {/* Aisles Tab */}
        {activeTab === 'aisles' && (
          <div className="section">
            <div className="form-group">
              <label className="form-label">Vertical Aisles</label>
              <p className="form-hint">Comma-separated seat indices (e.g., 10, 20)</p>
              <input
                type="text"
                value={localSection.verticalAisles.join(', ')}
                onChange={e => handleVerticalAislesChange(e.target.value)}
                disabled={disabled}
                className="form-input"
                placeholder="10, 20"
              />
              {localSection.verticalAisles.length > 0 && (
                <div className="selected-items">
                  {localSection.verticalAisles.map(idx => (
                    <span key={idx} className="item-badge">
                      Seat {idx}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Horizontal Aisles</label>
              <p className="form-hint">Comma-separated row indices (e.g., 15, 30)</p>
              <input
                type="text"
                value={localSection.horizontalAisles.join(', ')}
                onChange={e => handleHorizontalAislesChange(e.target.value)}
                disabled={disabled}
                className="form-input"
                placeholder="15, 30"
              />
              {localSection.horizontalAisles.length > 0 && (
                <div className="selected-items">
                  {localSection.horizontalAisles.map(idx => (
                    <span key={idx} className="item-badge">
                      Row {idx}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bowl Tab */}
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
                  <p className="bowl-status">
                    {assignedBowl.isActive ? '✓ Active' : '✗ Inactive'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4 className="validation-title">⚠️ Errors</h4>
          <ul className="validation-list">
            {validationErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validationWarnings.length > 0 && (
        <div className="validation-warnings">
          <h4 className="validation-title">ℹ️ Warnings</h4>
          <ul className="validation-list">
            {validationWarnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
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
        }

        .locked-badge {
          font-size: 0.75rem;
          background: #fef2f2;
          color: #dc2626;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
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

        .value {
          font-weight: 600;
          color: #3b82f6;
          margin-left: 0.5rem;
        }

        .form-input,
        .form-select,
        .form-range {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-family: inherit;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input:disabled,
        .form-select:disabled,
        .form-range:disabled {
          opacity: 0.5;
          background: #f9fafb;
          cursor: not-allowed;
        }

        .form-range {
          padding: 0;
          cursor: pointer;
        }

        .form-range:disabled {
          cursor: not-allowed;
        }

        .form-hint {
          margin: 0;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
        }

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

        .form-button:hover:not(:disabled) {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .form-button.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: #fff;
        }

        .form-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .color-picker-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .color-input {
          width: 50px;
          height: 40px;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          cursor: pointer;
        }

        .color-value {
          font-size: 0.875rem;
          color: #6b7280;
          font-family: monospace;
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

        .capacity-display {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 0.375rem;
        }

        .capacity-label {
          font-size: 0.875rem;
          color: #166534;
        }

        .capacity-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #16a34a;
        }

        .selected-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .item-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .bowl-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .bowl-color {
          width: 40px;
          height: 40px;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
        }

        .bowl-details {
          flex: 1;
        }

        .bowl-name {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }

        .bowl-status {
          margin: 0.25rem 0 0 0;
          font-size: 0.75rem;
          color: #6b7280;
        }

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
          margin-top: 1rem;
        }

        .delete-button:hover:not(:disabled) {
          background: #fee2e2;
          border-color: #f87171;
        }

        .delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .validation-errors,
        .validation-warnings {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 0.375rem;
          border: 1px solid #fecaca;
          background: #fef2f2;
        }

        .validation-errors {
          border-color: #fca5a5;
        }

        .validation-warnings {
          border-color: #fed7aa;
          background: #fffbeb;
        }

        .validation-title {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #dc2626;
        }

        .validation-warnings .validation-title {
          color: #b45309;
        }

        .validation-list {
          margin: 0;
          padding-left: 1.25rem;
          font-size: 0.875rem;
          color: #7f1d1d;
        }

        .validation-warnings .validation-list {
          color: #92400e;
        }

        .validation-list li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}
