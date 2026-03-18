"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutCanvas } from "./LayoutCanvas";
import { LayoutTypeSidebar } from "./LayoutTypeSidebar";
import { RightPanel } from "./RightPanel";
import { buildStadiumLayout, resolveSeatTypeForRadius, SECTION_PALETTE } from "./stadiumGeometry";
import type {
  LayoutField,
  LayoutSavePayload,
  LayoutSection,
  LayoutSettings,
  LayoutType,
  LayoutRow,
  LayoutSeat,
  SectionShapeType,
} from "./types";

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;

const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  totalSections: 8,
  rowsPerSection: 6,
  seatsPerRow: 18,
  seatSpacing: 1,
  innerRadius: 120,
  outerRadius: 260,
  rowSmoothness: 0.85,
  aisleEvery: 10,
  pricing: {
    vip: 180,
    premium: 120,
    standard: 80,
    economy: 50,
    accessible: 60,
  },
  currency: "USD",
};

const DEFAULTS_BY_SHAPE: Record<
  SectionShapeType,
  Pick<LayoutSection, "width" | "height" | "radius" | "seatCount" | "seatType" | "overrideSeatType">
> = {
  rectangle: { width: 180, height: 120, radius: 60, seatCount: 200, seatType: "standard", overrideSeatType: false },
  circle: { width: 120, height: 120, radius: 60, seatCount: 180, seatType: "standard", overrideSeatType: false },
  oval: { width: 200, height: 120, radius: 60, seatCount: 220, seatType: "standard", overrideSeatType: false },
  custom: { width: 180, height: 140, radius: 70, seatCount: 210, seatType: "standard", overrideSeatType: false },
};

const clampValue = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const getSectionBounds = (section: LayoutSection) => {
  if (section.type === "circle") {
    const size = section.radius * 2;
    return { width: size, height: size };
  }

  return { width: section.width, height: section.height };
};

const normalizeSection = (section: LayoutSection): LayoutSection => {
  const width = Math.max(20, section.width);
  const height = Math.max(20, section.height);
  const radius = Math.max(10, section.radius);
  const seatCount = Math.max(0, Math.round(section.seatCount));

  const sectionWithBounds: LayoutSection = {
    ...section,
    width,
    height,
    radius,
    seatCount,
  };

  const bounds = getSectionBounds(sectionWithBounds);
  return {
    ...sectionWithBounds,
    x: clampValue(sectionWithBounds.x, 0, Math.max(0, CANVAS_WIDTH - bounds.width)),
    y: clampValue(sectionWithBounds.y, 0, Math.max(0, CANVAS_HEIGHT - bounds.height)),
  };
};

const createTemplateSection = (
  type: SectionShapeType,
  seatCountOverride?: number
): LayoutSection => {
  const defaults = DEFAULTS_BY_SHAPE[type];
  const width = defaults.width;
  const height = defaults.height;
  const x = clampValue((CANVAS_WIDTH - width) / 2, 0, CANVAS_WIDTH - width);
  const y = clampValue((CANVAS_HEIGHT - height) / 2, 0, CANVAS_HEIGHT - height);
  const color = SECTION_PALETTE[Date.now() % SECTION_PALETTE.length] ?? "#4F9CF9";

  return normalizeSection({
    id: `T-${type.toUpperCase()}-${Date.now()}`,
    type,
    x,
    y,
    width,
    height,
    radius: defaults.radius,
    rotation: 0,
    seatCount: seatCountOverride ?? defaults.seatCount,
    seatType: defaults.seatType,
    overrideSeatType: defaults.overrideSeatType,
    color,
  });
};

export function LayoutEditor() {
  const router = useRouter();
  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>("circle");
  const [layoutSettings, setLayoutSettings] = useState(DEFAULT_LAYOUT_SETTINGS);
  const [field, setField] = useState<LayoutField | null>(null);
  const [rows, setRows] = useState<LayoutRow[]>([]);
  const [seats, setSeats] = useState<LayoutSeat[]>([]);
  const [savedPayload, setSavedPayload] = useState<LayoutSavePayload | null>(null);
  const lastLayoutTypeRef = useRef<LayoutType>(layoutType);
  const overrideRef = useRef<Map<string, LayoutSection["seatType"]>>(new Map());
  const [seatDensityMode, setSeatDensityMode] = useState<"rows" | "rows+seats" | "seats">(
    "rows+seats"
  );
  const [resetViewToken, setResetViewToken] = useState(0);
  const [showSeatNumbers, setShowSeatNumbers] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(() => new Set());
  const [selectionMode, setSelectionMode] = useState<"single" | "multi">("single");
  const [editorMode, setEditorMode] = useState<"stadium" | "section">("stadium");
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const actionMessageTimeoutRef = useRef<number | null>(null);
  const restoringDraftRef = useRef<{
    layoutType?: LayoutType;
    layoutSettings?: LayoutSettings;
    sections?: LayoutSection[];
    rows?: LayoutRow[];
    seats?: LayoutSeat[];
    field?: LayoutField | null;
  } | null>(null);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousHtmlOverscrollBehavior = html.style.overscrollBehavior;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    html.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      html.style.overscrollBehavior = previousHtmlOverscrollBehavior;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (actionMessageTimeoutRef.current) {
        window.clearTimeout(actionMessageTimeoutRef.current);
      }
    };
  }, []);

  const showActionMessage = useCallback((message: string) => {
    setActionMessage(message);
    if (actionMessageTimeoutRef.current) {
      window.clearTimeout(actionMessageTimeoutRef.current);
    }
    actionMessageTimeoutRef.current = window.setTimeout(() => {
      setActionMessage(null);
      actionMessageTimeoutRef.current = null;
    }, 3000);
  }, []);

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) {
      return null;
    }

    return sections.find((section) => section.id === selectedSectionId) ?? null;
  }, [sections, selectedSectionId]);

  const handleSelectLayoutType = useCallback((type: LayoutType) => {
    setLayoutType(type);
  }, []);

  useEffect(() => {
    overrideRef.current = new Map(
      sections
        .filter((section) => section.overrideSeatType)
        .map((section) => [section.id, section.seatType])
    );
  }, [sections]);

  useEffect(() => {
    const seatCount = layoutSettings.rowsPerSection * layoutSettings.seatsPerRow;
    if (restoringDraftRef.current) {
      const draftPayload = restoringDraftRef.current;
      restoringDraftRef.current = null;

      if (typeof draftPayload.field !== "undefined") {
        setField(draftPayload.field ?? null);
      }

      if (draftPayload.sections) {
        setSections(draftPayload.sections);
        setSelectedSectionId(draftPayload.sections[0]?.id ?? null);
      }

      if (draftPayload.rows) {
        setRows(draftPayload.rows);
      }

      if (draftPayload.seats) {
        const pricing = draftPayload.layoutSettings?.pricing ?? layoutSettings.pricing;
        setSeats(
          draftPayload.seats.map((seat) => ({
            ...seat,
            price: typeof seat.price === "number" ? seat.price : pricing[seat.type],
          }))
        );
      }

      lastLayoutTypeRef.current = layoutType;
      return;
    }

    const {
      field: nextField,
      sections: generatedSections,
      rows: generatedRows,
      seats: generatedSeats,
    } = buildStadiumLayout(
      layoutType,
      layoutSettings,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    setField(nextField);

    if (layoutType === "custom") {
      setSections((current) => {
        const shouldReset = lastLayoutTypeRef.current !== "custom" || current.length === 0;
        if (shouldReset) {
          const template = createTemplateSection("custom", seatCount);
          setSelectedSectionId(template.id);
          return [template];
        }

        return current.map((section) => ({
          ...section,
          seatCount,
        }));
      });
      setRows([]);
      setSeats([]);
    } else {
      const overrides = overrideRef.current;
      const mergedSections = generatedSections.map((section) => {
        const overrideType = overrides.get(section.id);
        if (!overrideType) {
          return section;
        }

        return {
          ...section,
          seatType: overrideType,
          overrideSeatType: true,
        };
      });

      const mergedSeats =
        overrides.size === 0
          ? generatedSeats
          : generatedSeats.map((seat) => {
              const overrideType = overrides.get(seat.sectionId);
              return overrideType
                ? { ...seat, type: overrideType, price: layoutSettings.pricing[overrideType] }
                : seat;
            });

      setSections(mergedSections);
      setSelectedSectionId(generatedSections[0]?.id ?? null);
      setRows(generatedRows);
      setSeats(mergedSeats);
    }

    lastLayoutTypeRef.current = layoutType;
  }, [layoutType, layoutSettings]);

  useEffect(() => {
    if (selectedSeatIds.size === 0) {
      return;
    }

    const availableSeatIds = new Set(seats.map((seat) => seat.seatId));
    const filtered = new Set<string>();
    selectedSeatIds.forEach((seatId) => {
      if (availableSeatIds.has(seatId)) {
        filtered.add(seatId);
      }
    });

    if (filtered.size === selectedSeatIds.size) {
      return;
    }

    setSelectedSeatIds(filtered);
  }, [seats, selectedSeatIds]);

  const updateSection = useCallback(
    (sectionId: string, patch: Partial<LayoutSection>) => {
      setSections((current) =>
        current.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          return normalizeSection({
            ...section,
            ...patch,
          });
        })
      );
    },
    []
  );

  const applyZoneSeatTypes = useCallback(() => {
    const overrideMap = new Map(
      sections
        .filter((section) => section.overrideSeatType)
        .map((section) => [section.id, section.seatType])
    );
    const pricing = layoutSettings.pricing;
    setSeats((current) =>
      current.map((seat) => {
        const overrideType = overrideMap.get(seat.sectionId);
        if (overrideType) {
          return { ...seat, type: overrideType, price: pricing[overrideType] };
        }

        const rowRadius =
          layoutSettings.innerRadius +
          (seat.rowNumber - 1) *
            ((layoutSettings.outerRadius - layoutSettings.innerRadius) /
              Math.max(layoutSettings.rowsPerSection, 1));
        const resolvedType = resolveSeatTypeForRadius(
          rowRadius,
          layoutSettings.innerRadius,
          layoutSettings.outerRadius
        );
        return {
          ...seat,
          type: resolvedType,
          price: pricing[resolvedType],
        };
      })
    );
  }, [
    layoutSettings.innerRadius,
    layoutSettings.outerRadius,
    layoutSettings.pricing,
    layoutSettings.rowsPerSection,
    sections,
  ]);

  const updateSectionSeatType = useCallback(
    (sectionId: string, seatType: LayoutSection["seatType"]) => {
      setSections((current) =>
        current.map((section) =>
          section.id === sectionId
            ? { ...section, seatType, overrideSeatType: true }
            : section
        )
      );
      setSeats((current) =>
        current.map((seat) =>
          seat.sectionId === sectionId
            ? { ...seat, type: seatType, price: layoutSettings.pricing[seatType] }
            : seat
        )
      );
    },
    [layoutSettings.pricing]
  );

  const setSectionSeatOverride = useCallback(
    (sectionId: string, overrideSeatType: boolean) => {
      setSections((current) =>
        current.map((section) =>
          section.id === sectionId ? { ...section, overrideSeatType } : section
        )
      );

      if (!overrideSeatType) {
        applyZoneSeatTypes();
      }
    },
    [applyZoneSeatTypes]
  );

  const updateLayoutSetting = useCallback(
    <K extends keyof LayoutSettings>(key: K, value: LayoutSettings[K]) => {
      setLayoutSettings((current) => ({
        ...current,
        [key]: value,
      }));
    },
    []
  );

  const updatePricing = useCallback((seatType: LayoutSeat["type"], value: number) => {
    setLayoutSettings((current) => ({
      ...current,
      pricing: {
        ...current.pricing,
        [seatType]: value,
      },
    }));
    setSeats((current) =>
      current.map((seat) =>
        seat.type === seatType ? { ...seat, price: value } : seat
      )
    );
  }, []);

  const updateCurrency = useCallback((value: string) => {
    setLayoutSettings((current) => ({
      ...current,
      currency: value,
    }));
  }, []);

  const buildLayoutPayload = useCallback((): LayoutSavePayload => {
    return {
      stadiumLayout: {
        sections,
        rows,
        seats,
      },
      layoutSettings,
      pricing: layoutSettings.pricing,
      currency: layoutSettings.currency,
      generatedAt: new Date().toISOString(),
    };
  }, [layoutSettings, rows, seats, sections]);

  const isPricingValid = useCallback(() => {
    if (!layoutSettings.currency) {
      return false;
    }

    return Object.values(layoutSettings.pricing).every((value) => value >= 0);
  }, [layoutSettings.currency, layoutSettings.pricing]);

  const saveLayout = useCallback(() => {
    if (isProcessing) {
      return;
    }

    if (sections.length === 0 || rows.length === 0 || seats.length === 0) {
      showActionMessage("Cannot save layout: no seats generated.");
      return;
    }

    setIsProcessing(true);

    const payload = buildLayoutPayload();

    setSavedPayload(payload);
    showActionMessage("Layout saved to preview.");
    setIsProcessing(false);
  }, [buildLayoutPayload, isProcessing, rows.length, seats.length, sections.length, showActionMessage]);

  const clearSeatSelection = useCallback(() => {
    setSelectedSeatIds(() => new Set());
  }, []);

  const handleSeatClick = useCallback(
    (seat: LayoutSeat, event: React.MouseEvent<SVGCircleElement>) => {
      const isModifier = event.metaKey || event.ctrlKey;
      setSelectionMode(isModifier ? "multi" : "single");
      setSelectedSeatIds((current) => {
        const next = new Set(current);
        if (isModifier) {
          if (next.has(seat.seatId)) {
            next.delete(seat.seatId);
          } else {
            next.add(seat.seatId);
          }
        } else {
          next.clear();
          next.add(seat.seatId);
        }
        return next;
      });
    },
    []
  );

  const addSeatsToSelection = useCallback((seatIds: string[]) => {
    if (seatIds.length === 0) {
      return;
    }

    setSelectionMode("multi");
    setSelectedSeatIds((current) => {
      const next = new Set(current);
      seatIds.forEach((seatId) => next.add(seatId));
      return next;
    });
  }, []);

  const applySeatTypeToSelection = useCallback(
    (seatType: LayoutSeat["type"]) => {
      if (selectedSeatIds.size === 0) {
        return;
      }

      setSeats((current) =>
        current.map((seat) =>
          selectedSeatIds.has(seat.seatId)
            ? { ...seat, type: seatType, price: layoutSettings.pricing[seatType] }
            : seat
        )
      );
    },
    [layoutSettings.pricing, selectedSeatIds]
  );

  const setSelectedSeatsDisabled = useCallback(
    (disabled: boolean) => {
      if (selectedSeatIds.size === 0) {
        return;
      }

      setSeats((current) =>
        current.map((seat) =>
          selectedSeatIds.has(seat.seatId) ? { ...seat, disabled } : seat
        )
      );
    },
    [selectedSeatIds]
  );

  const handleSaveDraft = useCallback(() => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    const payload = buildLayoutPayload();
    const draft = {
      payload,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("stadium_layout_draft", JSON.stringify(draft));
    setDraftSavedAt(draft.savedAt);
    showActionMessage("Draft saved successfully.");
    setIsProcessing(false);
  }, [buildLayoutPayload, isProcessing, showActionMessage]);

  const handleRestoreDraft = useCallback(() => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    const rawDraft = localStorage.getItem("stadium_layout_draft");
    if (!rawDraft) {
      showActionMessage("No draft found.");
      setIsProcessing(false);
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as {
        payload?: LayoutSavePayload | {
          layoutType?: LayoutType;
          layoutSettings?: LayoutSettings;
          sections?: LayoutSection[];
          rows?: LayoutRow[];
          seats?: LayoutSeat[];
          field?: LayoutField | null;
        };
        savedAt?: string;
      };

      if (!parsed.payload) {
        showActionMessage("Draft is missing payload.");
        setIsProcessing(false);
        return;
      }

      const payload = parsed.payload;
      const restoredLayoutSettings =
  "layoutSettings" in payload &&
  payload.layoutSettings &&
  typeof payload.layoutSettings === "object"
    ? payload.layoutSettings
    : undefined;
      const restoredLayoutType =
        "layoutType" in payload ? payload.layoutType : undefined;
      const stadiumLayout =
        "stadiumLayout" in payload ? payload.stadiumLayout : undefined;
      const restoredSections =
  stadiumLayout?.sections ??
  ("sections" in payload && Array.isArray(payload.sections)
    ? payload.sections
    : undefined);

const restoredRows =
  stadiumLayout?.rows ??
  ("rows" in payload && Array.isArray(payload.rows)
    ? payload.rows
    : undefined);

const restoredSeats =
  stadiumLayout?.seats ??
  ("seats" in payload && Array.isArray(payload.seats)
    ? payload.seats
    : undefined);

      if (!Array.isArray(restoredSections) || restoredSections.length === 0) {
        showActionMessage("Draft is missing sections.");
        setIsProcessing(false);
        return;
      }

      if (restoredLayoutType || restoredLayoutSettings) {
        restoringDraftRef.current = {
          layoutType: restoredLayoutType,
          layoutSettings: restoredLayoutSettings,
          sections: restoredSections,
          rows: restoredRows,
          seats: restoredSeats,
          field: "field" in payload ? payload.field ?? null : null,
        };
        if (restoredLayoutType) {
          setLayoutType(restoredLayoutType);
        }
        if (restoredLayoutSettings) {
          setLayoutSettings({
            ...DEFAULT_LAYOUT_SETTINGS,
            ...restoredLayoutSettings,
            pricing: {
              ...DEFAULT_LAYOUT_SETTINGS.pricing,
              ...restoredLayoutSettings.pricing,
            },
          });
        }
      } else {
        if ("field" in payload && typeof payload.field !== "undefined") {
          setField(payload.field ?? null);
        }
        if (restoredSections) {
          setSections(restoredSections);
          setSelectedSectionId(restoredSections[0]?.id ?? null);
        }
        if (restoredRows) {
          setRows(restoredRows);
        }
        if (restoredSeats) {
          const pricing =
  (restoredLayoutSettings as LayoutSettings | undefined)?.pricing ??
  layoutSettings.pricing;
          setSeats(
            restoredSeats.map((seat) => ({
              ...seat,
              price: typeof seat.price === "number" ? seat.price : pricing[seat.type],
            }))
          );
        }
      }

      if (parsed.savedAt) {
        setDraftSavedAt(parsed.savedAt);
      }

      showActionMessage("Draft restored.");
    } catch (error) {
      showActionMessage("Draft restore failed.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, layoutSettings.pricing, showActionMessage]);

  const handleDeleteDraft = useCallback(() => {
    if (isProcessing) {
      return;
    }

    localStorage.removeItem("stadium_layout_draft");
    setDraftSavedAt(null);
    showActionMessage("Draft deleted.");
  }, [isProcessing, showActionMessage]);

  const handlePublish = useCallback(() => {
    if (isProcessing) {
      return;
    }

    if (sections.length === 0 || rows.length === 0 || seats.length === 0) {
      showActionMessage("Publish failed: layout is incomplete.");
      return;
    }

    if (!isPricingValid()) {
      showActionMessage("Invalid pricing configuration.");
      return;
    }

    setIsProcessing(true);
    const payload = buildLayoutPayload();
    const publishedPayload = {
      payload,
      publishedAt: new Date().toISOString(),
    };

    localStorage.setItem("stadium_layout_published", JSON.stringify(publishedPayload));
    setPublishedAt(publishedPayload.publishedAt);
    showActionMessage("Layout published.");
    setIsProcessing(false);
  }, [
    buildLayoutPayload,
    isProcessing,
    isPricingValid,
    rows.length,
    seats.length,
    sections.length,
    showActionMessage,
  ]);

  const handlePageLayout = useCallback(() => {
    try {
      router.push("/manager/stadiums/preview");
    } catch (error) {
      console.error(error);
      router.push("/manager/stadiums");
    }
  }, [router]);

  const handleExportJson = useCallback(() => {
    if (isProcessing) {
      return;
    }

    if (!savedPayload) {
      showActionMessage("Save the layout before exporting.");
      return;
    }

    setIsProcessing(true);
    const blob = new Blob([JSON.stringify(savedPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stadium-layout.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showActionMessage("Exported JSON.");
    setIsProcessing(false);
  }, [isProcessing, savedPayload, showActionMessage]);

  const handleCopyJson = useCallback(() => {
    if (isProcessing) {
      return;
    }

    if (!savedPayload) {
      showActionMessage("Save the layout before copying.");
      return;
    }

    const text = JSON.stringify(savedPayload, null, 2);
    navigator.clipboard.writeText(text).then(
      () => showActionMessage("JSON copied."),
      () => showActionMessage("Unable to copy JSON.")
    );
  }, [isProcessing, savedPayload, showActionMessage]);

  const handleResetView = useCallback(() => {
    setResetViewToken((current) => current + 1);
  }, []);

  const exitSectionMode = useCallback(() => {
    setEditorMode("stadium");
    setFocusedSectionId(null);
    setResetViewToken((current) => current + 1);
    clearSeatSelection();
  }, [clearSeatSelection]);

  useEffect(() => {
    if (layoutType === "custom") {
      return;
    }

    const overrides = new Map(
      sections
        .filter((section) => section.overrideSeatType)
        .map((section) => [section.id, section.seatType])
    );

    if (overrides.size === 0) {
      return;
    }

    setSeats((current) =>
      current.map((seat) => {
        const overrideType = overrides.get(seat.sectionId);
        return overrideType ? { ...seat, type: overrideType } : seat;
      })
    );
  }, [layoutType, sections]);

  const seatStatsByType = useMemo(() => {
    const base = { vip: 0, premium: 0, standard: 0, economy: 0, accessible: 0 };
    if (seats.length > 0) {
      return seats.reduce((acc, seat) => {
        acc[seat.type] += 1;
        return acc;
      }, base);
    }

    if (layoutType === "custom" && sections.length > 0) {
      const seatsPerSection = layoutSettings.rowsPerSection * layoutSettings.seatsPerRow;
      return sections.reduce((acc, section) => {
        acc[section.seatType] += seatsPerSection;
        return acc;
      }, base);
    }

    return base;
  }, [layoutType, layoutSettings.rowsPerSection, layoutSettings.seatsPerRow, seats, sections]);

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="w-[260px] shrink-0 border-r border-slate-200 bg-white">
        <div className="sticky top-0 h-full">
          <LayoutTypeSidebar layoutType={layoutType} onSelectLayoutType={handleSelectLayoutType} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
        <div className="mx-3 mt-3 flex items-center justify-start">
          {editorMode === "section" ? (
            <button
              type="button"
              onClick={exitSectionMode}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
            >
              ← Back to Stadium View
            </button>
          ) : (
            <div className="h-6 w-28" />
          )}
        </div>
        <div className="flex h-full w-full flex-1 items-center justify-center overflow-hidden p-3">
          <LayoutCanvas
            sections={sections}
            rows={rows}
            seats={seats}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
            onUpdateSection={updateSection}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            field={field}
            showSeatPreview
            seatDensityMode={seatDensityMode}
            resetViewToken={resetViewToken}
            showSeatNumbers={showSeatNumbers}
            selectedSeatIds={selectedSeatIds}
            selectionMode={selectionMode}
            onSelectionModeChange={setSelectionMode}
            onSeatClick={handleSeatClick}
            onSelectionComplete={addSeatsToSelection}
            onClearSeatSelection={clearSeatSelection}
            editorMode={editorMode}
            focusedSectionId={focusedSectionId}
            onRequestSectionFocus={(sectionId) => {
              setEditorMode("section");
              setFocusedSectionId(sectionId);
            }}
          />
        </div>
      </div>

      <div className="w-[340px] shrink-0 border-l border-slate-200 bg-white">
        <div className="h-full overflow-y-auto p-4">
            <RightPanel
              section={selectedSection}
              savedPayload={savedPayload}
              onUpdateSection={updateSection}
              onSave={saveLayout}
              layoutSettings={layoutSettings}
              onLayoutSettingChange={updateLayoutSetting}
              pricing={layoutSettings.pricing}
              currency={layoutSettings.currency}
              onUpdatePricing={updatePricing}
              onUpdateCurrency={updateCurrency}
              onSaveDraft={handleSaveDraft}
              onRestoreDraft={handleRestoreDraft}
              onDeleteDraft={handleDeleteDraft}
              onPublish={handlePublish}
              onPageLayout={handlePageLayout}
              onExportJson={handleExportJson}
              onCopyJson={handleCopyJson}
              seatStats={{
                totalSections:
                  layoutType === "custom" ? sections.length : layoutSettings.totalSections,
                rowsPerSection: layoutSettings.rowsPerSection,
                seatsPerRow: layoutSettings.seatsPerRow,
                totalSeats:
                  (layoutType === "custom" ? sections.length : layoutSettings.totalSections) *
                  layoutSettings.rowsPerSection *
                  layoutSettings.seatsPerRow,
                byType: seatStatsByType,
              }}
              selectedSeatIds={selectedSeatIds}
              selectionMode={selectionMode}
              onSelectionModeChange={setSelectionMode}
              onBulkSeatTypeChange={applySeatTypeToSelection}
              onDisableSelectedSeats={() => setSelectedSeatsDisabled(true)}
              onEnableSelectedSeats={() => setSelectedSeatsDisabled(false)}
              onClearSeatSelection={clearSeatSelection}
              seatDensityMode={seatDensityMode}
              onSeatDensityChange={setSeatDensityMode}
              onResetView={handleResetView}
              showSeatNumbers={showSeatNumbers}
              onShowSeatNumbersChange={setShowSeatNumbers}
              onUpdateSeatType={updateSectionSeatType}
              onUpdateSeatOverride={setSectionSeatOverride}
              actionMessage={actionMessage}
              isProcessing={isProcessing}
              draftSavedAt={draftSavedAt}
              publishedAt={publishedAt}
            />
        </div>
      </div>
    </div>
  );
}
