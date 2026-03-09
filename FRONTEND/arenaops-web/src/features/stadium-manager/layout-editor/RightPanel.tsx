"use client";

import React from "react";
import type {
  LayoutSection,
  LayoutSavePayload,
  LayoutSettings,
  LayoutSeat,
  SeatType,
} from "./types";
import { SEAT_TYPE_COLORS, SEAT_TYPES } from "./utils/seatTypeColors";

interface RightPanelProps {
  section: LayoutSection | null;
  savedPayload: LayoutSavePayload | null;
  onUpdateSection: (sectionId: string, patch: Partial<LayoutSection>) => void;
  onSave: () => void;
  layoutSettings: LayoutSettings;
  onLayoutSettingChange: <K extends keyof LayoutSettings>(
    key: K,
    value: LayoutSettings[K]
  ) => void;
  pricing: LayoutSettings["pricing"];
  currency: string;
  onUpdatePricing: (seatType: LayoutSeat["type"], value: number) => void;
  onUpdateCurrency: (value: string) => void;
  onSaveDraft: () => void;
  onRestoreDraft: () => void;
  onDeleteDraft: () => void;
  onPublish: () => void;
  onPageLayout: () => void;
  onExportJson: () => void;
  onCopyJson: () => void;
  isProcessing: boolean;
  draftSavedAt?: string | null;
  publishedAt?: string | null;
  seatStats: {
    totalSections: number;
    rowsPerSection: number;
    seatsPerRow: number;
    totalSeats: number;
    byType: Record<SeatType, number>;
  };
  seatDensityMode: "rows" | "rows+seats" | "seats";
  onSeatDensityChange: (mode: "rows" | "rows+seats" | "seats") => void;
  onResetView: () => void;
  showSeatNumbers: boolean;
  onShowSeatNumbersChange: (value: boolean) => void;
  onUpdateSeatType: (sectionId: string, seatType: LayoutSection["seatType"]) => void;
  onUpdateSeatOverride: (sectionId: string, overrideSeatType: boolean) => void;
  selectedSeatIds: Set<string>;
  selectionMode: "single" | "multi";
  onSelectionModeChange: (mode: "single" | "multi") => void;
  onBulkSeatTypeChange: (seatType: LayoutSeat["type"]) => void;
  onDisableSelectedSeats: () => void;
  onEnableSelectedSeats: () => void;
  onClearSeatSelection: () => void;
  actionMessage?: string | null;
}

type NumericLayoutSettingsKeys = {
  [K in keyof LayoutSettings]: LayoutSettings[K] extends number ? K : never
}[keyof LayoutSettings];

export function RightPanel({
  section,
  savedPayload,
  onUpdateSection,
  onSave,
  layoutSettings,
  onLayoutSettingChange,
  pricing,
  currency,
  onUpdatePricing,
  onUpdateCurrency,
  onSaveDraft,
  onRestoreDraft,
  onDeleteDraft,
  onPublish,
  onPageLayout,
  onExportJson,
  onCopyJson,
  isProcessing,
  draftSavedAt,
  publishedAt,
  seatStats,
  seatDensityMode,
  onSeatDensityChange,
  onResetView,
  showSeatNumbers,
  onShowSeatNumbersChange,
  onUpdateSeatType,
  onUpdateSeatOverride,
  selectedSeatIds,
  selectionMode,
  onSelectionModeChange,
  onBulkSeatTypeChange,
  onDisableSelectedSeats,
  onEnableSelectedSeats,
  onClearSeatSelection,
  actionMessage,
}: RightPanelProps) {
  const updateNumberField = (field: keyof LayoutSection, value: string) => {
    if (!section) {
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    onUpdateSection(section.id, { [field]: parsed });
  };

  const updateLayoutField = <K extends NumericLayoutSettingsKeys>(
  field: K,
  value: string
) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return;

  onLayoutSettingChange(field, parsed);
};

  const seatTypeOptions: LayoutSeat["type"][] = SEAT_TYPES;
  const selectedSeatCount = selectedSeatIds.size;
  const outputJson = savedPayload ? JSON.stringify(savedPayload, null, 2) : "";
  const revenueByType = seatTypeOptions.reduce((acc, seatType) => {
    acc[seatType] = seatStats.byType[seatType] * pricing[seatType];
    return acc;
  }, {} as Record<LayoutSeat["type"], number>);
  const totalRevenue = seatTypeOptions.reduce((acc, seatType) => {
    return acc + revenueByType[seatType];
  }, 0);

  return (
    <aside className="h-full">
      <h3 className="text-lg font-semibold text-slate-900">Section Details</h3>
      {!section && (
        <p className="mt-3 text-sm text-slate-600">
          Select a section from the canvas to edit position and properties.
        </p>
      )}

      {section && (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Section ID</p>
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-900">
              {section.id}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Shape</p>
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm capitalize text-slate-900">
              {section.type}
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">X Position</span>
            <input
              type="number"
              min={0}
              value={section.x}
              onChange={(event) => updateNumberField("x", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Y Position</span>
            <input
              type="number"
              min={0}
              value={section.y}
              onChange={(event) => updateNumberField("y", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Width</span>
            <input
              type="number"
              min={20}
              value={section.width}
              onChange={(event) => updateNumberField("width", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Height</span>
            <input
              type="number"
              min={20}
              value={section.height}
              onChange={(event) => updateNumberField("height", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Radius (circle)</span>
            <input
              type="number"
              min={10}
              value={section.radius}
              onChange={(event) => updateNumberField("radius", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Rotation</span>
            <input
              type="number"
              value={section.rotation}
              onChange={(event) => updateNumberField("rotation", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Seat Count</span>
            <input
              type="number"
              min={0}
              value={section.seatCount}
              onChange={(event) => updateNumberField("seatCount", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={section.overrideSeatType}
              onChange={(event) => onUpdateSeatOverride(section.id, event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Override seat type for this section
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Seat Type</span>
            <select
              value={section.seatType}
              onChange={(event) => onUpdateSeatType(section.id, event.target.value as LayoutSection["seatType"])}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {seatTypeOptions.map((seatType) => (
                <option key={seatType} value={seatType} style={{ color: SEAT_TYPE_COLORS[seatType] }}>
                  {seatType.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Selection Mode
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onSelectionModeChange("single")}
          className={`flex-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
            selectionMode === "single"
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 text-slate-600 hover:border-emerald-400"
          }`}
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => onSelectionModeChange("multi")}
          className={`flex-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
            selectionMode === "multi"
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 text-slate-600 hover:border-emerald-400"
          }`}
        >
          Multi
        </button>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Multi mode enables drag selection inside the focused section.
      </p>
    </div>

    {selectedSeatCount > 0 && (
      <div className="mt-4 space-y-3 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Selected Seats ({selectedSeatCount})
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
          {seatTypeOptions.map((seatType) => (
            <button
              key={seatType}
              type="button"
              onClick={() => onBulkSeatTypeChange(seatType)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:border-emerald-400 hover:text-slate-800"
            >
              {seatType.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2 text-[11px] font-semibold">
          <button
            type="button"
            onClick={onDisableSelectedSeats}
            className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-slate-600 transition hover:border-red-400 hover:text-red-700"
          >
            Disable Seats
          </button>
          <button
            type="button"
            onClick={onEnableSelectedSeats}
            className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700"
          >
            Enable Seats
          </button>
        </div>
        <button
          type="button"
          onClick={onClearSeatSelection}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
        >
          Clear selection
        </button>
      </div>
    )}

      <div className="mt-6 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Layout Settings</h4>
        <div className="grid gap-2">
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-600">Total Sections</span>
            <input
              type="number"
              min={1}
              value={layoutSettings.totalSections}
              onChange={(event) => updateLayoutField("totalSections", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-600">Rows / Section</span>
            <input
              type="number"
              min={1}
              value={layoutSettings.rowsPerSection}
              onChange={(event) => updateLayoutField("rowsPerSection", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-600">Seats / Row</span>
            <input
              type="number"
              min={1}
              value={layoutSettings.seatsPerRow}
              onChange={(event) => updateLayoutField("seatsPerRow", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-600">Aisle Every</span>
            <input
              type="number"
              min={0}
              value={layoutSettings.aisleEvery}
              onChange={(event) => updateLayoutField("aisleEvery", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-600">Seat Spacing</span>
            <input
              type="number"
              step="0.05"
              min={0}
              value={layoutSettings.seatSpacing}
              onChange={(event) => updateLayoutField("seatSpacing", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-600">Inner Radius</span>
            <input
              type="number"
              min={0}
              value={layoutSettings.innerRadius}
              onChange={(event) => updateLayoutField("innerRadius", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-600">Outer Radius</span>
            <input
              type="number"
              min={0}
              value={layoutSettings.outerRadius}
              onChange={(event) => updateLayoutField("outerRadius", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-600">Row Smoothness</span>
            <input
              type="number"
              step="0.05"
              min={0}
              max={1}
              value={layoutSettings.rowSmoothness}
              onChange={(event) => updateLayoutField("rowSmoothness", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Seat Pricing</h4>
        <div className="grid gap-2">
          {seatTypeOptions.map((seatType) => (
            <label key={seatType} className="block">
              <span className="text-[11px] font-semibold text-slate-600">
                {seatType.toUpperCase()} Price
              </span>
              <input
                type="number"
                min={0}
                value={pricing[seatType]}
                onChange={(event) => onUpdatePricing(seatType, Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-600">Currency</span>
            <input
              type="text"
              value={currency}
              onChange={(event) => onUpdateCurrency(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs uppercase"
            />
          </label>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Seat Summary
        </p>
        <div className="mt-2 space-y-1">
          <p>Sections: {seatStats.totalSections}</p>
          <p>Rows per section: {seatStats.rowsPerSection}</p>
          <p>Seats per row: {seatStats.seatsPerRow}</p>
          <p>Total seats: {seatStats.totalSeats}</p>
          <p>VIP: {seatStats.byType.vip}</p>
          <p>Premium: {seatStats.byType.premium}</p>
          <p>Standard: {seatStats.byType.standard}</p>
          <p>Economy: {seatStats.byType.economy}</p>
          <p>Accessible: {seatStats.byType.accessible}</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Revenue Estimate
        </p>
        <div className="mt-2 space-y-1">
          {seatTypeOptions.map((seatType) => (
            <p key={seatType}>
              {seatType.toUpperCase()}: {seatStats.byType[seatType]} × {currency}{" "}
              {pricing[seatType]} = {currency} {revenueByType[seatType]}
            </p>
          ))}
          <p className="mt-2 font-semibold text-slate-800">
            Total Potential Revenue = {currency} {totalRevenue}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Legend</p>
        <div className="mt-2 space-y-1">
          {SEAT_TYPES.map((seatType) => (
            <div key={seatType} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: SEAT_TYPE_COLORS[seatType] }}
              />
              {seatType.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Seat Density
        </p>
        <div className="grid gap-2">
          {(["rows", "rows+seats", "seats"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSeatDensityChange(mode)}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                seatDensityMode === mode
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-emerald-400"
              }`}
            >
              {mode === "rows" ? "Rows only" : mode === "seats" ? "Seats only" : "Rows + Seats"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onShowSeatNumbersChange(!showSeatNumbers)}
          className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
            showSeatNumbers
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 text-slate-600 hover:border-emerald-400"
          }`}
        >
          {showSeatNumbers ? "Hide Seat Numbers" : "Show Seat Numbers (zoom > 2)"}
        </button>
      </div>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isProcessing}
          className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          Save Layout
        </button>
        <button
          type="button"
          onClick={onResetView}
          disabled={isProcessing}
          className="inline-flex w-full items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400"
        >
          Reset View
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isProcessing}
          className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={onRestoreDraft}
          disabled={isProcessing}
          className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
        >
          Restore Draft
        </button>
        <button
          type="button"
          onClick={onDeleteDraft}
          disabled={isProcessing}
          className="inline-flex w-full items-center justify-center rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:border-red-400"
        >
          Delete Draft
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={isProcessing}
          className="inline-flex w-full items-center justify-center rounded-md border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-500/20"
        >
          Publish Layout
        </button>
        <button
          type="button"
          onClick={onExportJson}
          disabled={isProcessing}
          className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={onPageLayout}
          disabled={isProcessing}
          className="inline-flex w-full items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:border-slate-400"
        >
          Page Layout
        </button>
      </div>
      {(draftSavedAt || publishedAt) && (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {draftSavedAt && <p>Draft saved: {draftSavedAt}</p>}
          {publishedAt && <p>Published: {publishedAt}</p>}
        </div>
      )}
      {actionMessage && (
        <p className="mt-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          {actionMessage}
        </p>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Saved JSON</p>
          <button
            type="button"
            onClick={onCopyJson}
            disabled={!outputJson || isProcessing}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Copy JSON
          </button>
        </div>
        <pre className="mt-2 max-h-[260px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs font-mono text-slate-100">
          {outputJson || "Click \"Save Layout\" to generate payload."}
        </pre>
      </div>
    </aside>
  );
}
