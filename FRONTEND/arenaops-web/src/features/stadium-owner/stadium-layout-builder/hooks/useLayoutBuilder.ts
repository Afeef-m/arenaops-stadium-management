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
import { coreService } from "../../../services/coreService";

export interface UseLayoutBuilderOptions {
  mode: BuilderMode;
  stadiumId: string;
  eventId?: string;
  templateId?: string;
}

export interface UseLayoutBuilderReturn extends LayoutBuilderState {
  // Field configuration
  setFieldConfig: (config: FieldConfig) => void;
  updateFieldConfig: (updates: Partial<FieldConfig>) => Promise<void>;

  // Bowl management
  addBowl: (bowlData?: Partial<Bowl>) => Promise<string>;
  updateBowl: (bowlId: string, updates: Partial<Bowl>) => Promise<void>;
  deleteBowl: (bowlId: string) => Promise<void>;
  reorderBowl: (bowlId: string, newOrder: number) => Promise<void>;

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
  isLoadingFromApi: boolean;
  seatingPlanId: string | null;

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
  const [isLoadingFromApi, setIsLoadingFromApi] = useState(true);
  const [seatingPlanId, setSeatingPlanId] = useState<string | null>(null);

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

  const updateFieldConfig = useCallback(async (updates: Partial<FieldConfig>) => {
    if (!seatingPlanId) {
      console.error('Cannot update field config: seatingPlanId not set');
      return;
    }

    try {
      const updatedConfig = { ...fieldConfig, ...updates };

      // Call API to update field config
      const response = await coreService.updateFieldConfig(seatingPlanId, {
        shape: updatedConfig.shape,
        length: updatedConfig.length,
        width: updatedConfig.width,
        unit: updatedConfig.unit,
        bufferZone: updatedConfig.bufferZone,
      });

      if (response.success && response.data) {
        // Update local state with the minimum radius calculated by backend
        setFieldConfig(prev => ({
          ...prev,
          ...updates,
          minimumInnerRadius: response.data.minimumInnerRadius,
        }));
        setIsDirty(true);
      } else {
        console.error('Failed to update field config:', response.error?.message);
      }
    } catch (error) {
      console.error('Error updating field config:', error);
    }
  }, [fieldConfig, seatingPlanId]);

  // ============================================================================
  // Bowl Management
  // ============================================================================

  const addBowl = useCallback(async (bowlData?: Partial<Bowl>) => {
    if (!seatingPlanId) {
      console.error('Cannot add bowl: seatingPlanId not set');
      return '';
    }

    try {
      const newBowlData = {
        name: bowlData?.name || `Bowl ${bowls.length + 1}`,
        color: bowlData?.color || (['#4F9CF9', '#34C759', '#FFD60A', '#AF52DE'][bowls.length % 4] || '#4F9CF9'),
        displayOrder: bowlData?.displayOrder || (bowls.length + 1),
      };

      // Call API to create bowl
      const response = await coreService.createBowl(seatingPlanId, newBowlData);

      if (response.success && response.data) {
        // Map API response to local Bowl interface
        const createdBowl: Bowl = {
          id: response.data.bowlId,
          name: response.data.name,
          color: response.data.color,
          sectionIds: response.data.sectionIds || [],
          isActive: response.data.isActive,
          displayOrder: response.data.displayOrder,
        };

        setBowls(prev => [...prev, createdBowl]);
        setIsDirty(true);
        return createdBowl.id;
      } else {
        console.error('Failed to create bowl:', response.error?.message);
        return '';
      }
    } catch (error) {
      console.error('Error creating bowl:', error);
      return '';
    }
  }, [bowls.length, seatingPlanId]);

  const updateBowl = useCallback(async (bowlId: string, updates: Partial<Bowl>) => {
    try {
      // Call API to update bowl
      const response = await coreService.updateBowl(bowlId, {
        name: updates.name,
        color: updates.color,
        displayOrder: updates.displayOrder,
      });

      if (response.success) {
        setBowls(prev => prev.map(b => b.id === bowlId ? { ...b, ...updates } : b));
        setIsDirty(true);
      } else {
        console.error('Failed to update bowl:', response.error?.message);
      }
    } catch (error) {
      console.error('Error updating bowl:', error);
    }
  }, []);

  const deleteBowl = useCallback(async (bowlId: string) => {
    try {
      // Call API to delete bowl
      const response = await coreService.deleteBowl(bowlId);

      if (response.success) {
        // First, identify which sections will be unassigned
        setSections(prev => {
          const deletedSectionIds = prev.filter(s => s.bowlId === bowlId).map(s => s.id);

          // Delete those seats as well
          setSeats(prevSeats => prevSeats.filter(seat => !deletedSectionIds.includes(seat.sectionId)));

          // Return filtered sections with bowlId set to null
          return prev.map(s => s.bowlId === bowlId ? { ...s, bowlId: null } : s);
        });

        // Remove the bowl itself
        setBowls(prev => prev.filter(b => b.id !== bowlId));
        setIsDirty(true);
      } else {
        console.error('Failed to delete bowl:', response.error?.message);
      }
    } catch (error) {
      console.error('Error deleting bowl:', error);
    }
  }, []);

  const reorderBowl = useCallback(async (bowlId: string, newOrder: number) => {
    try {
      // Call API to reorder bowl
      const response = await coreService.reorderBowl(bowlId, newOrder);

      if (response.success) {
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
      } else {
        console.error('Failed to reorder bowl:', response.error?.message);
      }
    } catch (error) {
      console.error('Error reordering bowl:', error);
    }
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
      // Add stadiumId to all generated seats
      const seatsWithStadiumId = newSeats.map(seat => ({
        ...seat,
        stadiumId,
      }));
      setSeats(seatsWithStadiumId);
      setIsDirty(true);
      console.log(`Generated ${seatsWithStadiumId.length} seats from ${sections.length} sections`);
    } catch (error) {
      console.error('Seat generation failed:', error);
    }
  }, [sections, fieldConfig, stadiumId]);

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
  // Load field config and bowls from API
  // ============================================================================

  useEffect(() => {
    const loadLayoutData = async () => {
      // In template mode (stadium owner), we need to get the seating plan ID
      // For now, we'll use the stadiumId and assume there's a default seating plan
      // In a real implementation, this would be passed as a prop or fetched

      try {
        // Try to get seating plans for this stadium
        const seatingPlansResponse = await coreService.getSeatingPlans(stadiumId);

        if (seatingPlansResponse.success && seatingPlansResponse.data?.length > 0) {
          const defaultSeatingPlan = seatingPlansResponse.data[0];
          setSeatingPlanId(defaultSeatingPlan.seatingPlanId);

          // Load field config
          const fieldConfigResponse = await coreService.getFieldConfig(defaultSeatingPlan.seatingPlanId);
          if (fieldConfigResponse.success && fieldConfigResponse.data) {
            setFieldConfig({
              shape: fieldConfigResponse.data.shape,
              length: fieldConfigResponse.data.length,
              width: fieldConfigResponse.data.width,
              unit: fieldConfigResponse.data.unit,
              bufferZone: fieldConfigResponse.data.bufferZone,
              minimumInnerRadius: fieldConfigResponse.data.minimumInnerRadius,
            });
          }

          // Load bowls
          const bowlsResponse = await coreService.getBowls(defaultSeatingPlan.seatingPlanId);
          if (bowlsResponse.success && bowlsResponse.data?.length > 0) {
            const loadedBowls: Bowl[] = bowlsResponse.data.map((bowl: any) => ({
              id: bowl.bowlId,
              name: bowl.name,
              color: bowl.color,
              sectionIds: bowl.sectionIds || [],
              isActive: bowl.isActive,
              displayOrder: bowl.displayOrder,
            }));
            setBowls(loadedBowls);
          }
        }
      } catch (error) {
        console.error('Failed to load layout data from API:', error);
        // Fall back to draft or defaults
      } finally {
        setIsLoadingFromApi(false);
      }
    };

    // Only load from API if we're not already loaded
    if (isLoadingFromApi && stadiumId && mode === 'template') {
      loadLayoutData();
    }
  }, [stadiumId, mode, isLoadingFromApi]);

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
    isLoadingFromApi,
    seatingPlanId,

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
