"use client";

import { useState, useCallback, useEffect } from "react";
import { coreService } from "@/services/coreService";
import type {
  LayoutBuilderState,
  FieldConfig,
  Bowl,
  LayoutSection,
  LayoutSeat,
  EditorMode,
  ViewMode,
  BuilderMode,
} from "../types";
import { DEFAULT_FIELD_CONFIG } from "../types";
import { calculateMinimumInnerRadius } from "../utils/geometry";

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
  addBowl: (bowlData?: Partial<Bowl>) => string;
  updateBowl: (bowlId: string, updates: Partial<Bowl>) => void;
  deleteBowl: (bowlId: string) => void;
  reorderBowl: (bowlId: string, newOrder: number) => void;

  // Section management
  addSection: (section: LayoutSection) => void;
  updateSection: (sectionId: string, updates: Partial<LayoutSection>) => void;
  updateSectionGeometry: (sectionId: string, updates: Partial<LayoutSection>) => void;
  deleteSection: (sectionId: string) => void;
  assignSectionToBowl: (sectionId: string, bowlId: string | null) => void;

  // Seat generation & selection
  setSeats: React.Dispatch<React.SetStateAction<LayoutSeat[]>>;
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
  refreshLayout: () => void;

  // Resolved Plan ID
  planId: string;

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

  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [planId, setPlanId] = useState<string>(templateId || "");

  // Fetch or create the initial seating plan
  useEffect(() => {
    if (templateId) {
      setPlanId(templateId);
      return;
    }
    
    if (stadiumId) {
      coreService.getSeatingPlans(stadiumId)
        .then(res => {
          if (res.success && res.data && res.data.length > 0) {
            setPlanId(res.data[0].seatingPlanId);
          } else {
            // First time: Create default plan
            coreService.createSeatingPlan(stadiumId, { name: "Default Layout" })
              .then(createRes => {
                if (createRes.success && createRes.data) {
                  setPlanId(createRes.data.seatingPlanId);
                }
              })
              .catch(err => console.error("Failed to create default seating plan", err));
          }
        })
        .catch(err => console.error("Failed to fetch seating plans", err));
    }
  }, [stadiumId, templateId]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshLayout = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  // Fetch bowls, field config, and sections once we have the planId
  useEffect(() => {
    if (!planId) return;

    coreService.getFieldConfig(planId).then(res => {
        if (res.success && res.data) {
            const baseConfig = {
                shape: res.data.shape?.toLowerCase() === 'round' ? 'round' : 'rectangle',
                length: res.data.length || 105,
                width: res.data.width || 68,
                unit: res.data.unit || 'm',
                bufferZone: res.data.bufferZone || 5
            } as FieldConfig;
            
            setFieldConfig({
                ...baseConfig,
                minimumInnerRadius: calculateMinimumInnerRadius(baseConfig)
            });
        }
    }).catch(console.error);

    Promise.all([
      coreService.getBowls(planId).catch(e => { console.error(e); return { success: false, data: [] }; }),
      coreService.getSections(planId).catch(e => { console.error(e); return { success: false, data: [] }; })
    ]).then(([bowlsRes, sectionsRes]) => {
      let fetchedSections: LayoutSection[] = [];
      
      if (sectionsRes.success && sectionsRes.data) {
        fetchedSections = sectionsRes.data.map((s: any) => {
          // New backend provides explicit geometry fields
          // We prioritize these over legacy JSON parsing
          return {
            id: s.sectionId,
            name: s.name,
            bowlId: s.bowlId || null,
            shape: (s.geometryType?.toLowerCase() === 'arc' ? 'arc' : 'rectangle') as 'arc' | 'rectangle',
            centerX: s.centerX ?? 0,
            centerY: s.centerY ?? 0,
            innerRadius: s.innerRadius ?? 100,
            outerRadius: s.outerRadius ?? 150,
            startAngle: s.startAngle ?? 0,
            endAngle: s.endAngle ?? 90,
            width: s.width ?? 100,
            height: s.height ?? 50,
            rotation: s.rotation ?? 0,
            type: s.type || 'Seated',
            calculatedCapacity: s.capacity || 0,
            seatType: s.seatType || 'Standard',
            rows: s.rows || 10,
            seatsPerRow: s.seatsPerRow || 20,
            color: s.color || '#4F9CF9',
            isActive: true,
            isSymmetrical: true
          } as unknown as LayoutSection;
        });
        setSections(fetchedSections);
      }

      if (bowlsRes.success && bowlsRes.data) {
        const fetchedBowls: Bowl[] = bowlsRes.data.map((b: any) => ({
          id: b.bowlId,
          name: b.name,
          color: b.color || '#4F9CF9',
          sectionIds: fetchedSections.filter(sec => sec.bowlId === b.bowlId).map(sec => sec.id),
          isActive: true,
          displayOrder: b.displayOrder || 1
        }));
        // Sort by display order
        fetchedBowls.sort((a, b) => a.displayOrder - b.displayOrder);
        setBowls(fetchedBowls);
      }
    });

  }, [planId, refreshTrigger]);

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

  const addBowl = useCallback((bowlData?: Partial<Bowl>) => {
    const tempId = bowlData?.id || `bowl-${Date.now()}`;
    const newBowl: Bowl = {
      id: tempId,
      name: bowlData?.name || `Bowl ${bowls.length + 1}`,
      color: bowlData?.color || (['#4F9CF9', '#34C759', '#FFD60A', '#AF52DE'][bowls.length % 4] || '#4F9CF9'),
      sectionIds: bowlData?.sectionIds || [],
      isActive: bowlData?.isActive ?? true,
      displayOrder: bowlData?.displayOrder || (bowls.length + 1),
    };
    setBowls(prev => [...prev, newBowl]);
    setIsDirty(true);

    // Optimistic API Creation
    if (planId) {
      coreService.createBowl(planId, {
        name: newBowl.name,
        color: newBowl.color,
        displayOrder: newBowl.displayOrder
      }).then(res => {
        if (res.success && res.data?.bowlId) {
           // Swap temp id with real id from DB so delete works later!
           setBowls(prev => prev.map(b => b.id === tempId ? { ...b, id: res.data.bowlId } : b));
        }
      }).catch(e => console.error("Failed to create bowl via API", e));
    }

    return tempId;
  }, [bowls.length, planId]);

  const updateBowl = useCallback((bowlId: string, updates: Partial<Bowl>) => {
    setBowls(prev => prev.map(b => b.id === bowlId ? { ...b, ...updates } : b));
    setIsDirty(true);

    if (!bowlId.startsWith('bowl-')) {
      coreService.updateBowl(bowlId, {
        name: updates.name,
        color: updates.color,
        displayOrder: updates.displayOrder
      }).catch(e => console.error("Failed to update bowl via API", e));
    }
  }, []);

  const deleteBowl = useCallback((bowlId: string) => {
    // Remove bowl and DELETE all its sections (not just unassign)
    setBowls(prev => prev.filter(b => b.id !== bowlId));
    setSections(prev => prev.filter(s => s.bowlId !== bowlId));
    setSeats(prev => {
      // Also remove seats belonging to deleted sections
      const deletedSectionIds = sections.filter(s => s.bowlId === bowlId).map(s => s.id);
      return prev.filter(seat => !deletedSectionIds.includes(seat.sectionId));
    });
    setIsDirty(true);

    if (!bowlId.startsWith('bowl-')) {
      coreService.deleteBowl(bowlId).catch(e => console.error("Failed to delete bowl via API", e));
    }
  }, [sections]);

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

    if (!bowlId.startsWith('bowl-')) {
      coreService.reorderBowl(bowlId, newOrder).catch(e => console.error("Failed to reorder bowl via API", e));
    }
  }, []);

  // ============================================================================
  // Section Management
  // ============================================================================

  const addSection = useCallback((section: LayoutSection) => {
    const tempId = section.id || `section-${Date.now()}`;
    const newSection = { ...section, id: tempId };
    setSections(prev => [...prev, newSection]);
    setIsDirty(true);

    if (planId) {
      if (newSection.shape === 'arc') {
        coreService.createArcSection(planId, {
          name: newSection.name,
          type: newSection.type || 'Seated',
          capacity: newSection.calculatedCapacity || 0,
          seatType: newSection.seatType || 'Standard',
          color: newSection.color || '#4F9CF9',
          centerX: newSection.centerX,
          centerY: newSection.centerY,
          innerRadius: newSection.innerRadius,
          outerRadius: newSection.outerRadius,
          startAngle: newSection.startAngle,
          endAngle: newSection.endAngle,
          rows: newSection.rows,
          seatsPerRow: newSection.seatsPerRow,
          verticalAisles: newSection.verticalAisles,
          horizontalAisles: newSection.horizontalAisles
        }).then(res => {
          if (res.success && res.data?.sectionId) {
            setSections(prev => prev.map(s => s.id === tempId ? { ...s, id: res.data.sectionId } : s));
          }
        }).catch(err => console.error("Failed to create arc section", err));
      } else {
        coreService.createRectangleSection(planId, {
          name: newSection.name,
          type: newSection.type || 'Seated',
          capacity: newSection.calculatedCapacity || 0,
          seatType: newSection.seatType || 'Standard',
          color: newSection.color || '#4F9CF9',
          centerX: newSection.centerX,
          centerY: newSection.centerY,
          width: newSection.width,
          height: newSection.height,
          rotation: newSection.rotation,
          rows: newSection.rows,
          seatsPerRow: newSection.seatsPerRow,
          verticalAisles: newSection.verticalAisles,
          horizontalAisles: newSection.horizontalAisles
        }).then(res => {
          if (res.success && res.data?.sectionId) {
            setSections(prev => prev.map(s => s.id === tempId ? { ...s, id: res.data.sectionId } : s));
          }
        }).catch(err => console.error("Failed to create rectangle section", err));
      }
    }
  }, [planId]);

  /**
   * Update section display metadata (name, seatType, color).
   * Called from the Info tab "Apply" button.
   * Maps to PUT /api/sections/{id}  →  UpdateSectionRequest { Name, SeatType, Color }
   */
  const updateSection = useCallback((sectionId: string, updates: Partial<LayoutSection>) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    ));
    setIsDirty(true);

    const merged = { ...sections.find(s => s.id === sectionId), ...updates } as LayoutSection;

    // Only send the three fields the backend endpoint accepts
    const metadataPayload = {
      name: merged.name,
      seatType: merged.seatType ?? null,
      color: merged.color ?? null,
    };

    coreService.updateSection(sectionId, metadataPayload).catch(error => {
      console.error('Failed to update section metadata:', error);
    });
  }, [sections]);

  /**
   * Update section geometry (shape, position, radii, angles, seating config, aisles).
   * Called from Geometry / Seating / Aisles "Apply" buttons.
   * Maps to PUT /api/sections/{id}/geometry
   */
  const updateSectionGeometry = useCallback((sectionId: string, updates: Partial<LayoutSection>) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    ));
    setIsDirty(true);

    const merged = { ...sections.find(s => s.id === sectionId), ...updates } as LayoutSection;

    const geometryPayload = merged.shape === 'arc'
      ? {
        geometryType: 'arc',
        centerX: merged.centerX,
        centerY: merged.centerY,
        innerRadius: merged.innerRadius,
        outerRadius: merged.outerRadius,
        startAngle: merged.startAngle,
        endAngle: merged.endAngle,
        rows: merged.rows,
        seatsPerRow: merged.seatsPerRow,
        verticalAisles: merged.verticalAisles,
        horizontalAisles: merged.horizontalAisles,
      }
      : {
        geometryType: 'rectangle',
        centerX: merged.centerX,
        centerY: merged.centerY,
        width: merged.width,
        height: merged.height,
        rotation: merged.rotation,
        rows: merged.rows,
        seatsPerRow: merged.seatsPerRow,
        verticalAisles: merged.verticalAisles,
        horizontalAisles: merged.horizontalAisles,
      };

    coreService.updateSectionGeometry(sectionId, geometryPayload).catch(error => {
      console.error('Failed to update section geometry:', error);
    });
  }, [sections]);

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
    
    // API Call
    if (!sectionId.startsWith('section-')) {
      coreService.deleteSection(sectionId).catch(console.error);
    }
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

    if (!sectionId.startsWith('section-')) {
       coreService.assignBowlToSection(sectionId, bowlId).catch(console.error);
    }
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



  const updateSeat = useCallback(async (seatId: string, updates: Partial<LayoutSeat>) => {
    // Optimistic local update
    setSeats(prev => prev.map(s =>
      s.seatId === seatId ? { ...s, ...updates } : s
    ));
    setIsDirty(true);

    // Backend sync
    if (seatId && !seatId.startsWith('seat-')) {
      try {
        await coreService.updateSeat(seatId, {
          rowLabel: updates.rowLabel,
          seatNumber: updates.seatNumber,
          posX: updates.x,
          posY: updates.y,
          isActive: !updates.disabled,
          isAccessible: updates.type === 'accessible'
        });
      } catch (err) {
        console.error('Failed to update seat in backend:', err);
      }
    }
  }, []);

  const updateSeats = useCallback(async (seatIds: string[], updates: Partial<LayoutSeat>) => {
    // Optimistic local update
    setSeats(prev => prev.map(s =>
      seatIds.includes(s.seatId) ? { ...s, ...updates } : s
    ));
    setIsDirty(true);

    // Backend sync
    for (const seatId of seatIds) {
      if (seatId && !seatId.startsWith('seat-')) {
        try {
          await coreService.updateSeat(seatId, {
            rowLabel: updates.rowLabel,
            seatNumber: updates.seatNumber,
            posX: updates.x,
            posY: updates.y,
            isActive: updates.disabled !== undefined ? !updates.disabled : undefined,
            isAccessible: updates.type !== undefined ? updates.type === 'accessible' : undefined
          });
        } catch (err) {
          console.error(`Failed to update seat ${seatId} in backend:`, err);
        }
      }
    }
  }, []);

  const deleteSeats = useCallback(async (seatIds: string[]) => {
    // Optimistic local update
    setSeats(prev => prev.filter(s => !seatIds.includes(s.seatId)));
    setSelectedSeatIds(prev => {
      const next = new Set(prev);
      seatIds.forEach(id => next.delete(id));
      return next;
    });
    setIsDirty(true);

    // Backend sync
    for (const seatId of seatIds) {
      if (seatId && !seatId.startsWith('seat-')) {
        try {
          await coreService.deleteSeat(seatId);
        } catch (err) {
          console.error(`Failed to delete seat ${seatId} in backend:`, err);
        }
      }
    }
  }, []);

  const addSeat = useCallback(async (seat: LayoutSeat) => {
    // Optimistic
    setSeats(prev => [...prev, seat]);
    setIsDirty(true);

    // Backend sync
    if (seat.sectionId && !seat.sectionId.startsWith('section-')) {
        try {
            const result = await coreService.createSeat(seat.sectionId, {
                rowLabel: seat.rowLabel,
                seatNumber: seat.seatNumber,
                posX: seat.x,
                posY: seat.y,
                isActive: !seat.disabled,
                isAccessible: seat.type === 'accessible'
            });
            if (result.success && result.data) {
                // Update with true backend ID
                setSeats(prev => prev.map(s => s.seatId === seat.seatId ? { ...s, seatId: result.data.seatId } : s));
            }
        } catch (err) {
            console.error('Failed to create seat in backend:', err);
        }
    }
  }, []);

  // ============================================================================
  // Load initial APIs once planId is available
  // ============================================================================

  useEffect(() => {
    if (planId) {
      // Fetch Bowls setup from the API asynchronously
      coreService.getBowls(planId)
        .then(res => {
          if (res.success && res.data) {
            setBowls(res.data as Bowl[]);
          }
        })
        .catch(err => console.error("Failed to fetch bowls via API", err));
    }
  }, [planId]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    mode,
    stadiumId,
    eventId,
    planId,
    fieldConfig,
    bowls,
    sections,
    seats,
    selectedSectionId,
    selectedSeatIds,
    editorMode,
    viewMode,
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
    updateSectionGeometry,
    deleteSection,
    assignSectionToBowl,

    // Seats
    setSeats,
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
    refreshLayout,
  };
}
