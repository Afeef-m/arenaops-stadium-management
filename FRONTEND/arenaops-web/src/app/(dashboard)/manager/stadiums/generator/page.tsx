"use client";

import React from "react";
import {
  SVGPreview,
  useStadiumGenerator,
  type StadiumGeneratorConfig,
} from "@/features/stadium-manager/stadium-generator";
import styles from "@/features/stadium-manager/stadium-generator/StadiumGenerator.module.scss";

const numericConfigFields: Array<{
  key: keyof StadiumGeneratorConfig;
  label: string;
  min?: number;
  step?: number;
}> = [
  { key: "totalSections", label: "Total Sections", min: 2, step: 1 },
  { key: "rowsPerSection", label: "Rows / Section", min: 1, step: 1 },
  { key: "seatsPerRow", label: "Seats / Row", min: 1, step: 1 },
  { key: "seatSpacing", label: "Seat Spacing Factor", min: 0.35, step: 0.05 },
  { key: "innerRadius", label: "Inner Radius", min: 60, step: 1 },
  { key: "outerRadius", label: "Outer Radius", min: 80, step: 1 },
];

export default function StadiumGeneratorPage() {
  const {
    stadiumId,
    layoutType,
    config,
    generatedLayout,
    savedPayload,
    mathSnapshot,
    setStadiumId,
    setLayoutType,
    updateConfig,
    generateLayout,
    saveLayout,
  } = useStadiumGenerator();

  const handleNumberChange =
    (key: keyof StadiumGeneratorConfig) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = Number(event.target.value);
      if (Number.isNaN(parsed)) {
        return;
      }
      updateConfig(key, parsed);
    };

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Generated Structured Stadium Builder</h1>
        <p className="text-sm text-slate-600">
          Configure section/row/seat parameters and generate a fully structured stadium layout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className={`${styles.controlsCard} space-y-4 p-4`}>
          <div className="space-y-1">
            <h2 className={`${styles.panelTitle} text-lg font-semibold`}>Configuration</h2>
            <p className="text-xs text-slate-500">Set values, then click Generate Layout.</p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Stadium ID</span>
            <input
              type="text"
              value={stadiumId}
              onChange={(event) => setStadiumId(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Layout Type</span>
            <select
              value={layoutType}
              onChange={(event) => setLayoutType(event.target.value as "circle" | "oval")}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="circle">Circle</option>
              <option value="oval">Oval</option>
            </select>
          </label>

          <div className="grid gap-3">
            {numericConfigFields.map((field) => (
              <label className="block" key={field.key}>
                <span className="text-sm font-medium text-slate-700">{field.label}</span>
                <input
                  type="number"
                  min={field.min}
                  step={field.step ?? 1}
                  value={config[field.key]}
                  onChange={handleNumberChange(field.key)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={generateLayout}
              className="rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              Generate Layout
            </button>
            <button
              type="button"
              onClick={saveLayout}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Save
            </button>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Live Math Snapshot</p>
            <p className="mt-1">anglePerSection = {mathSnapshot.anglePerSection} degrees</p>
            <p>radiusStep = {mathSnapshot.radiusStep}</p>
            <p>seatAngleStep = {mathSnapshot.seatAngleStep} degrees</p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Generated Counts</p>
            <p className="mt-1">Sections: {generatedLayout.sections.length}</p>
            <p>Rows: {generatedLayout.rows.length}</p>
            <p>Seats: {generatedLayout.seats.length}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Saved JSON Payload
            </p>
            <pre className="mt-2 max-h-56 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
              {savedPayload ? JSON.stringify(savedPayload, null, 2) : "Click Save to log JSON payload."}
            </pre>
          </div>
        </aside>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">SVG Preview</h2>
          <SVGPreview layout={generatedLayout} />
        </section>
      </div>
    </div>
  );
}
