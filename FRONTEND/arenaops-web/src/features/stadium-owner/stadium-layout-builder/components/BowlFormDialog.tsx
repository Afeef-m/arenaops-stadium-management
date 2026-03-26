/**
 * Bowl Form Dialog
 *
 * Creates or edits a bowl with its configuration
 * Supports automatic radius stacking (new bowl starts where previous ends)
 * Dynamic spacing calculation based on section count
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { FieldConfig, Bowl, LayoutSection } from '../types';
import { calculateMinimumInnerRadius } from '../utils/geometry';

export interface BowlFormData {
  name: string;
  numSections: number;
  seatsPerSection: number;
  rowsPerSection: number;
  innerRadius?: number;  // Optional override
  outerRadius?: number;  // Optional override
}

export interface BowlFormDialogProps {
  isOpen: boolean;
  fieldConfig: FieldConfig;
  existingBowls: Bowl[];
  existingSections: LayoutSection[];
  editingBowl?: Bowl;  // If provided, we're editing
  onSave: (data: BowlFormData) => void;
  onCancel: () => void;
}

export function BowlFormDialog({
  isOpen,
  fieldConfig,
  existingBowls,
  existingSections,
  editingBowl,
  onSave,
  onCancel,
}: BowlFormDialogProps) {
  const isEditMode = !!editingBowl;

  // Calculate auto radius based on existing bowls
  const autoRadius = useMemo(() => {
    const minInner = calculateMinimumInnerRadius(fieldConfig);

    if (existingBowls.length === 0) {
      // First bowl - start from field edge
      return {
        inner: minInner + 20,  // 20px buffer from field
        outer: minInner + 100, // 80px bowl height
      };
    }

    // Find the outermost radius of existing sections
    let maxOuterRadius = minInner;
    existingSections.forEach(section => {
      if (section.shape === 'arc' && section.outerRadius > maxOuterRadius) {
        maxOuterRadius = section.outerRadius;
      }
    });

    return {
      inner: maxOuterRadius + 10,  // 10px gap between bowls
      outer: maxOuterRadius + 90,  // 80px bowl height
    };
  }, [fieldConfig, existingBowls, existingSections]);

  // Form state
  const [name, setName] = useState('');
  const [numSections, setNumSections] = useState(8);
  const [seatsPerSection, setSeatsPerSection] = useState(200);
  const [rowsPerSection, setRowsPerSection] = useState(5);
  const [useCustomRadius, setUseCustomRadius] = useState(false);
  const [innerRadius, setInnerRadius] = useState(autoRadius.inner);
  const [outerRadius, setOuterRadius] = useState(autoRadius.outer);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingBowl) {
        // Load existing bowl data
        setName(editingBowl.name);

        // Get sections for this bowl to extract config
        const bowlSections = existingSections.filter(s => s.bowlId === editingBowl.id);
        if (bowlSections.length > 0) {
          setNumSections(bowlSections.length);
          setSeatsPerSection(bowlSections[0].calculatedCapacity || 200);
          setRowsPerSection(bowlSections[0].rows || 5);
          setInnerRadius(bowlSections[0].innerRadius || autoRadius.inner);
          setOuterRadius(bowlSections[0].outerRadius || autoRadius.outer);
        }
      } else {
        // New bowl - use defaults with auto-increment name
        setName(`Bowl ${existingBowls.length + 1}`);
        setNumSections(8);
        setSeatsPerSection(200);
        setRowsPerSection(5);
        setUseCustomRadius(false);
        setInnerRadius(autoRadius.inner);
        setOuterRadius(autoRadius.outer);
      }
    }
  }, [isOpen, isEditMode, editingBowl, existingBowls.length, existingSections, autoRadius]);

  // Calculate capacity
  const capacity = numSections * seatsPerSection;

  // Calculate dynamic spacing info
  const spacingInfo = useMemo(() => {
    const totalAngle = 360;
    const anglePerSection = totalAngle / numSections;

    // Dynamic gap: smaller gap for more sections
    // Base gap of 5° at 8 sections, scales down to 2° at 16+ sections
    const gapAngle = Math.max(2, Math.min(5, 40 / numSections));
    const sectionAngle = anglePerSection - gapAngle;

    return {
      anglePerSection: anglePerSection.toFixed(1),
      gapAngle: gapAngle.toFixed(1),
      sectionAngle: sectionAngle.toFixed(1),
    };
  }, [numSections]);

  // Validation
  const isValid =
    name.trim().length > 0 &&
    numSections >= 2 &&
    seatsPerSection >= 10 &&
    rowsPerSection >= 1 &&
    (!useCustomRadius || (innerRadius > 0 && outerRadius > innerRadius));

  const handleSave = () => {
    if (!isValid) return;

    onSave({
      name: name.trim(),
      numSections,
      seatsPerSection,
      rowsPerSection,
      innerRadius: useCustomRadius ? innerRadius : autoRadius.inner,
      outerRadius: useCustomRadius ? outerRadius : autoRadius.outer,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bowl-form-overlay" onClick={onCancel}>
      <div className="bowl-form-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">
            {isEditMode ? `Edit Bowl: ${editingBowl?.name}` : 'Add New Bowl'}
          </h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="dialog-content">
          {/* Bowl Name */}
          <div className="form-group">
            <label className="form-label">Bowl Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Lower Bowl, Upper Tier"
              className="form-input"
            />
          </div>

          {/* Number of Sections */}
          <div className="form-group">
            <label className="form-label">
              Number of Sections
              <span className="label-value">{numSections}</span>
            </label>
            <div className="input-row">
              <input
                type="range"
                min={2}
                max={36}
                value={numSections}
                onChange={e => setNumSections(Number(e.target.value))}
                className="slider"
              />
              <input
                type="number"
                min={2}
                max={100}
                value={numSections}
                onChange={e => setNumSections(Math.max(2, Number(e.target.value)))}
                className="number-input"
              />
            </div>
            <div className="spacing-info">
              Each section: {spacingInfo.sectionAngle}° span, {spacingInfo.gapAngle}° gap
            </div>
          </div>

          {/* Seats per Section */}
          <div className="form-group">
            <label className="form-label">
              Seats per Section
              <span className="label-value">{seatsPerSection}</span>
            </label>
            <div className="input-row">
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={seatsPerSection}
                onChange={e => setSeatsPerSection(Number(e.target.value))}
                className="slider"
              />
              <input
                type="number"
                min={10}
                max={5000}
                value={seatsPerSection}
                onChange={e => setSeatsPerSection(Math.max(10, Number(e.target.value)))}
                className="number-input"
              />
            </div>
          </div>

          {/* Rows per Section */}
          <div className="form-group">
            <label className="form-label">
              Rows per Section
              <span className="label-value">{rowsPerSection}</span>
            </label>
            <div className="input-row">
              <input
                type="range"
                min={1}
                max={50}
                value={rowsPerSection}
                onChange={e => setRowsPerSection(Number(e.target.value))}
                className="slider"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={rowsPerSection}
                onChange={e => setRowsPerSection(Math.max(1, Number(e.target.value)))}
                className="number-input"
              />
            </div>
          </div>

          {/* Capacity Preview */}
          <div className="capacity-preview">
            <div className="capacity-main">
              <span className="capacity-label">Bowl Capacity</span>
              <span className="capacity-value">{capacity.toLocaleString()} seats</span>
            </div>
            <div className="capacity-breakdown">
              {numSections} sections × {seatsPerSection} seats = {capacity.toLocaleString()}
            </div>
          </div>

          {/* Custom Radius Toggle */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useCustomRadius}
                onChange={e => setUseCustomRadius(e.target.checked)}
              />
              <span>Custom radius (advanced)</span>
            </label>
          </div>

          {/* Custom Radius Inputs */}
          {useCustomRadius && (
            <div className="radius-inputs">
              <div className="form-group half">
                <label className="form-label">Inner Radius (px)</label>
                <input
                  type="number"
                  min={50}
                  max={500}
                  value={innerRadius}
                  onChange={e => setInnerRadius(Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div className="form-group half">
                <label className="form-label">Outer Radius (px)</label>
                <input
                  type="number"
                  min={innerRadius + 20}
                  max={600}
                  value={outerRadius}
                  onChange={e => setOuterRadius(Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Auto Radius Info */}
          {!useCustomRadius && (
            <div className="auto-radius-info">
              <p>📍 Auto-calculated radius: {autoRadius.inner}px → {autoRadius.outer}px</p>
              {existingBowls.length > 0 && (
                <p className="stack-info">This bowl will stack outside existing bowls</p>
              )}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={!isValid}
          >
            {isEditMode ? 'Save Changes' : 'Create Bowl'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .bowl-form-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }

        .bowl-form-dialog {
          background: #fff;
          border-radius: 0.75rem;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .dialog-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
        }

        .close-btn:hover {
          color: #1f2937;
        }

        .dialog-content {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group.half {
          flex: 1;
        }

        .form-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .label-value {
          font-size: 1rem;
          font-weight: 700;
          color: #3b82f6;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.9375rem;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-row {
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
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .number-input {
          width: 80px;
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

        .spacing-info {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .capacity-preview {
          padding: 1rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .capacity-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .capacity-label {
          font-size: 0.875rem;
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

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
        }

        .checkbox-label input {
          width: 16px;
          height: 16px;
        }

        .radius-inputs {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .auto-radius-info {
          padding: 0.75rem;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          color: #92400e;
        }

        .auto-radius-info p {
          margin: 0 0 0.25rem 0;
        }

        .auto-radius-info p:last-child {
          margin-bottom: 0;
        }

        .stack-info {
          opacity: 0.8;
        }

        .dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .btn-cancel,
        .btn-save {
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 0.9375rem;
        }

        .btn-cancel {
          background: #fff;
          border: 1px solid #d1d5db;
          color: #6b7280;
        }

        .btn-cancel:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-save {
          background: #3b82f6;
          border: none;
          color: #fff;
        }

        .btn-save:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }

        .btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
