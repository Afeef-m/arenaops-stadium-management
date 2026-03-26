"use client";

import React, { useState } from "react";
import { validateSectionGeometry, createArcPath, createRectanglePath } from "./utils/geometry";
import type { LayoutSection, FieldConfig, SectionCreateRequest } from "./types";

export interface SectionCreationModalProps {
  isOpen: boolean;
  fieldConfig: FieldConfig;
  stadiumId: string;
  onCreate: (section: LayoutSection) => void;
  onCancel: () => void;
}

/**
 * Section Creation Modal
 *
 * Dialog for creating new seating sections with initial configuration.
 * Provides form for geometry, seating parameters, and real-time preview.
 */
export function SectionCreationModal({
  isOpen,
  fieldConfig,
  stadiumId,
  onCreate,
  onCancel,
}: SectionCreationModalProps) {
  const [form, setForm] = useState<SectionCreateRequest>({
    name: '',
    shape: 'arc',
    centerX: 700,
    centerY: 450,
    innerRadius: 100,
    outerRadius: 180,
    startAngle: 0,
    endAngle: 90,
    width: 200,
    height: 150,
    rotation: 0,
    rows: 30,
    seatsPerRow: 25,
    seatType: 'standard',
    color: '#3b82f6',
    isActive: true,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleFieldChange = <K extends keyof SectionCreateRequest>(
    field: K,
    value: SectionCreateRequest[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleShapeChange = (shape: 'arc' | 'rectangle') => {
    setForm(prev => ({ ...prev, shape }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!form.name || !form.name.trim()) {
      setErrors(['Section name is required']);
      return;
    }

    // Validate geometry
    const validation = validateSectionGeometry(form, fieldConfig, 1400, 900);
    if (!validation.valid) {
      setErrors(validation.errors);
      setWarnings(validation.warnings);
      return;
    }

    // Create section object
    const newSection: LayoutSection = {
      id: `section-${Date.now()}`,
      name: form.name,
      bowlId: form.bowlId || null,
      shape: form.shape,
      centerX: form.centerX,
      centerY: form.centerY,
      innerRadius: form.innerRadius || 100,
      outerRadius: form.outerRadius || 180,
      startAngle: form.startAngle || 0,
      endAngle: form.endAngle || 90,
      width: form.width || 200,
      height: form.height || 150,
      rotation: form.rotation || 0,
      rows: form.rows,
      seatsPerRow: form.seatsPerRow,
      calculatedCapacity: form.rows * form.seatsPerRow,
      seatType: form.seatType,
      verticalAisles: [],
      horizontalAisles: [],
      isActive: form.isActive ?? true,
      isLocked: false,
      color: form.color,
    };

    /// Call parent handler
    onCreate(newSection);

    // Reset form
    setForm({
      name: '',
      shape: 'arc',
      centerX: 700,
      centerY: 450,
      innerRadius: 100,
      outerRadius: 180,
      startAngle: 0,
      endAngle: 90,
      width: 200,
      height: 150,
      rotation: 0,
      rows: 30,
      seatsPerRow: 25,
      seatType: 'standard',
      color: '#3b82f6',
      isActive: true,
    });
    setErrors([]);
    setWarnings([]);
  };

  const handleCancel = () => {
    setForm({
      name: '',
      shape: 'arc',
      centerX: 700,
      centerY: 450,
      innerRadius: 100,
      outerRadius: 180,
      startAngle: 0,
      endAngle: 90,
      width: 200,
      height: 150,
      rotation: 0,
      rows: 30,
      seatsPerRow: 25,
      seatType: 'standard',
      color: '#3b82f6',
      isActive: true,
    });
    setErrors([]);
    setWarnings([]);
    onCancel();
  };

  // ============================================================================
  // Render Preview
  // ============================================================================

  const renderGeometryPreview = () => {
    const previewPath = form.shape === 'arc'
      ? createArcPath(
          form.centerX,
          form.centerY,
          form.innerRadius || 100,
          form.outerRadius || 180,
          form.startAngle || 0,
          form.endAngle || 90
        )
      : createRectanglePath(
          form.centerX,
          form.centerY,
          form.width || 200,
          form.height || 150,
          form.rotation || 0
        );

    return (
      <svg width="100%" height="200" viewBox="0 0 1400 900" className="geometry-preview">
        {/* Field background*/}
        {fieldConfig.shape === 'round' ? (
          <circle
            cx="700"
            cy="450"
            r={(fieldConfig.length * (fieldConfig.unit === 'yards' ? 2.5 : 3.0)) / 2}
            fill="#dcfce7"
            stroke="#16a34a"
            strokeWidth="2"
            opacity="0.3"
          />
        ) : (
          <rect
            x={700 - (fieldConfig.length * (fieldConfig.unit === 'yards' ? 2.5 : 3.0)) / 2}
            y={450 - (fieldConfig.width * (fieldConfig.unit === 'yards' ? 2.5 : 3.0)) / 2}
            width={fieldConfig.length * (fieldConfig.unit === 'yards' ? 2.5 : 3.0)}
            height={fieldConfig.width * (fieldConfig.unit === 'yards' ? 2.5 : 3.0)}
            fill="#dcfce7"
            stroke="#16a34a"
            strokeWidth="2"
            opacity="0.3"
          />
        )}

        {/* Minimum radius circle */}
        <circle
          cx="700"
          cy="450"
          r={fieldConfig.minimumInnerRadius}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1"
          strokeDasharray="5,5"
          opacity="0.5"
        />

        {/* Section geometry */}
        <path
          d={previewPath}
          fill={form.color}
          fillOpacity="0.6"
          stroke="#111827"
          strokeWidth="2"
        />

        {/* Center point */}
        <circle
          cx={form.centerX}
          cy={form.centerY}
          r="4"
          fill="#3b82f6"
        />
      </svg>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Create New Section</h2>
          <button
            type="button"
            className="modal-close"
            onClick={handleCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="modal-content">
          {/* Basic Properties */}
          <div className="form-section">
            <h3 className="section-title">Basic Properties</h3>

            <div className="form-group">
              <label className="form-label">Section Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className="form-input"
                placeholder="e.g., Section 101"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shape</label>
              <div className="button-group">
                <button
                  type="button"
                  className={`form-button ${form.shape === 'arc' ? 'active' : ''}`}
                  onClick={() => handleShapeChange('arc')}
                >
                  Arc (Curved)
                </button>
                <button
                  type="button"
                  className={`form-button ${form.shape === 'rectangle' ? 'active' : ''}`}
                  onClick={() => handleShapeChange('rectangle')}
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
                  value={form.color}
                  onChange={e => handleFieldChange('color', e.target.value)}
                  className="color-input"
                />
                <span className="color-value">{form.color}</span>
              </div>
            </div>
          </div>

          {/* Geometry Configuration */}
          <div className="form-section">
            <h3 className="section-title">
              {form.shape === 'arc' ? 'Arc Configuration' : 'Rectangle Configuration'}
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Center X</label>
                <input
                  type="number"
                  value={form.centerX}
                  onChange={e => handleFieldChange('centerX', parseFloat(e.target.value))}
                  min="0"
                  max="1400"
                  step="10"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Center Y</label>
                <input
                  type="number"
                  value={form.centerY}
                  onChange={e => handleFieldChange('centerY', parseFloat(e.target.value))}
                  min="0"
                  max="900"
                  step="10"
                  className="form-input"
                />
              </div>
            </div>

            {form.shape === 'arc' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Inner Radius: <span className="value">{form.innerRadius}px</span>
                    </label>
                    <input
                      type="range"
                      value={form.innerRadius || 100}
                      onChange={e => handleFieldChange('innerRadius', parseFloat(e.target.value))}
                      min="0"
                      max="400"
                      step="5"
                      className="form-range"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Outer Radius: <span className="value">{form.outerRadius}px</span>
                    </label>
                    <input
                      type="range"
                      value={form.outerRadius || 180}
                      onChange={e => handleFieldChange('outerRadius', parseFloat(e.target.value))}
                      min="0"
                      max="500"
                      step="5"
                      className="form-range"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Angle (°)</label>
                    <input
                      type="number"
                      value={form.startAngle || 0}
                      onChange={e => handleFieldChange('startAngle', parseFloat(e.target.value))}
                      min="0"
                      max="360"
                      step="15"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Angle (°)</label>
                    <input
                      type="number"
                      value={form.endAngle || 90}
                      onChange={e => handleFieldChange('endAngle', parseFloat(e.target.value))}
                      min="0"
                      max="360"
                      step="15"
                      className="form-input"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Width: <span className="value">{form.width}px</span>
                    </label>
                    <input
                      type="range"
                      value={form.width || 200}
                      onChange={e => handleFieldChange('width', parseFloat(e.target.value))}
                      min="50"
                      max="600"
                      step="10"
                      className="form-range"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Height: <span className="value">{form.height}px</span>
                    </label>
                    <input
                      type="range"
                      value={form.height || 150}
                      onChange={e => handleFieldChange('height', parseFloat(e.target.value))}
                      min="50"
                      max="600"
                      step="10"
                      className="form-range"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Rotation: <span className="value">{form.rotation}°</span>
                  </label>
                  <input
                    type="range"
                    value={form.rotation || 0}
                    onChange={e => handleFieldChange('rotation', parseFloat(e.target.value))}
                    min="0"
                    max="360"
                    step="15"
                    className="form-range"
                  />
                </div>
              </>
            )}
          </div>

          {/* Seating Configuration */}
          <div className="form-section">
            <h3 className="section-title">Seating Configuration</h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Rows</label>
                <input
                  type="number"
                  value={form.rows}
                  onChange={e => handleFieldChange('rows', parseInt(e.target.value))}
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
                  value={form.seatsPerRow}
                  onChange={e => handleFieldChange('seatsPerRow', parseInt(e.target.value))}
                  min="1"
                  max="100"
                  step="1"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Seat Type</label>
                <select
                  value={form.seatType}
                  onChange={e => handleFieldChange('seatType', e.target.value as any)}
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
                <span className="capacity-label">Capacity:</span>
                <span className="capacity-value">
                  {(form.rows * form.seatsPerRow).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Geometry Preview */}
          <div className="form-section">
            <h3 className="section-title">Preview</h3>
            {renderGeometryPreview()}
            <p className="preview-hint">
              Green area = field, Yellow dashed circle = minimum radius constraint, Blue dot = center
            </p>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="validation-errors">
              <h4 className="validation-title">⚠️ Errors</h4>
              <ul className="validation-list">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="validation-warnings">
              <h4 className="validation-title">ℹ️ Warnings</h4>
              <ul className="validation-list">
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Buttons */}
          <div className="modal-buttons">
            <button
              type="button"
              className="button-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-submit"
              disabled={errors.length > 0}
            >
              Create Section
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-container {
          background: #fff;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: #fff;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .modal-close:hover {
          background: #f3f4f6;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          margin: 0 0 1rem 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #374151;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
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

        .form-range {
          padding: 0;
          cursor: pointer;
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

        .form-button:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .form-button.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: #fff;
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

        .capacity-display {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 0.375rem;
        }

        .capacity-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #166534;
        }

        .capacity-value {
          font-size: 1rem;
          font-weight: 600;
          color: #16a34a;
        }

        .geometry-preview {
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background: #f9fafb;
          margin-bottom: 0.5rem;
        }

        .preview-hint {
          margin: 0;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .validation-errors,
        .validation-warnings {
          padding: 1rem;
          border-radius: 0.375rem;
          border: 1px solid #fecaca;
          background: #fef2f2;
          margin-bottom: 1rem;
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

        .modal-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .button-cancel,
        .button-submit {
          padding: 0.5rem 1.25rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .button-cancel {
          background: #fff;
          color: #374151;
        }

        .button-cancel:hover {
          background: #f3f4f6;
        }

        .button-submit {
          background: #3b82f6;
          color: #fff;
          border-color: #3b82f6;
        }

        .button-submit:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
        }

        .button-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
