"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  LayoutBuilderState,
  BuilderMode,
  FieldConfig,
  Bowl,
  LayoutSection,
  EditorMode,
  ViewMode,
  DEFAULT_FIELD_CONFIG,
} from "./types";

// Components will be imported as we create them
// import { LayoutCanvas } from "./LayoutCanvas";
// import { FieldConfigPanel } from "./FieldConfigPanel";
// import { BowlManagerSidebar } from "./BowlManagerSidebar";
// import { SectionPropertiesPanel } from "./SectionPropertiesPanel";
// import { CapacityValidation } from "./CapacityValidation";

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;

export interface StadiumLayoutBuilderProps {
  mode: BuilderMode;
  stadiumId: string;
  eventId?: string;
  templateId?: string;  // Load existing template
}

/**
 * Stadium Layout Builder - Main Orchestrator Component
 *
 * This component manages the overall state and layout for the stadium layout builder.
 * It supports two modes:
 * - 'template': Stadium owners create reusable layout templates
 * - 'event': Event managers clone and customize layouts for specific events
 */
export function StadiumLayoutBuilder({
  mode,
  stadiumId,
  eventId,
  templateId,
}: StadiumLayoutBuilderProps) {
  const router = useRouter();

  // ============================================================================
  // State Management
  // ============================================================================

  const [fieldConfig, setFieldConfig] = useState<FieldConfig>(DEFAULT_FIELD_CONFIG);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [editorMode, setEditorMode] = useState<EditorMode>('stadium');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;

  const totalCapacity = sections.reduce((sum, section) => sum + section.calculatedCapacity, 0);

  const stats = {
    totalSections: sections.length,
    totalCapacity,
    averageCapacityPerSection: sections.length > 0 ? Math.round(totalCapacity / sections.length) : 0,
    activeSections: sections.filter(s => s.isActive).length,
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleFieldConfigChange = useCallback((newConfig: FieldConfig) => {
    setFieldConfig(newConfig);
    setIsDirty(true);
  }, []);

  const handleBowlCreate = useCallback(() => {
    const newBowl: Bowl = {
      id: `bowl-${Date.now()}`,
      name: `Bowl ${bowls.length + 1}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      sectionIds: [],
      isActive: true,
      displayOrder: bowls.length + 1,
    };
    setBowls(prev => [...prev, newBowl]);
    setIsDirty(true);
  }, [bowls.length]);

  const handleBowlUpdate = useCallback((bowlId: string, updates: Partial<Bowl>) => {
    setBowls(prev => prev.map(b => b.id === bowlId ? { ...b, ...updates } : b));
    setIsDirty(true);
  }, []);

  const handleBowlDelete = useCallback((bowlId: string) => {
    // Remove bowl and unassign sections
    setBowls(prev => prev.filter(b => b.id !== bowlId));
    setSections(prev => prev.map(s => s.bowlId === bowlId ? { ...s, bowlId: null } : s));
    setIsDirty(true);
  }, []);

  const handleSectionAssignToBowl = useCallback((sectionId: string, bowlId: string | null) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, bowlId } : s
    ));

    // Update bowl's sectionIds
    setBowls(prev => prev.map(bowl => ({
      ...bowl,
      sectionIds: sections
        .filter(s => s.bowlId === bowl.id || (s.id === sectionId && bowl.id === bowlId))
        .map(s => s.id),
    })));

    setIsDirty(true);
  }, [sections]);

  const handleSectionSelect = useCallback((sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setSelectedSeatIds(new Set());
  }, []);

  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<LayoutSection>) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    ));
    setIsDirty(true);
  }, []);

  const handleSectionDelete = useCallback((sectionId: string) => {
    if (!confirm(`Delete ${sections.find(s => s.id === sectionId)?.name}?`)) {
      return;
    }
    setSections(prev => prev.filter(s => s.id !== sectionId));
    setSelectedSectionId(null);
    setIsDirty(true);
  }, [sections]);

  const handleSectionDoubleClick = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId);
    setEditorMode('section-detail');
  }, []);

  const handleExitDetailMode = useCallback(() => {
    setEditorMode('stadium');
    setSelectedSeatIds(new Set());
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    // TODO: Implement save logic in Phase 9
    console.log('Save template:', { fieldConfig, bowls, sections });
    setSaving(true);
    // API calls will go here
    setTimeout(() => {
      setSaving(false);
      setIsDirty(false);
      alert('Template saved successfully!');
    }, 1000);
  }, [fieldConfig, bowls, sections]);

  const handleLockLayout = useCallback(async () => {
    if (!confirm('Locking the layout will prevent further changes. Continue?')) {
      return;
    }
    // TODO: API call to lock layout
    setIsLayoutLocked(true);
  }, []);

  const handleGenerateSeats = useCallback(async () => {
    if (!isLayoutLocked) {
      alert('Please lock the layout before generating seats.');
      return;
    }
    // TODO: API call to generate seats
    alert('Seats generated successfully!');
    router.push(`/manager/events/${eventId}`);
  }, [isLayoutLocked, eventId, router]);

  // ============================================================================
  // Render
  // ============================================================================

  const isEventMode = mode === 'event';
  const canEdit = !isLayoutLocked;

  return (
    <div className="stadium-layout-builder">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="breadcrumbs">
          <span>{isEventMode ? 'Event Layout' : 'Stadium Template'}</span>
        </div>
        <div className="actions">
          {isDirty && <span className="unsaved-indicator">Unsaved changes</span>}

          {!isEventMode && (
            <button onClick={handleSaveTemplate} disabled={saving}>
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          )}

          {isEventMode && !isLayoutLocked && (
            <button onClick={handleLockLayout}>Lock Layout</button>
          )}

          {isEventMode && isLayoutLocked && (
            <button onClick={handleGenerateSeats}>Generate Seats</button>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="layout-grid">
        {/* Left Sidebar: Bowl Manager */}
        <div className="left-sidebar">
          <h3>Bowls</h3>
          <button onClick={handleBowlCreate} disabled={!canEdit}>+ Add Bowl</button>
          {/* BowlManagerSidebar will render here */}
          <div className="bowl-list">
            {bowls.map(bowl => (
              <div key={bowl.id} className="bowl-item">
                <div
                  className="bowl-color"
                  style={{ backgroundColor: bowl.color }}
                />
                <span>{bowl.name} ({bowl.sectionIds.length})</span>
                <button onClick={() => handleBowlDelete(bowl.id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="canvas-container">
          {/* LayoutCanvas will render here */}
          <div className="placeholder-canvas">
            <div className="placeholder-field">FIELD</div>
            <div className="placeholder-info">
              Canvas placeholder - LayoutCanvas component will render here
              <br />
              Field: {fieldConfig.shape} ({fieldConfig.length} x {fieldConfig.width} {fieldConfig.unit})
              <br />
              Sections: {sections.length}
              <br />
              Capacity: {totalCapacity.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Section Properties */}
        <div className="right-sidebar">
          <h3>Section Properties</h3>
          {selectedSection ? (
            <div className="section-details">
              <p><strong>Name:</strong> {selectedSection.name}</p>
              <p><strong>Shape:</strong> {selectedSection.shape}</p>
              <p><strong>Rows:</strong> {selectedSection.rows}</p>
              <p><strong>Seats/Row:</strong> {selectedSection.seatsPerRow}</p>
              <p><strong>Capacity:</strong> {selectedSection.calculatedCapacity}</p>
              <button onClick={() => handleSectionDelete(selectedSection.id)}>
                Delete Section
              </button>
            </div>
          ) : (
            <p>Select a section to edit properties</p>
          )}
        </div>
      </div>

      {/* Bottom Bar: Stats and Validation */}
      <div className="bottom-bar">
        <div className="stats">
          <span>Sections: {stats.totalSections}</span>
          <span>Capacity: {stats.totalCapacity.toLocaleString()}</span>
          <span>Avg/Section: {stats.averageCapacityPerSection}</span>
        </div>
        <div className="view-controls">
          <button
            onClick={() => setViewMode('overview')}
            className={viewMode === 'overview' ? 'active' : ''}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('rows')}
            className={viewMode === 'rows' ? 'active' : ''}
          >
            Rows
          </button>
          <button
            onClick={() => setViewMode('seats')}
            className={viewMode === 'seats' ? 'active' : ''}
          >
            Seats
          </button>
        </div>
      </div>

      <style jsx>{`
        .stadium-layout-builder {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
        }

        .breadcrumbs {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .unsaved-indicator {
          color: #f59e0b;
          font-size: 0.875rem;
        }

        button {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: #fff;
          cursor: pointer;
          font-size: 0.875rem;
        }

        button:hover:not(:disabled) {
          background: #f3f4f6;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .layout-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 280px 1fr 320px;
          gap: 0;
          overflow: hidden;
        }

        .left-sidebar,
        .right-sidebar {
          padding: 1.5rem;
          border-right: 1px solid #e5e7eb;
          overflow-y: auto;
          background: #f9fafb;
        }

        .right-sidebar {
          border-right: none;
          border-left: 1px solid #e5e7eb;
        }

        .left-sidebar h3,
        .right-sidebar h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .bowl-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .bowl-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background: #fff;
        }

        .bowl-color {
          width: 20px;
          height: 20px;
          border-radius: 0.25rem;
          border: 1px solid #d1d5db;
        }

        .canvas-container {
          position: relative;
          background: #ffffff;
          overflow: hidden;
        }

        .placeholder-canvas {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6b7280;
        }

        .placeholder-field {
          width: 200px;
          height: 150px;
          border: 2px dashed #9ca3af;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 2rem;
        }

        .placeholder-info {
          text-align: center;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .section-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .section-details p {
          margin: 0;
          font-size: 0.875rem;
        }

        .bottom-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-top: 1px solid #e5e7eb;
          background: #fff;
        }

        .stats {
          display: flex;
          gap: 2rem;
          font-size: 0.875rem;
        }

        .view-controls {
          display: flex;
          gap: 0.5rem;
        }

        .view-controls button.active {
          background: #3b82f6;
          color: #fff;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
