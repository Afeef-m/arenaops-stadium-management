"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  LayoutBuilderState,
  FieldConfig,
  Bowl,
  LayoutSection,
  LayoutSeat,
  EditorMode,
  ViewMode,
  CapacityWarning,
  BuilderMode,
} from "../types";
import { DEFAULT_FIELD_CONFIG } from "../types";
import { generateAllSeats } from "../utils/seatGenerator";

export interface UseLayoutBuilderOptions {
  mode: BuilderMode;
  stadiumId: string;
  eventId?: string;
  templateId?: string;
}

export interface UseLayoutBuilderReturn extends LayoutBuilderState {
  // Field configuration
  setFieldConfig: (config: FieldConfig) => void;
  updateFieldConfig: (updates: Partial<FieldConfig>) => void;

  // Bowl management
  addBowl: () => void;
  updateBowl: (bowlId: string, updates: Partial<Bowl>) => void;
  deleteBowl: (bowlId: string) => void;
  reorderBowl: (bowlId: string, newOrder: number) => void;

  // Section management
  addSection: (section: LayoutSection) => void;
  updateSection: (sectionId: string, updates: Partial<LayoutSection>) => void;
  deleteSection: (sectionId: string) => void;
  assignSectionToBowl: (sectionId: string, bowlId: string | null) => void;

  // Seat generation & selection
  generateSeats: () => void;
  selectSection: (sectionId: string | null) => void;
  selectSeat: (seatId: string, multiSelect?: boolean) => void;
  selectSeats: (seatIds: Set<string>) => void;
  clearSelectedSeats: () => void;
  updateSeat: (seatId: string, updates: Partial<LayoutSeat>) => void;
  updateSeats: (seatIds: string[], updates: Partial<LayoutSeat>) => void;
  deleteSeats: (seatIds: string[]) => void;
  addSeat: (seat: LayoutSeat) => void;

  // Editor mode
  setEditorMode: (mode: EditorMode) => void;
  setViewMode: (mode: ViewMode) => void;

  // State flags
  setIsLayoutLocked: (locked: boolean) => void;
  setIsDirty: (dirty: boolean) => void;

  // Computed
  selectedSection: LayoutSection | null;
  totalCapacity: number;
  stats: {
    totalSections: number;
    activeSections: number;
    totalCapacity: number;
    averageCapacity: number;
  };
}

/**
 * Custom hook for managing stadium layout builder state
 * Centralizes all state management logic for the layout builder
 */
export function useLayoutBuilder(options: UseLayoutBuilderOptions): UseLayoutBuilderReturn {
  const { mode, stadiumId, eventId, templateId } = options;

  // ============================================================================
  // State
  // ============================================================================

  const [fieldConfig, setFieldConfig] = useState<FieldConfig>(DEFAULT_FIELD_CONFIG);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [seats, setSeats] = useState<LayoutSeat[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [editorMode, setEditorMode] = useState<EditorMode>('stadium');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [validation, setValidation] = useState<CapacityWarning[]>([]);
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;

  const totalCapacity = sections.reduce((sum, s) => sum + s.calculatedCapacity, 0);

  const stats = {
    totalSections: sections.length,
    activeSections: sections.filter(s => s.isActive).length,
    totalCapacity,
    averageCapacity: sections.length > 0 ? Math.round(totalCapacity / sections.length) : 0,
  };

  // ============================================================================
  // Field Configuration
  // ============================================================================

  const updateFieldConfig = useCallback((updates: Partial<FieldConfig>) => {
    setFieldConfig(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // ============================================================================
  // Bowl Management
  // ============================================================================

  const addBowl = useCallback(() => {
    const newBowl: Bowl = {
      id: `bowl-${Date.now()}`,
      name: `Bowl ${bowls.length + 1}`,
      color: ['#4F9CF9', '#34C759', '#FFD60A', '#AF52DE'][bowls.length % 4] || '#4F9CF9',
      sectionIds: [],
      isActive: true,
      displayOrder: bowls.length + 1,
    };
    setBowls(prev => [...prev, newBowl]);
    setIsDirty(true);
  }, [bowls.length]);

  const updateBowl = useCallback((bowlId: string, updates: Partial<Bowl>) => {
    setBowls(prev => prev.map(b => b.id === bowlId ? { ...b, ...updates } : b));
    setIsDirty(true);
  }, []);

  const deleteBowl = useCallback((bowlId: string) => {
    // Remove bowl and unassign sections
    setBowls(prev => prev.filter(b => b.id !== bowlId));
    setSections(prev => prev.map(s => s.bowlId === bowlId ? { ...s, bowlId: null } : s));
    setIsDirty(true);
  }, []);

  const reorderBowl = useCallback((bowlId: string, newOrder: number) => {
    setBowls(prev => {
      const bowlsCopy = [...prev];
      const bowlIndex = bowlsCopy.findIndex(b => b.id === bowlId);
      if (bowlIndex === -1) return prev;

      const [bowl] = bowlsCopy.splice(bowlIndex, 1);
      bowlsCopy.splice(newOrder - 1, 0, bowl!);

      // Update display orders
      return bowlsCopy.map((b, i) => ({ ...b, displayOrder: i + 1 }));
    });
    setIsDirty(true);
  }, []);

  // ============================================================================
  // Section Management
  // ============================================================================

  const addSection = useCallback((section: LayoutSection) => {
    setSections(prev => [...prev, section]);
    setIsDirty(true);
  }, []);

  const updateSection = useCallback((sectionId: string, updates: Partial<LayoutSection>) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    ));
    setIsDirty(true);
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));

    // Update bowl sectionIds
    setBowls(prev => prev.map(bowl => ({
      ...bowl,
      sectionIds: bowl.sectionIds.filter(id => id !== sectionId),
    })));

    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }

    setIsDirty(true);
  }, [selectedSectionId]);

  const assignSectionToBowl = useCallback((sectionId: string, bowlId: string | null) => {
    // Update section
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, bowlId } : s
    ));

    // Update all bowls' sectionIds
    setBowls(prev => prev.map(bowl => ({
      ...bowl,
      sectionIds: sections
        .filter(s => {
          if (s.id === sectionId) {
            return bowl.id === bowlId;
          }
          return s.bowlId === bowl.id;
        })
        .map(s => s.id),
    })));

    setIsDirty(true);
  }, [sections]);

  // ============================================================================
  // Selection & Seat Generation
  // ============================================================================

  const selectSection = useCallback((sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setSelectedSeatIds(new Set());
  }, []);

  const selectSeats = useCallback((seatIds: Set<string>) => {
    setSelectedSeatIds(seatIds);
  }, []);

  const selectSeat = useCallback((seatId: string, multiSelect: boolean = false) => {
    setSelectedSeatIds(prev => {
      const next = new Set(prev);
      if (multiSelect) {
        if (next.has(seatId)) {
          next.delete(seatId);
        } else {
          next.add(seatId);
        }
      } else {
        next.clear();
        next.add(seatId);
      }
      return next;
    });
  }, []);

  const clearSelectedSeats = useCallback(() => {
    setSelectedSeatIds(new Set());
  }, []);

  const generateSeats = useCallback(() => {
    try {
      const newSeats = generateAllSeats(sections, fieldConfig);
      setSeats(newSeats);
      setIsDirty(true);
      console.log(`Generated ${newSeats.length} seats from ${sections.length} sections`);
    } catch (error) {
      console.error('Seat generation failed:', error);
    }
  }, [sections, fieldConfig]);

  const updateSeat = useCallback((seatId: string, updates: Partial<LayoutSeat>) => {
    setSeats(prev => prev.map(s =>
      s.seatId === seatId ? { ...s, ...updates } : s
    ));
    setIsDirty(true);
  }, []);

  const updateSeats = useCallback((seatIds: string[], updates: Partial<LayoutSeat>) => {
    setSeats(prev => prev.map(s =>
      seatIds.includes(s.seatId) ? { ...s, ...updates } : s
    ));
    setIsDirty(true);
  }, []);

  const deleteSeats = useCallback((seatIds: string[]) => {
    setSeats(prev => prev.filter(s => !seatIds.includes(s.seatId)));
    setSelectedSeatIds(prev => {
      const next = new Set(prev);
      seatIds.forEach(id => next.delete(id));
      return next;
    });
    setIsDirty(true);
  }, []);

  const addSeat = useCallback((seat: LayoutSeat) => {
    setSeats(prev => [...prev, seat]);
    setIsDirty(true);
  }, []);

  // ============================================================================
  // Auto-save to localStorage (draft)
  // ============================================================================

  useEffect(() => {
    if (!isDirty) return;

    const draftKey = `stadium-layout-draft-${stadiumId}-${mode}`;
    const timeout = setTimeout(() => {
      const draft = {
        fieldConfig,
        bowls,
        sections,
        timestamp: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      console.log('[Auto-save] Draft saved to localStorage');
    }, 5000); // Auto-save every 5 seconds after changes

    return () => clearInterval(timeout);
  }, [mode, stadiumId, fieldConfig, bowls, sections, isDirty]);

  // ============================================================================
  // Load draft on mount (if exists)
  // ============================================================================

  useEffect(() => {
    const draftKey = `stadium-layout-draft-${stadiumId}-${mode}`;
    const draftJson = localStorage.getItem(draftKey);

    if (draftJson && !templateId) {
      try {
        const draft = JSON.parse(draftJson);
        const ageMinutes = (Date.now() - draft.timestamp) / 1000 / 60;

        if (ageMinutes < 60 * 24) { // Draft < 24 hours old
          const shouldRestore = confirm(
            `Found unsaved draft from ${Math.round(ageMinutes)} minutes ago. Restore?`
          );

          if (shouldRestore) {
            setFieldConfig(draft.fieldConfig);
            setBowls(draft.bowls);
            setSections(draft.sections);
            setIsDirty(true);
            console.log('[Auto-save] Draft restored');
          }
        }
      } catch (error) {
        console.error('[Auto-save] Failed to load draft:', error);
      }
    }
  }, [stadiumId, mode, templateId]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    mode,
    stadiumId,
    eventId,
    fieldConfig,
    bowls,
    sections,
    seats,
    selectedSectionId,
    selectedSeatIds,
    editorMode,
    viewMode,
    validation,
    isLayoutLocked,
    isDirty,

    // Field
    setFieldConfig,
    updateFieldConfig,

    // Bowls
    addBowl,
    updateBowl,
    deleteBowl,
    reorderBowl,

    // Sections
    addSection,
    updateSection,
    deleteSection,
    assignSectionToBowl,

    // Seats
    generateSeats,
    selectSeat,
    clearSelectedSeats,
    updateSeat,
    updateSeats,
    deleteSeats,
    addSeat,

    // Selection
    selectSection,
    selectSeats,

    // Mode
    setEditorMode,
    setViewMode,

    // Flags
    setIsLayoutLocked,
    setIsDirty,

    // Computed
    selectedSection,
    totalCapacity,
    stats,
  };
}
