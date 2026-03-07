"use client";

import React from "react";
import { LayoutType } from "./types";

type LayoutTypeSidebarProps = {
  layoutType: LayoutType;
  onSelectLayoutType: (type: LayoutType) => void;
};

const layoutButtons: Array<{ label: string; type: LayoutType }> = [
  { label: "Circle", type: "circle" },
  { label: "Oval", type: "oval" },
  { label: "Custom", type: "custom" },
];

export function LayoutTypeSidebar({
  layoutType,
  onSelectLayoutType,
}: LayoutTypeSidebarProps) {
  return (
    <aside className="h-full p-4">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Layout Types</h3>
      <p className="mb-4 text-xs text-slate-500">Pick a base stadium shape.</p>
      <div className="space-y-2">
        {layoutButtons.map((button) => (
          <button
            key={button.type}
            type="button"
            onClick={() => onSelectLayoutType(button.type)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
              layoutType === button.type
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-inner"
                : "border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/40"
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
