/**
 * Generation Parameters Dialog
 *
 * Allows users to customize stadium layout parameters before auto-generation
 * Lets users select: number of sections, seats per section, rows per section
 * Shows real-time capacity estimate and validates against constraints
 */

import React, { useState, useEffect } from 'react';
import type { FieldConfig } from '../types';
import { validateLayoutForField } from '../utils/layoutGenerator';

export interface GenerationParams {
  numSections: 4 | 6 | 8 | 12 | 16;
  seatsPerSection: 100 | 150 | 200 | 250 | 300;
  rowsPerSection: 3 | 4 | 5 | 6 | 8;
}

export interface GenerationParametersDialogProps {
  isOpen: boolean;
  fieldConfig: FieldConfig;
  defaultParams?: GenerationParams;
  onGenerate: (params: GenerationParams) => void;
  onQuickGenerate: () => void;
  onCancel: () => void;
  isEditMode?: boolean;
}

const DEFAULT_PARAMS: GenerationParams = {
  numSections: 8,
  seatsPerSection: 200,
  rowsPerSection: 5,
};

export function GenerationParametersDialog({
  isOpen,
  fieldConfig,
  defaultParams = DEFAULT_PARAMS,
  onGenerate,
  onQuickGenerate,
  onCancel,
  isEditMode = false,
}: GenerationParametersDialogProps) {
  const [params, setParams] = useState<GenerationParams>(defaultParams);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setParams(defaultParams);
      setError(null);
    }
  }, [isOpen, defaultParams]);

  // Calculate capacity and validate on parameter change
  const capacity = params.numSections * params.seatsPerSection;
  const validation = validateLayoutForField(fieldConfig, params.numSections, params.rowsPerSection);

  const isValid = validation.valid && capacity >= 1600 && capacity <= 50000;

  const handleParamChange = (key: keyof GenerationParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleGenerate = () => {
    if (!isValid) {
      setError(validation.error || 'Invalid configuration');
      return;
    }
    onGenerate(params);
  };

  if (!isOpen) return null;

  return (
    <div className="generation-dialog-overlay">
      <div className="generation-dialog">
        <h2 className="dialog-title">
          {isEditMode ? 'Edit Layout Configuration' : 'Customize Stadium Layout'}
        </h2>

        {/* Number of Sections */}
        <div className="dialog-section">
          <label className="section-label">Number of Sections</label>
          <div className="button-group">
            {[4, 6, 8, 12, 16].map(num => (
              <button
                key={num}
                className={`param-button ${params.numSections === num ? 'active' : ''}`}
                onClick={() => handleParamChange('numSections', num as 4 | 6 | 8 | 12 | 16)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Seats per Section */}
        <div className="dialog-section">
          <label className="section-label">Seats per Section</label>
          <div className="button-group">
            {[100, 150, 200, 250, 300].map(seats => (
              <button
                key={seats}
                className={`param-button ${params.seatsPerSection === seats ? 'active' : ''}`}
                onClick={() => handleParamChange('seatsPerSection', seats as 100 | 150 | 200 | 250 | 300)}
              >
                {seats}
              </button>
            ))}
          </div>
        </div>

        {/* Rows per Section */}
        <div className="dialog-section">
          <label className="section-label">Rows per Section</label>
          <div className="button-group">
            {[3, 4, 5, 6, 8].map(rows => (
              <button
                key={rows}
                className={`param-button ${params.rowsPerSection === rows ? 'active' : ''}`}
                onClick={() => handleParamChange('rowsPerSection', rows as 3 | 4 | 5 | 6 | 8)}
              >
                {rows}
              </button>
            ))}
          </div>
        </div>

        {/* Capacity Estimate */}
        <div className="capacity-estimate">
          <div className="estimate-label">Total Capacity</div>
          <div className="estimate-value">{capacity.toLocaleString()} seats</div>
          <div className="estimate-breakdown">
            {params.numSections} sections × {params.seatsPerSection} seats × {params.rowsPerSection} rows
          </div>
        </div>

        {/* Validation Error */}
        {error && (
          <div className="validation-error">
            ⚠️ {error}
          </div>
        )}

        {/* Capacity Range Warning */}
        {isValid && (capacity < 2000 || capacity > 40000) && (
          <div className="validation-warning">
            💡 Capacity is {capacity < 2000 ? 'below 2000' : 'above 40000'} - consider adjusting parameters
          </div>
        )}

        {/* Action Buttons */}
        <div className="dialog-actions">
          {!isEditMode && (
            <button
              className="btn-default"
              onClick={onQuickGenerate}
            >
              Quick Generate (8/200/5)
            </button>
          )}
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={!isValid}
          >
            {isEditMode ? 'Regenerate' : 'Custom Generate'}
          </button>
          <button
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        .generation-dialog-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }

        .generation-dialog {
          background: #fff;
          border-radius: 0.5rem;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-height: 80vh;
          overflow-y: auto;
        }

        .dialog-title {
          margin: 0 0 2rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .dialog-section {
          margin-bottom: 2rem;
        }

        .section-label {
          display: block;
          margin-bottom: 0.75rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #374151;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .param-button {
          padding: 0.5rem 1rem;
          border: 2px solid #d1d5db;
          border-radius: 0.375rem;
          background: #fff;
          color: #374151;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          min-width: 50px;
          text-align: center;
        }

        .param-button:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .param-button.active {
          background: #3b82f6;
          color: #fff;
          border-color: #3b82f6;
        }

        .param-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .capacity-estimate {
          padding: 1.5rem;
          background: #f3f4f6;
          border-radius: 0.375rem;
          margin: 2rem 0;
          text-align: center;
        }

        .estimate-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .estimate-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 0.5rem;
        }

        .estimate-breakdown {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .validation-error {
          padding: 0.75rem 1rem;
          background: #fee2e2;
          border-left: 4px solid #dc2626;
          border-radius: 0.375rem;
          color: #991b1b;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .validation-warning {
          padding: 0.75rem 1rem;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 0.375rem;
          color: #92400e;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .dialog-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary,
        .btn-default,
        .btn-secondary {
          padding: 0.625rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          font-size: 0.9375rem;
        }

        .btn-primary {
          background: #3b82f6;
          color: #fff;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-default {
          background: #fff;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-default:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-secondary {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
