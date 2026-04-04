"use client";

import type { MouseEvent, WheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import type { FieldConfig, Landmark, Section } from "@/services/stadiumViewService";
import { GeometryType, LandmarkType, SeatType } from "@/services/stadiumViewService";

interface HoverPayload {
  sectionId: string | null;
  position: { x: number; y: number } | null;
  world: { x: number; y: number } | null;
  section: Section | null;
}

interface StadiumCanvasProps {
  sections: Section[];
  landmarks: Landmark[];
  fieldConfig?: FieldConfig;
  className?: string;
  onHoverChange?: (payload: HoverPayload) => void;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
}

const seatTypeFallbackColors: Record<SeatType, string> = {
  [SeatType.Vip]: "#FFD700",
  [SeatType.Premium]: "#A78BFA",
  [SeatType.Standard]: "#60A5FA",
  [SeatType.Economy]: "#34D399",
  [SeatType.Accessible]: "#F97316",
};

const landmarkColors: Record<LandmarkType, string> = {
  [LandmarkType.Stage]: "#F59E0B",
  [LandmarkType.Gate]: "#38BDF8",
  [LandmarkType.Exit]: "#FB7185",
  [LandmarkType.Restroom]: "#A78BFA",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeAngle = (angle: number) => {
  const twoPi = Math.PI * 2;
  let result = angle % twoPi;
  if (result < 0) result += twoPi;
  return result;
};

const isAngleBetween = (angle: number, start: number, end: number) => {
  const a = normalizeAngle(angle);
  const s = normalizeAngle(start);
  const e = normalizeAngle(end);
  if (s <= e) return a >= s && a <= e;
  return a >= s || a <= e;
};

export function StadiumCanvas({
  sections,
  landmarks,
  fieldConfig,
  className,
  onHoverChange,
  minZoom = 0.5,
  maxZoom = 4,
  initialZoom = 1,
}: StadiumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const frameRef = useRef<number | null>(null);
  const dprRef = useRef<number>(1);

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(initialZoom);
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  const hoverRef = useRef<HoverPayload>({
    sectionId: null,
    position: null,
    world: null,
    section: null,
  });

  const requestRender = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      render();
    });
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nextDpr = window.devicePixelRatio || 1;
    dprRef.current = nextDpr;
    canvas.width = Math.max(1, Math.floor(rect.width * nextDpr));
    canvas.height = Math.max(1, Math.floor(rect.height * nextDpr));
    requestRender();
  }, [requestRender]);

  const worldFromScreen = useCallback((screenX: number, screenY: number) => {
    const { x: panX, y: panY } = panRef.current;
    const zoom = zoomRef.current;
    return {
      x: (screenX - panX) / zoom,
      y: (screenY - panY) / zoom,
    };
  }, []);

  const setHover = useCallback(
    (payload: HoverPayload) => {
      const prev = hoverRef.current;
      const same =
        prev.sectionId === payload.sectionId &&
        prev.position?.x === payload.position?.x &&
        prev.position?.y === payload.position?.y;
      if (!same) {
        hoverRef.current = payload;
        onHoverChange?.(payload);
        requestRender();
      }
    },
    [onHoverChange, requestRender]
  );

  const hitTest = useCallback(
    (worldX: number, worldY: number) => {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const dx = worldX - section.posX;
        const dy = worldY - section.posY;

        if (section.geometryType === GeometryType.Arc && section.geometry) {
          const { innerRadius, outerRadius, startAngle, endAngle } = section.geometry;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < innerRadius || distance > outerRadius) continue;
          const angle = Math.atan2(dy, dx);
          if (isAngleBetween(angle, startAngle, endAngle)) {
            return section;
          }
        }

        if (section.geometryType === GeometryType.Rectangle && section.geometry) {
          const { width, height } = section.geometry;
          if (Math.abs(dx) <= width / 2 && Math.abs(dy) <= height / 2) {
            return section;
          }
        }

        if (!section.geometryType) {
          if (Math.abs(dx) <= 25 && Math.abs(dy) <= 25) {
            return section;
          }
        }
      }
      return null;
    },
    [sections]
  );

  const drawField = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!fieldConfig?.field) return;
    const { field, stage, labels } = fieldConfig;

    ctx.save();
    ctx.translate(field.centerX, field.centerY);
    ctx.rotate(field.rotation);
    ctx.fillStyle = field.fillColor ?? "#0b3d2e";
    ctx.strokeStyle = field.strokeColor ?? "#1f2937";
    ctx.lineWidth = field.strokeWidth ?? 2;
    ctx.beginPath();
    ctx.rect(-field.width / 2, -field.height / 2, field.width, field.height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (stage?.enabled) {
      ctx.save();
      ctx.translate(stage.centerX, stage.centerY);
      ctx.rotate(stage.rotation);
      ctx.fillStyle = stage.fillColor ?? "#111827";
      ctx.fillRect(-stage.width / 2, -stage.height / 2, stage.width, stage.height);
      ctx.restore();
    }

    if (labels?.show && labels.fieldLabel) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels.fieldLabel, field.centerX, field.centerY);
      ctx.restore();
    }
  }, [fieldConfig]);

  const drawSections = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const hoveredId = hoverRef.current.sectionId;
      sections.forEach((section) => {
        const fillColor = section.color ?? (section.seatType ? seatTypeFallbackColors[section.seatType] : "#64748B");
        const isHovered = hoveredId === section.sectionId;

        if (section.geometryType === GeometryType.Arc && section.geometry) {
          const { innerRadius, outerRadius, startAngle, endAngle } = section.geometry;
          ctx.beginPath();
          ctx.arc(section.posX, section.posY, outerRadius, startAngle, endAngle);
          ctx.arc(section.posX, section.posY, innerRadius, endAngle, startAngle, true);
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.fill();
          if (isHovered) {
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          return;
        }

        if (section.geometryType === GeometryType.Rectangle && section.geometry) {
          const { width, height, rotation } = section.geometry;
          ctx.save();
          ctx.translate(section.posX, section.posY);
          ctx.rotate(rotation);
          ctx.fillStyle = fillColor;
          ctx.fillRect(-width / 2, -height / 2, width, height);
          if (isHovered) {
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 2;
            ctx.strokeRect(-width / 2, -height / 2, width, height);
          }
          ctx.restore();
          return;
        }

        ctx.save();
        ctx.translate(section.posX, section.posY);
        ctx.fillStyle = fillColor;
        ctx.fillRect(-25, -25, 50, 50);
        if (isHovered) {
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 2;
          ctx.strokeRect(-25, -25, 50, 50);
        }
        ctx.restore();
      });
    },
    [sections]
  );

  const drawLandmarks = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      landmarks.forEach((landmark) => {
        const color = landmarkColors[landmark.type] ?? "#94A3B8";
        ctx.save();
        ctx.translate(landmark.posX, landmark.posY);
        ctx.fillStyle = color;
        ctx.fillRect(-landmark.width / 2, -landmark.height / 2, landmark.width, landmark.height);
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-landmark.width / 2, -landmark.height / 2, landmark.width, landmark.height);
        ctx.restore();
      });
    },
    [landmarks]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = dprRef.current;
    const { x: panX, y: panY } = panRef.current;
    const zoom = zoomRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    drawField(ctx);
    drawSections(ctx);
    drawLandmarks(ctx);
  }, [drawField, drawSections, drawLandmarks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    contextRef.current = ctx;

    resizeCanvas();

    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [resizeCanvas]);

  useEffect(() => {
    requestRender();
  }, [sections, landmarks, fieldConfig, requestRender]);

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;

      if (isPanningRef.current && lastPointerRef.current) {
        const dx = screenX - lastPointerRef.current.x;
        const dy = screenY - lastPointerRef.current.y;
        panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
        lastPointerRef.current = { x: screenX, y: screenY };
        requestRender();
        return;
      }

      const world = worldFromScreen(screenX, screenY);
      const section = hitTest(world.x, world.y);
      setHover({
        sectionId: section?.sectionId ?? null,
        position: { x: screenX, y: screenY },
        world,
        section,
      });
    },
    [hitTest, requestRender, setHover, worldFromScreen]
  );

  const handleMouseLeave = useCallback(() => {
    setHover({ sectionId: null, position: null, world: null, section: null });
  }, [setHover]);

  const handleMouseDown = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    isPanningRef.current = true;
    lastPointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    lastPointerRef.current = null;
  }, []);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;

      const zoom = zoomRef.current;
      const zoomDelta = event.deltaY < 0 ? 1.1 : 0.9;
      const nextZoom = clamp(zoom * zoomDelta, minZoom, maxZoom);

      const world = worldFromScreen(screenX, screenY);
      panRef.current = {
        x: screenX - world.x * nextZoom,
        y: screenY - world.y * nextZoom,
      };
      zoomRef.current = nextZoom;
      requestRender();
    },
    [maxZoom, minZoom, requestRender, worldFromScreen]
  );

  const canvasProps = useMemo(
    () => ({
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseOut: handleMouseUp,
      onWheel: handleWheel,
    }),
    [handleMouseDown, handleMouseLeave, handleMouseMove, handleMouseUp, handleWheel]
  );

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" {...canvasProps} />
    </div>
  );
}

export default StadiumCanvas;
