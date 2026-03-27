"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLayoutBuilder } from "./hooks/useLayoutBuilder";
import { LayoutCanvas } from "./LayoutCanvas";
import { FieldConfigPanel } from "./FieldConfigPanel";
import { SectionCreationModal } from "./SectionCreationModal";
import { SectionPropertiesPanel } from "./SectionPropertiesPanel";
import { SeatDetailsPanel } from "./SeatDetailsPanel";
import { SelectionStats } from "./components/SelectionStats";
import { LayoutConfigurationPanel } from "./components/LayoutConfigurationPanel";
import { BowlFormDialog, type BowlFormData } from "./components/BowlFormDialog";
import { getRangeSelection } from "./utils/selectionAlgorithms";
import { calculateMinimumInnerRadius } from "./utils/geometry";
import type { BuilderMode, FieldConfig, LayoutSection, Bowl } from "./types";

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
    selectedSection,
    selectSection,
    seats,
    selectedSeatIds,
    generateSeats,
    selectSeat,
    selectSeats,
    clearSelectedSeats,
    updateSeat,
    updateSeats,
    deleteSeats,
    addSeat,
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
  const [lastSelectedSeatId, setLastSelectedSeatId] = useState<string | null>(null);  // For Ctrl+click range selection
  const [editingBowlId, setEditingBowlId] = useState<string | null>(null);  // For editing bowl inline
  const [selectedBowlId, setSelectedBowlId] = useState<string | undefined>(undefined);  // For bowl-specific configuration
  const [showBowlFormDialog, setShowBowlFormDialog] = useState(false);  // For bowl creation/editing dialog
  const [editingBowlData, setEditingBowlData] = useState<Bowl | undefined>(undefined);  // Which bowl to edit (undefined = create new)
  const [showFieldConfigModal, setShowFieldConfigModal] = useState(false);  // Field config as modal

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleFieldConfigChange = (newConfig: Partial<FieldConfig>) => {
    updateFieldConfig(newConfig);
  };

  // Helper: Convert HSL to Hex color
  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Handler: Open bowl form dialog for creating a new bowl
  const handleOpenNewBowlForm = useCallback(() => {
    setEditingBowlData(undefined);
    setShowBowlFormDialog(true);
  }, []);

  // Handler: Open bowl form dialog for editing an existing bowl
  const handleOpenEditBowlForm = useCallback((bowl: Bowl) => {
    setEditingBowlData(bowl);
    setShowBowlFormDialog(true);
  }, []);

  // Handler: Save bowl from form dialog (create or edit)
  const handleBowlFormSave = useCallback((data: BowlFormData) => {
    try {
      const minInnerRadius = calculateMinimumInnerRadius(fieldConfig);

      // Calculate actual radius values
      let innerRadius = data.innerRadius;
      let outerRadius = data.outerRadius;

      // If no custom radius provided, calculate auto radius
      if (!innerRadius || !outerRadius) {
        if (editingBowlData) {
          // Editing: keep existing radius from sections
          const bowlSections = sections.filter(s => s.bowlId === editingBowlData.id);
          if (bowlSections.length > 0 && bowlSections[0].shape === 'arc') {
            innerRadius = innerRadius || bowlSections[0].innerRadius;
            outerRadius = outerRadius || bowlSections[0].outerRadius;
          }
        } else {
          // Creating: auto-stack on top of existing bowls
          let maxOuterRadius = minInnerRadius;
          sections.forEach(section => {
            if (section.shape === 'arc' && section.outerRadius > maxOuterRadius) {
              maxOuterRadius = section.outerRadius;
            }
          });

          if (maxOuterRadius > minInnerRadius) {
            // Stack after existing bowls
            innerRadius = innerRadius || maxOuterRadius + 10;
            outerRadius = outerRadius || maxOuterRadius + 90;
          } else {
            // First bowl
            innerRadius = innerRadius || minInnerRadius + 20;
            outerRadius = outerRadius || minInnerRadius + 100;
          }
        }
      }

      // Generate sections for this bowl
      const newSections: LayoutSection[] = [];
      const totalAngle = 360;
      const anglePerSection = totalAngle / data.numSections;

      // Dynamic gap: smaller gap for more sections
      const gapAngle = Math.max(2, Math.min(5, 40 / data.numSections));
      const sectionSpan = anglePerSection - gapAngle;

      // Generate bowl ID
      const bowlId = editingBowlData?.id || `bowl-${Date.now()}`;

      // Directional names for sections
      const getDirectionalName = (centerAngle: number): string => {
        const normalized = ((centerAngle % 360) + 360) % 360;
        if (normalized >= 337.5 || normalized < 22.5) return 'N';
        if (normalized >= 22.5 && normalized < 67.5) return 'NE';
        if (normalized >= 67.5 && normalized < 112.5) return 'E';
        if (normalized >= 112.5 && normalized < 157.5) return 'SE';
        if (normalized >= 157.5 && normalized < 202.5) return 'S';
        if (normalized >= 202.5 && normalized < 247.5) return 'SW';
        if (normalized >= 247.5 && normalized < 292.5) return 'W';
        return 'NW';
      };

      for (let i = 0; i < data.numSections; i++) {
        const startAngle = i * anglePerSection + (gapAngle / 2);
        const endAngle = startAngle + sectionSpan;
        const centerAngle = (startAngle + endAngle) / 2;

        const sectionId = `section-${bowlId}-${i}-${Date.now()}`;
        const dirName = getDirectionalName(centerAngle);

        const newSection: LayoutSection = {
          id: sectionId,
          name: `${data.name} ${dirName}`,
          shape: 'arc',
          centerX: 700, // Canvas center
          centerY: 450,
          innerRadius: innerRadius!,
          outerRadius: outerRadius!,
          startAngle,
          endAngle,
          rows: data.rowsPerSection,
          seatsPerRow: Math.ceil(data.seatsPerSection / data.rowsPerSection),
          calculatedCapacity: data.seatsPerSection,
          color: hslToHex((i * 360) / data.numSections, 60, 70),
          bowlId,
          // Required fields with defaults
          width: 0,
          height: 0,
          rotation: 0,
          seatType: 'standard',
          verticalAisles: [],
          horizontalAisles: [],
          isActive: true,
          isLocked: false,
        };

        newSections.push(newSection);
      }

      if (editingBowlData) {
        // Editing existing bowl: delete old sections, add new ones
        const oldSectionIds = editingBowlData.sectionIds;
        oldSectionIds.forEach(sectionId => {
          deleteSection(sectionId);
        });

        // Add new sections
        newSections.forEach(section => {
          addSection(section);
        });

        // Update bowl
        updateBowl(editingBowlData.id, {
          name: data.name,
          sectionIds: newSections.map(s => s.id),
        });

        console.log(`✏️ Updated bowl "${data.name}" with ${data.numSections} sections`);
      } else {
        // Creating new bowl
        // Add sections first
        newSections.forEach(section => {
          addSection(section);
        });

        // Add bowl with all data at once
        addBowl({
          name: data.name,
          sectionIds: newSections.map(s => s.id),
        });

        console.log(`✨ Created bowl "${data.name}" with ${data.numSections} sections (radius: ${innerRadius} → ${outerRadius})`);
      }

      // Generate seats for all sections
      generateSeats();

      // Close dialog
      setShowBowlFormDialog(false);
      setEditingBowlData(undefined);

    } catch (error) {
      console.error('[Bowl Form Save] Error:', error);
      alert(`Failed to save bowl: ${(error as Error).message}`);
    }
  }, [fieldConfig, sections, bowls, editingBowlData, stadiumId, addSection, addBowl, updateBowl, deleteSection, generateSeats]);

  const handleSectionSelect = (sectionId: string | null) => {
    selectSection(sectionId);
  };

  const handleSectionDoubleClick = (sectionId: string) => {
    selectSection(sectionId);
    setViewMode('section-focus');  // Enter focused section view
  };

  const handleExitSectionFocus = () => {
    setViewMode('seats');  // Return to normal seats view
  };

  const handleCreateSection = (newSection: LayoutSection) => {
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
    try {
      generateSeats();
      setViewMode('seats'); // Auto-switch to seats view
      alert(`Generated ${seats.length} seats!`);
    } catch (error) {
      alert('Seat generation failed: ' + (error as Error).message);
    }
  };

  const handleSeatClick = (seatId: string, shiftKey: boolean, ctrlKey?: boolean) => {
    const clickedSeat = seats.find(s => s.seatId === seatId);

    if (ctrlKey && clickedSeat && lastSelectedSeatId) {
      // Ctrl+click: attempt range selection
      const lastSeat = seats.find(s => s.seatId === lastSelectedSeatId);

      if (lastSeat && clickedSeat.sectionId === lastSeat.sectionId) {
        // Same section: do range selection
        const rangeSeatIds = getRangeSelection(lastSelectedSeatId, seatId, sections.find(s => s.id === clickedSeat.sectionId)!, seats);
        selectSeats(rangeSeatIds);
        setLastSelectedSeatId(seatId);
        return;
      }
    }

    // Normal click or different section Ctrl+click
    selectSeat(seatId, shiftKey);
    setLastSelectedSeatId(seatId);
  };

  const handleSeatsSelect = (seatIds: Set<string>) => {
    selectSeats(seatIds);
  };

  const handleSelectAllInRow = useCallback(
    (rowLabel: string) => {
      const rowSeatIds = seats
        .filter(s => s.rowLabel === rowLabel)
        .map(s => s.seatId);
      if (rowSeatIds.length > 0) {
        selectSeats(new Set(rowSeatIds));
      }
    },
    [seats, selectSeats]
  );

  const handleSelectAllInSection = useCallback(
    (sectionId: string) => {
      const sectionSeatIds = seats
        .filter(s => s.sectionId === sectionId)
        .map(s => s.seatId);
      if (sectionSeatIds.length > 0) {
        selectSeats(new Set(sectionSeatIds));
      }
    },
    [seats, selectSeats]
  );

  const handleClearSelection = useCallback(() => {
    clearSelectedSeats();
  }, [clearSelectedSeats]);

  const handleDeleteSeats = useCallback((seatIds: string[]) => {
    deleteSeats(seatIds);
  }, [deleteSeats]);

  const handleAddSeat = useCallback((seat: typeof seats[0]) => {
    addSeat(seat);
  }, [addSeat]);

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
          <h3>Stadium Layout</h3>

          {/* Field Settings Button */}
          <button
            className="field-settings-button"
            onClick={() => setShowFieldConfigModal(true)}
            disabled={!canEdit || isEventMode}
          >
            ⚙️ Field Settings
          </button>

          <div className="field-info">
            <span className="field-info-label">Field:</span>
            <span className="field-info-value">
              {fieldConfig.shape === 'round' ? 'Round' : 'Rectangle'} ({fieldConfig.shape === 'round' ? `${fieldConfig.length}${fieldConfig.unit} dia` : `${fieldConfig.length}×${fieldConfig.width}${fieldConfig.unit}`})
            </span>
          </div>

          <h4 className="secondary-heading">Sections</h4>
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
            onClick={handleOpenNewBowlForm}
            disabled={!canEdit}
          >
            + Add Bowl
          </button>

          <div className="bowl-list">
            {bowls.map(bowl => {
              const isSelected = selectedBowlId === bowl.id;
              const sectionCount = bowl.sectionIds.length;
              const bowlCapacity = sections
                .filter(s => bowl.sectionIds.includes(s.id))
                .reduce((sum, s) => sum + s.calculatedCapacity, 0);

              return (
                <div
                  key={bowl.id}
                  className={`bowl-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedBowlId(isSelected ? undefined : bowl.id)}
                >
                  <div
                    className="bowl-color"
                    style={{ backgroundColor: bowl.color }}
                  />
                  <div className="bowl-info">
                    <span className="bowl-name">{bowl.name}</span>
                    <span className="bowl-stats">
                      {sectionCount} sections • {bowlCapacity.toLocaleString()} seats
                    </span>
                  </div>

                  {/* Action buttons - shown when selected or on hover */}
                  <div className={`bowl-actions ${isSelected ? 'visible' : ''}`}>
                    <button
                      className="edit-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditBowlForm(bowl);
                      }}
                      disabled={!canEdit}
                      title="Edit bowl configuration"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${bowl.name}" and all its ${sectionCount} sections?`)) {
                          deleteBowl(bowl.id);
                          if (isSelected) setSelectedBowlId(undefined);
                        }
                      }}
                      disabled={!canEdit}
                      title="Delete bowl"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}

            {bowls.length === 0 && (
              <div className="empty-bowls">
                <p>No bowls yet. Click "+ Add Bowl" to create one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="canvas-container">
          {/* Section Focus Mode Header */}
          {viewMode === 'section-focus' && selectedSection && (
            <div className="section-focus-header">
              <span className="section-focus-title">
                Editing: {selectedSection.name}
              </span>
              <button
                className="exit-focus-button"
                onClick={handleExitSectionFocus}
              >
                ← Back to Stadium View
              </button>
            </div>
          )}

          <LayoutCanvas
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fieldConfig={fieldConfig}
            bowls={bowls}
            sections={sections}
            seats={seats}
            selectedSectionId={selectedSectionId}
            selectedSeatIds={selectedSeatIds}
            onSectionSelect={handleSectionSelect}
            onSectionDoubleClick={handleSectionDoubleClick}
            onSeatClick={handleSeatClick}
            onSeatsSelect={handleSeatsSelect}
            viewMode={viewMode}
            showBowlZones={true}
            showGrid={true}
          />
        </div>

        {/* Right Sidebar: Properties */}
        <div className="right-sidebar">
          {selectedSeatIds.size > 0 ? (
            <SeatDetailsPanel
              selectedSeats={Array.from(selectedSeatIds)
                .map(seatId => seats.find(s => s.seatId === seatId))
                .filter((s): s is typeof seats[0] => s !== undefined)}
              onUpdate={updateSeat}
              onBulkUpdate={updateSeats}
              onDelete={handleDeleteSeats}
              onAddSeat={addSeat}
              onSelectAllInRow={handleSelectAllInRow}
              onSelectAllInSection={handleSelectAllInSection}
              onClearSelection={handleClearSelection}
              disabled={!canEdit || (viewMode !== 'seats' && viewMode !== 'section-focus')}
            />
          ) : !selectedSection ? (
            sections.length > 0 ? (
              // Show Layout Configuration Panel after generation
              <LayoutConfigurationPanel
                fieldConfig={fieldConfig}
                bowls={bowls}
                sections={sections}
                selectedBowlId={selectedBowlId}
                onBowlSelect={setSelectedBowlId}
                disabled={!canEdit}
              />
            ) : (
              // Show Field Config Panel before generation
              <>
                <div className="sidebar-tabs">
                  <button
                    className="tab-button active"
                  >
                    Field Configuration
                  </button>
                </div>
                <FieldConfigPanel
                  fieldConfig={fieldConfig}
                  onChange={handleFieldConfigChange}
                  disabled={!canEdit || isEventMode}
                />
              </>
            )
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
        {selectedSeatIds.size > 0 ? (
          <SelectionStats
            selectedSeats={Array.from(selectedSeatIds)
              .map(seatId => seats.find(s => s.seatId === seatId))
              .filter((s): s is typeof seats[0] => s !== undefined)}
            totalSeats={seats.length}
          />
        ) : (
          <div className="stats">
            <span>Sections: {stats.totalSections}</span>
            <span>Capacity: {stats.totalCapacity.toLocaleString()}</span>
            <span>Avg/Section: {stats.averageCapacity}</span>
          </div>
        )}
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

      {/* Bowl Form Dialog - for creating/editing bowls */}
      <BowlFormDialog
        isOpen={showBowlFormDialog}
        fieldConfig={fieldConfig}
        existingBowls={bowls}
        existingSections={sections}
        editingBowl={editingBowlData}
        onSave={handleBowlFormSave}
        onCancel={() => {
          setShowBowlFormDialog(false);
          setEditingBowlData(undefined);
        }}
      />

      {/* Field Config Modal */}
      {showFieldConfigModal && (
        <div className="field-config-modal-overlay" onClick={() => setShowFieldConfigModal(false)}>
          <div className="field-config-modal" onClick={e => e.stopPropagation()}>
            <div className="field-config-modal-header">
              <h2>Field Settings</h2>
              <button className="close-modal-btn" onClick={() => setShowFieldConfigModal(false)}>✕</button>
            </div>
            <FieldConfigPanel
              fieldConfig={fieldConfig}
              onChange={handleFieldConfigChange}
              disabled={!canEdit || isEventMode}
            />
            <div className="field-config-modal-footer">
              <button className="btn-done" onClick={() => setShowFieldConfigModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
          gap: 0.75rem;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          background: #fff;
          cursor: pointer;
          transition: all 0.15s;
        }

        .bowl-item:hover {
          border-color: #93c5fd;
          background: #f8fafc;
        }

        .bowl-item.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .bowl-color {
          width: 24px;
          height: 24px;
          border-radius: 0.375rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .bowl-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .bowl-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bowl-stats {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .bowl-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .bowl-item:hover .bowl-actions,
        .bowl-actions.visible {
          opacity: 1;
        }

        .bowl-actions .edit-button,
        .bowl-actions .delete-button {
          padding: 0.375rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          background: transparent;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.15s;
          line-height: 1;
        }

        .bowl-actions .edit-button:hover:not(:disabled) {
          background: #dbeafe;
          border-color: #93c5fd;
        }

        .bowl-actions .delete-button:hover:not(:disabled) {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .bowl-actions button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .empty-bowls {
          padding: 1.5rem 1rem;
          text-align: center;
          color: #9ca3af;
          font-size: 0.8125rem;
          background: #f9fafb;
          border: 1px dashed #d1d5db;
          border-radius: 0.375rem;
        }

        .empty-bowls p {
          margin: 0;
        }

        .bowl-edit-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }

        .bowl-name-input {
          flex: 1;
          padding: 0.25rem 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }

        .bowl-color-picker {
          width: 32px;
          height: 32px;
          padding: 0;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
        }

        .save-button {
          padding: 0.25rem 0.5rem;
          border: 1px solid #10b981;
          border-radius: 0.25rem;
          background: #10b981;
          color: #fff;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .create-section-button,
        .add-button {
          width: 100%;
          padding: 0.5rem 1rem;
          border: 1px solid #3b82f6;
          border-radius: 0.375rem;
          background: #3b82f6;
          color: #fff;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
          transition: all 0.15s;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .create-section-button:hover:not(:disabled),
        .add-button:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
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

        .bowl-color {
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

        .section-focus-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95), rgba(30, 41, 59, 0.85));
          color: #fff;
          z-index: 10;
          backdrop-filter: blur(4px);
        }

        .section-focus-title {
          font-size: 1rem;
          font-weight: 600;
        }

        .exit-focus-button {
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 0.375rem;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.15s;
        }

        .exit-focus-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
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

        .field-settings-button {
          width: 100%;
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: #fff;
          color: #374151;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
          transition: all 0.15s;
        }

        .field-settings-button:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .field-settings-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .field-info {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #f3f4f6;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          margin-bottom: 1rem;
        }

        .field-info-label {
          color: #6b7280;
          font-weight: 500;
        }

        .field-info-value {
          color: #1f2937;
          font-weight: 600;
        }

        .field-config-modal-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }

        .field-config-modal {
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

        .field-config-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .field-config-modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .close-modal-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
        }

        .close-modal-btn:hover {
          color: #1f2937;
        }

        .field-config-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .btn-done {
          padding: 0.625rem 1.5rem;
          border: none;
          border-radius: 0.375rem;
          background: #3b82f6;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9375rem;
          transition: all 0.15s;
        }

        .btn-done:hover {
          background: #2563eb;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }
      `}</style>
    </div>
  );
}
