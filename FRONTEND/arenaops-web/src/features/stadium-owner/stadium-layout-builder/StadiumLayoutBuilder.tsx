"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLayoutBuilder } from "./hooks/useLayoutBuilder";
import { LayoutCanvas } from "./LayoutCanvas";
import { FieldConfigPanel } from "./FieldConfigPanel";
import { SectionCreationModal } from "./SectionCreationModal";
import { SectionPropertiesPanel } from "./SectionPropertiesPanel";
import type { BuilderMode } from "./types";

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
  // State Management (via hook)
  // ============================================================================

  const {
    fieldConfig,
    updateFieldConfig,
    bowls,
    addBowl,
    updateBowl,
    deleteBowl,
    sections,
    addSection,
    updateSection,
    deleteSection,
    selectedSectionId,
    selectSection,
    editorMode,
    setEditorMode,
    viewMode,
    setViewMode,
    isLayoutLocked,
    setIsLayoutLocked,
    isDirty,
    stats,
  } = useLayoutBuilder({ mode, stadiumId, eventId, templateId });

  // ============================================================================
  // Local State
  // ============================================================================

  const [saving, setSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleFieldConfigChange = (newConfig) => {
    updateFieldConfig(newConfig);
  };

  const handleSectionSelect = (sectionId: string | null) => {
    selectSection(sectionId);
  };

  const handleSectionDoubleClick = (sectionId: string) => {
    selectSection(sectionId);
    setEditorMode('section-detail');
  };

  const handleCreateSection = (newSection) => {
    addSection(newSection);
    setIsCreateModalOpen(false);
  };

  const handleSectionDelete = (sectionId: string) => {
    deleteSection(sectionId);
  };

  const handleSaveTemplate = async () => {
    // TODO: Implement save logic in Phase 9
    console.log('Save template:', { fieldConfig, bowls, sections });
    setSaving(true);
    // API calls will go here
    setTimeout(() => {
      setSaving(false);
      alert('Template saved successfully!');
    }, 1000);
  };

  const handleLockLayout = async () => {
    if (!confirm('Locking the layout will prevent further changes. Continue?')) {
      return;
    }
    // TODO: API call to lock layout
    setIsLayoutLocked(true);
  };

  const handleGenerateSeats = async () => {
    if (!isLayoutLocked) {
      alert('Please lock the layout before generating seats.');
      return;
    }
    // TODO: API call to generate seats
    alert('Seats generated successfully!');
    router.push(`/manager/events/${eventId}`);
  };

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
        {/* Left Sidebar: Bowl Manager & Section Creator */}
        <div className="left-sidebar">
          <h3>Sections & Bowls</h3>
          <button
            className="create-section-button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!canEdit}
          >
            + Create Section
          </button>

          <h4 className="secondary-heading">Bowls</h4>
          <button
            className="add-button"
            onClick={addBowl}
            disabled={!canEdit}
          >
            + Add Bowl
          </button>

          <div className="bowl-list">
            {bowls.map(bowl => (
              <div key={bowl.id} className="bowl-item">
                <div
                  className="bowl-color"
                  style={{ backgroundColor: bowl.color }}
                />
                <span className="bowl-name">{bowl.name} ({bowl.sectionIds.length})</span>
                <button
                  className="delete-button"
                  onClick={() => deleteBowl(bowl.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="canvas-container">
          <LayoutCanvas
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fieldConfig={fieldConfig}
            bowls={bowls}
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSectionSelect={handleSectionSelect}
            onSectionDoubleClick={handleSectionDoubleClick}
            viewMode={viewMode}
            showBowlZones={true}
            showGrid={true}
          />
        </div>

        {/* Right Sidebar: Properties */}
        <div className="right-sidebar">
          {!selectedSection ? (
            <>
              <div className="sidebar-tabs">
                <button
                  className="tab-button active"
                >
                  Field
                </button>
              </div>
              <FieldConfigPanel
                fieldConfig={fieldConfig}
                onChange={handleFieldConfigChange}
                disabled={!canEdit || isEventMode}
              />
            </>
          ) : (
            <SectionPropertiesPanel
              section={selectedSection}
              bowls={bowls}
              fieldConfig={fieldConfig}
              onChange={updateSection}
              onDelete={handleSectionDelete}
              disabled={!canEdit}
            />
          )}
        </div>
      </div>

      {/* Bottom Bar: Stats and Validation */}
      <div className="bottom-bar">
        <div className="stats">
          <span>Sections: {stats.totalSections}</span>
          <span>Capacity: {stats.totalCapacity.toLocaleString()}</span>
          <span>Avg/Section: {stats.averageCapacity}</span>
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

      {/* Modals */}
      <SectionCreationModal
        isOpen={isCreateModalOpen}
        fieldConfig={fieldConfig}
        stadiumId={stadiumId}
        onCreate={handleCreateSection}
        onCancel={() => setIsCreateModalOpen(false)}
      />

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
          padding: 0;
        }

        .sidebar-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
        }

        .tab-button {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-bottom: 2px solid transparent;
          background: #f9fafb;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tab-button:hover {
          background: #f3f4f6;
        }

        .tab-button.active {
          background: #fff;
          border-bottom-color: #3b82f6;
          color: #3b82f6;
        }

        .section-details {
          padding: 1.5rem;
        }

        .section-details h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
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

        .create-section-button,
        .add-button {
          width: 100%;
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: #fff;
          color: #3b82f6;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
          transition: all 0.15s;
        }

        .create-section-button:hover:not(:disabled),
        .add-button:hover:not(:disabled) {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .create-section-button:disabled,
        .add-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          color: #6b7280;
        }

        .secondary-heading {
          margin: 1.5rem 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
        }

        .bowl-name {
          flex: 1;
          font-size: 0.875rem;
        }

        .bowl-item .delete-button {
          padding: 0.25rem 0.5rem;
          border: 1px solid #fca5a5;
          background: transparent;
          color: #dc2626;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.15s;
        }

        .bowl-item .delete-button:hover {
          background: #fef2f2;
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
