"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Point, CanvasState } from "../types";

export interface UseCanvasOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomSpeed?: number;
}

export interface UseCanvasReturn extends CanvasState {
  // Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (zoom: number) => void;
  zoomToFit: () => void;
  zoomTo: (zoom: number, center?: Point) => void;

  // Pan
  setPan: (pan: Point) => void;
  panTo: (point: Point) => void;
  resetView: () => void;

  // Transform
  getTransform: () => string;
  clientToCanvas: (clientX: number, clientY: number, svgElement: SVGSVGElement) => Point;

  // Refs for performance
  zoomRef: React.MutableRefObject<number>;
  panRef: React.MutableRefObject<Point>;
}

const DEFAULT_CANVAS_WIDTH = 1400;
const DEFAULT_CANVAS_HEIGHT = 900;
const DEFAULT_MIN_ZOOM = 0.3;
const DEFAULT_MAX_ZOOM = 5.0;
const DEFAULT_ZOOM_SPEED = 0.1;

/**
 * Custom hook for managing canvas zoom and pan state
 * Provides smooth zoom/pan interactions for SVG-based stadium builder
 */
export function useCanvas(options: UseCanvasOptions = {}): UseCanvasReturn {
  const {
    canvasWidth = DEFAULT_CANVAS_WIDTH,
    canvasHeight = DEFAULT_CANVAS_HEIGHT,
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    zoomSpeed = DEFAULT_ZOOM_SPEED,
  } = options;

  // ============================================================================
  // State
  // ============================================================================

  const [zoom, setZoomState] = useState(1);
  const [pan, setPanState] = useState<Point>({ x: 0, y: 0 });

  // Refs for performance (avoid re-renders during drag)
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  // Keep refs in sync
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // ============================================================================
  // Zoom Controls
  // ============================================================================

  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
    setZoomState(clampedZoom);
  }, [minZoom, maxZoom]);

  const zoomIn = useCallback(() => {
    setZoom(zoom * (1 + zoomSpeed));
  }, [zoom, zoomSpeed, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoom * (1 - zoomSpeed));
  }, [zoom, zoomSpeed, setZoom]);

  const zoomToFit = useCallback(() => {
    setZoomState(1);
    setPanState({ x: 0, y: 0 });
  }, []);

  const zoomTo = useCallback((newZoom: number, center?: Point) => {
    const clampedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);

    if (center) {
      // Zoom towards a specific point
      const zoomDelta = clampedZoom - zoom;
      const newPan = {
        x: pan.x - (center.x - canvasWidth / 2) * zoomDelta,
        y: pan.y - (center.y - canvasHeight / 2) * zoomDelta,
      };
      setPanState(newPan);
    }

    setZoomState(clampedZoom);
  }, [zoom, pan, canvasWidth, canvasHeight, minZoom, maxZoom]);

  // ============================================================================
  // Pan Controls
  // ============================================================================

  const setPan = useCallback((newPan: Point) => {
    setPanState(newPan);
  }, []);

  const panTo = useCallback((point: Point) => {
    const newPan = {
      x: canvasWidth / 2 - point.x * zoom,
      y: canvasHeight / 2 - point.y * zoom,
    };
    setPanState(newPan);
  }, [zoom, canvasWidth, canvasHeight]);

  const resetView = useCallback(() => {
    setZoomState(1);
    setPanState({ x: 0, y: 0 });
  }, []);

  // ============================================================================
  // Transform Utilities
  // ============================================================================

  const getTransform = useCallback(() => {
    return `translate(${pan.x}, ${pan.y}) scale(${zoom})`;
  }, [pan, zoom]);

  const clientToCanvas = useCallback((
    clientX: number,
    clientY: number,
    svgElement: SVGSVGElement
  ): Point => {
    const ctm = svgElement.getScreenCTM();
    if (!ctm) {
      return { x: clientX, y: clientY };
    }

    const inverse = ctm.inverse();
    const point = svgElement.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    const transformedPoint = point.matrixTransform(inverse);

    return {
      x: transformedPoint.x,
      y: transformedPoint.y,
    };
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    zoom,
    pan,
    canvasWidth,
    canvasHeight,

    // Zoom
    zoomIn,
    zoomOut,
    setZoom,
    zoomToFit,
    zoomTo,

    // Pan
    setPan,
    panTo,
    resetView,

    // Transform
    getTransform,
    clientToCanvas,

    // Refs
    zoomRef,
    panRef,
  };
}
