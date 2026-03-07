"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FieldLandmark } from "./FieldLandmark";
import { SeatRenderer } from "./components/SeatRenderer";
import { SectionShape } from "./SectionShape";
import styles from "./LayoutCanvas.module.scss";
import type { LayoutField, LayoutRow, LayoutSeat, LayoutSection } from "./types";

interface LayoutCanvasProps {
  sections: LayoutSection[];
  rows?: LayoutRow[];
  seats?: LayoutSeat[];
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onUpdateSection: (sectionId: string, patch: Partial<LayoutSection>) => void;
  width?: number;
  height?: number;
  field?: LayoutField | null;
  showSeatPreview?: boolean;
  seatDensityMode?: "rows" | "rows+seats" | "seats";
  resetViewToken?: number;
  showSeatNumbers?: boolean;
  editorMode?: "stadium" | "section";
  focusedSectionId?: string | null;
  onRequestSectionFocus?: (sectionId: string) => void;
  selectedSeatIds?: Set<string>;
  selectionMode?: "single" | "multi";
  onSelectionModeChange?: (mode: "single" | "multi") => void;
  onSeatClick?: (seat: LayoutSeat, event: React.MouseEvent<SVGCircleElement>) => void;
  onSelectionComplete?: (seatIds: string[]) => void;
  onClearSeatSelection?: () => void;
  currency?: string;
}

interface DragState {
  sectionId: string;
  offsetX: number;
  offsetY: number;
  maxX: number;
  maxY: number;
}

const getSectionBounds = (section: LayoutSection) => {
  if (section.type === "circle") {
    const size = section.radius * 2;
    return { width: size, height: size };
  }

  return { width: section.width, height: section.height };
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const normalizeCoord = (value: number) => Number(value.toFixed(3));

const toRadians = (angleInDegrees: number) => (angleInDegrees * Math.PI) / 180;

const polarToEllipse = (
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  angle: number
) => {
  const radians = toRadians(angle);
  return {
    x: normalizeCoord(centerX + radiusX * Math.cos(radians)),
    y: normalizeCoord(centerY + radiusY * Math.sin(radians)),
  };
};

const describeRowArc = (row: LayoutRow) => {
  const largeArcFlag = row.endAngle - row.startAngle > 180 ? 1 : 0;
  const start = polarToEllipse(
    row.centerX,
    row.centerY,
    row.radiusX,
    row.radiusY,
    row.startAngle
  );
  const end = polarToEllipse(
    row.centerX,
    row.centerY,
    row.radiusX,
    row.radiusY,
    row.endAngle
  );

  return `M ${start.x} ${start.y} A ${row.radiusX} ${row.radiusY} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const getRowLabelPosition = (row: LayoutRow) => {
  const labelAngle = row.startAngle + 2;
  const radiusX = row.radiusX + 10;
  const radiusY = row.radiusY + 10;
  return polarToEllipse(row.centerX, row.centerY, radiusX, radiusY, labelAngle);
};

export function LayoutCanvas({
  sections,
  rows = [],
  seats = [],
  selectedSectionId,
  onSelectSection,
  onUpdateSection,
  width = 1400,
  height = 900,
  field = null,
  showSeatPreview = true,
  seatDensityMode = "rows+seats",
  resetViewToken = 0,
  showSeatNumbers = false,
  selectedSeatIds,
  selectionMode = "single",
  onSelectionModeChange,
  onSeatClick,
  onSelectionComplete,
  onClearSeatSelection,
  currency = "USD",
  editorMode = "stadium",
  focusedSectionId = null,
  onRequestSectionFocus,
}: LayoutCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const frameRef = useRef<number | null>(null);
  const pendingFrameRef = useRef<(() => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const suppressAutoFocusRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [isSelectingSeats, setIsSelectingSeats] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null);
  const seatPreviewLimit = 20000;
  const minZoom = 0.5;
  const maxZoom = 4;
  const focusZoom = 2.5;
  const sectionFocusZoom = Math.min(maxZoom, focusZoom * 1.3);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const scheduleFrameUpdate = useCallback((callback: () => void) => {
    pendingFrameRef.current = callback;
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const pending = pendingFrameRef.current;
      pendingFrameRef.current = null;
      if (pending) {
        pending();
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      pendingFrameRef.current = null;
    };
  }, []);

  const sectionById = useMemo(() => {
    const map = new Map<string, LayoutSection>();
    sections.forEach((section) => map.set(section.id, section));
    return map;
  }, [sections]);

  const visibleSections =
    editorMode === "section" && focusedSectionId
      ? sections.filter((section) => section.id === focusedSectionId)
      : sections;

  const visibleRows =
    editorMode === "section" && focusedSectionId
      ? rows.filter((row) => row.sectionId === focusedSectionId)
      : rows;

  const visibleSeats =
    editorMode === "section" && focusedSectionId
      ? seats.filter((seat) => seat.sectionId === focusedSectionId)
      : seats;

  const sectionLabelPositions = useMemo(() => {
    const highestRows = new Map<string, LayoutRow>();
    visibleRows.forEach((row) => {
      const candidate = highestRows.get(row.sectionId);
      if (!candidate || row.rowNumber >= candidate.rowNumber) {
        highestRows.set(row.sectionId, row);
      }
    });

    const map = new Map<string, { x: number; y: number }>();
    highestRows.forEach((row, sectionId) => {
      const midAngle = (row.startAngle + row.endAngle) / 2;
      const labelRadiusX = row.radiusX + 25;
      const labelRadiusY = row.radiusY + 25;
      const point = polarToEllipse(
        row.centerX,
        row.centerY,
        labelRadiusX,
        labelRadiusY,
        midAngle
      );

      map.set(sectionId, { x: point.x, y: point.y });
    });

    return map;
  }, [visibleRows]);

  const shouldRenderRows = editorMode === "section" || seatDensityMode !== "seats";
  const seatLimitExceeded = visibleSeats.length > seatPreviewLimit;
  const shouldRenderSeatPreview =
    showSeatPreview &&
    (editorMode === "section" || seatDensityMode !== "rows") &&
    (editorMode === "section" || !seatLimitExceeded);
  const shouldShowSeatLimitMessage =
    showSeatPreview &&
    seatDensityMode !== "rows" &&
    editorMode !== "section" &&
    seatLimitExceeded;
  const shouldShowSeatNumbers =
    showSeatNumbers && (editorMode === "section" || zoom > 1.5);
  const selectionAllowed =
    editorMode === "section" &&
    selectionMode === "multi" &&
    visibleSeats.length <= seatPreviewLimit;
  const selectionRect =
    selectionStart && selectionCurrent
      ? {
          x: Math.min(selectionStart.x, selectionCurrent.x),
          y: Math.min(selectionStart.y, selectionCurrent.y),
          width: Math.abs(selectionCurrent.x - selectionStart.x),
          height: Math.abs(selectionCurrent.y - selectionStart.y),
        }
      : null;

  const getSvgPointFromClient = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;

    if (!svg) {
      return null;
    }

    const matrix = svg.getScreenCTM();
    if (!matrix) {
      return null;
    }

    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const transformedPoint = point.matrixTransform(matrix.inverse());

    return {
      x: transformedPoint.x,
      y: transformedPoint.y,
    };
  }, []);

  const getCanvasCoordinates = useCallback(
    (event: MouseEvent | React.MouseEvent<SVGSVGElement | SVGGElement>) => {
      const transformedPoint = getSvgPointFromClient(event.clientX, event.clientY);
      if (!transformedPoint) {
        return null;
      }

      return {
        x: (transformedPoint.x - pan.x) / zoom,
        y: (transformedPoint.y - pan.y) / zoom,
      };
    },
    [getSvgPointFromClient, pan.x, pan.y, zoom]
  );

  useEffect(() => {
    scheduleFrameUpdate(() => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    });
  }, [resetViewToken, scheduleFrameUpdate]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return undefined;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = svg.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      const canvasX = (mouseX - currentPan.x) / currentZoom;
      const canvasY = (mouseY - currentPan.y) / currentZoom;

      const delta = event.deltaY < 0 ? 1.1 : 0.9;
      const nextZoom = clamp(currentZoom * delta, minZoom, maxZoom);

      scheduleFrameUpdate(() => {
        setZoom(nextZoom);
        setPan({
          x: mouseX - canvasX * nextZoom,
          y: mouseY - canvasY * nextZoom,
        });
      });
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [maxZoom, minZoom, scheduleFrameUpdate]);

  useEffect(() => {
    if (!dragState) {
      document.body.classList.remove("layout-editor-no-select");
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const pointer = getCanvasCoordinates(event);
      if (!pointer) {
        return;
      }

      const nextX = clamp(pointer.x - dragState.offsetX, 0, dragState.maxX);
      const nextY = clamp(pointer.y - dragState.offsetY, 0, dragState.maxY);

      scheduleFrameUpdate(() => {
        onUpdateSection(dragState.sectionId, { x: nextX, y: nextY });
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    document.body.classList.add("layout-editor-no-select");
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.classList.remove("layout-editor-no-select");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, getCanvasCoordinates, onUpdateSection, scheduleFrameUpdate]);

  const handleSectionMouseDown = (
    event: React.MouseEvent<SVGGElement>,
    sectionId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (selectedSectionId !== sectionId) {
      onSelectSection(sectionId);
      return;
    }

    const section = sectionById.get(sectionId);
    const pointer = getCanvasCoordinates(event);

    if (!section || !pointer) {
      return;
    }

    const bounds = getSectionBounds(section);
    setDragState({
      sectionId,
      offsetX: pointer.x - section.x,
      offsetY: pointer.y - section.y,
      maxX: Math.max(0, width - bounds.width),
      maxY: Math.max(0, height - bounds.height),
    });
  };

  const focusOnSection = useCallback(
    (sectionId: string, zoomLevel?: number) => {
      const section = sectionById.get(sectionId);
      if (!section) {
        return;
      }

    const bounds = getSectionBounds(section);
    const centerX = section.x + bounds.width / 2;
    const centerY = section.y + bounds.height / 2;
    const nextZoom = clamp(zoomLevel ?? focusZoom, minZoom, maxZoom);
    scheduleFrameUpdate(() => {
      setZoom(nextZoom);
      setPan({
        x: width / 2 - centerX * nextZoom,
        y: height / 2 - centerY * nextZoom,
      });
    });
  },
  [sectionById, width, height, scheduleFrameUpdate]
);

  useEffect(() => {
    if (editorMode === "section" && focusedSectionId) {
      if (suppressAutoFocusRef.current) {
        suppressAutoFocusRef.current = false;
        return;
      }
      focusOnSection(focusedSectionId, sectionFocusZoom);
    }
  }, [editorMode, focusedSectionId, focusOnSection, sectionFocusZoom]);

  const handleSectionClick = (
    event: React.MouseEvent<SVGGElement>,
    sectionId: string
  ) => {
    event.stopPropagation();
    onClearSeatSelection?.();
    onSelectSection(sectionId);
    if (editorMode === "stadium") {
      focusOnSection(sectionId);
    }
  };

  const animateCameraTo = useCallback(
    (targetZoom: number, targetPan: { x: number; y: number }, onComplete?: () => void) => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const startZoom = zoomRef.current;
      const startPan = panRef.current;
      const duration = 400;
      const startTime = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const nextZoom = startZoom + (targetZoom - startZoom) * ease;
        const nextPan = {
          x: startPan.x + (targetPan.x - startPan.x) * ease,
          y: startPan.y + (targetPan.y - startPan.y) * ease,
        };

        setZoom(nextZoom);
        setPan(nextPan);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          animationFrameRef.current = null;
          onComplete?.();
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  const handleSectionDoubleClick = (
    event: React.MouseEvent<SVGGElement>,
    sectionId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsPanning(false);
    setIsSelectingSeats(false);

    const section = sectionById.get(sectionId);
    if (!section) {
      return;
    }

    const bounds = getSectionBounds(section);
    const padding = 80;
    const boundsWidth = Math.max(bounds.width + padding * 2, 1);
    const boundsHeight = Math.max(bounds.height + padding * 2, 1);
    const zoomX = width / boundsWidth;
    const zoomY = height / boundsHeight;
    const targetZoom = clamp(Math.min(zoomX, zoomY), 1.5, maxZoom);
    const centerX = section.x + bounds.width / 2;
    const centerY = section.y + bounds.height / 2;
    const targetPan = {
      x: width / 2 - centerX * targetZoom,
      y: height / 2 - centerY * targetZoom,
    };

    suppressAutoFocusRef.current = true;
    animateCameraTo(targetZoom, targetPan, () => {
      onSelectSection(sectionId);
      onRequestSectionFocus?.(sectionId);
    });
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    const canvasPointer = getCanvasCoordinates(event);
    const svgPointer = getSvgPointFromClient(event.clientX, event.clientY);
    if (!svgPointer) {
      return;
    }

    if (selectionAllowed && canvasPointer && event.button === 0) {
      event.preventDefault();
      scheduleFrameUpdate(() => {
        setIsSelectingSeats(true);
        setSelectionStart(canvasPointer);
        setSelectionCurrent(canvasPointer);
      });
      onSelectionModeChange?.("multi");
      return;
    }

    if (selectionMode === "single") {
      onClearSeatSelection?.();
    }

    onSelectSection(null);
    scheduleFrameUpdate(() => {
      setIsPanning(true);
      setPanStart({
        x: svgPointer.x - pan.x,
        y: svgPointer.y - pan.y,
      });
    });
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (isSelectingSeats) {
      const pointer = getCanvasCoordinates(event);
      if (!pointer) {
        return;
      }

      scheduleFrameUpdate(() => {
        setSelectionCurrent(pointer);
      });
      return;
    }

    if (!isPanning) {
      return;
    }

    const pointer = getSvgPointFromClient(event.clientX, event.clientY);
    if (!pointer) {
      return;
    }

    scheduleFrameUpdate(() => {
      setPan({
        x: pointer.x - panStart.x,
        y: pointer.y - panStart.y,
      });
    });
  };

  const handleCanvasMouseUp = () => {
    if (isSelectingSeats) {
      if (selectionRect) {
        const { x, y, width: rectWidth, height: rectHeight } = selectionRect;
        if (rectWidth > 0 && rectHeight > 0) {
          const seatIds = visibleSeats
            .filter(
              (seat) =>
                seat.x >= x &&
                seat.x <= x + rectWidth &&
                seat.y >= y &&
                seat.y <= y + rectHeight
            )
            .map((seat) => seat.seatId);

          if (seatIds.length > 0) {
            onSelectionModeChange?.("multi");
            onSelectionComplete?.(seatIds);
          }
        }
      }

      scheduleFrameUpdate(() => {
        setIsSelectingSeats(false);
        setSelectionStart(null);
        setSelectionCurrent(null);
      });
      return;
    }

    scheduleFrameUpdate(() => {
      setIsPanning(false);
    });
  };

  return (
    <div className={cn("h-full w-full", styles.canvasShell)}>
      <div className={styles.canvasInner}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className={cn(styles.canvasSvg, dragState && styles.dragging)}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          role="application"
          aria-label="Stadium layout editor canvas"
        >
          <defs>
            <pattern id="layout-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" strokeWidth={0.8} />
            </pattern>
            <filter id="layout-selected-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22d3ee" floodOpacity="0.7" />
            </filter>
          </defs>

          <rect x={0} y={0} width={width} height={height} fill="#0b1220" />
          <rect x={0} y={0} width={width} height={height} fill="url(#layout-grid-pattern)" />

          <g
            className={styles.canvasGroup}
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          >
            {field && <FieldLandmark field={field} />}
            {shouldRenderRows &&
              visibleRows.map((row) => (
                <path
                  key={row.id}
                  d={describeRowArc(row)}
                  fill="none"
                  stroke="#42526b"
                  strokeWidth={1}
                  opacity={0.55}
                />
              ))}
            {shouldRenderRows &&
              visibleRows.map((row) => {
                const labelPos = getRowLabelPosition(row);
                return (
                  <text
                    key={`${row.id}-label`}
                    x={labelPos.x}
                    y={labelPos.y}
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {row.rowLabel}
                  </text>
                );
              })}
            {shouldRenderSeatPreview && (
              <SeatRenderer
                seats={visibleSeats}
                showSeatNumbers={shouldShowSeatNumbers}
                selectedSeatIds={selectedSeatIds}
                onSeatClick={onSeatClick}
                currency={currency}
              />
            )}
            {selectionRect && (
              <rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="#22d3ee"
                fillOpacity={0.15}
                stroke="#22d3ee"
                strokeDasharray="4 4"
                strokeWidth={1}
                pointerEvents="none"
              />
            )}
            {shouldShowSeatLimitMessage && (
              <text
                x={24}
                y={24}
                fill="#94a3b8"
                fontSize="12"
                fontWeight="600"
              >
                Seat preview disabled above 20,000 seats.
              </text>
            )}
            {visibleSections.map((section) => (
              <SectionShape
                key={section.id}
                section={section}
                isSelected={selectedSectionId === section.id}
                isHovered={hoveredSectionId === section.id}
                onMouseDown={handleSectionMouseDown}
                onClick={handleSectionClick}
                onMouseEnter={setHoveredSectionId}
                onMouseLeave={() => setHoveredSectionId(null)}
                onDoubleClick={handleSectionDoubleClick}
              />
            ))}
            {visibleSections.map((section) => {
              const label = sectionLabelPositions.get(section.id);
              const { width, height } = getSectionBounds(section);
              const fallbackX = section.x + width / 2;
              const fallbackY = section.y + height / 2 - 12;
              const textX = label?.x ?? fallbackX;
              const textY = label?.y ?? fallbackY;

              return (
                <g key={`label-${section.id}`} className="pointer-events-none">
                  <text
                    x={textX}
                    y={textY}
                    fill="#f1f5f9"
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {section.id}
                  </text>
                  <text
                    x={textX}
                    y={textY + 12}
                    fill="#cbd5f5"
                    fontSize="9"
                    fontWeight="500"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {section.seatCount} seats
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
