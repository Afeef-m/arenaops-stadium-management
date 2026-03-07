"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildGeneratedStadiumLayout,
  buildSavePayload,
  getGeneratorMathSnapshot,
} from "./geometry";
import type {
  GeneratedStadiumLayout,
  GeneratorLayoutType,
  StadiumGeneratorConfig,
  StadiumSavePayload,
} from "./types";

const DEFAULT_STADIUM_ID = "stadium-generated-001";

const DEFAULT_CONFIG: StadiumGeneratorConfig = {
  totalSections: 10,
  rowsPerSection: 8,
  seatsPerRow: 18,
  seatSpacing: 1,
  innerRadius: 130,
  outerRadius: 280,
};

interface UseStadiumGeneratorResult {
  stadiumId: string;
  layoutType: GeneratorLayoutType;
  config: StadiumGeneratorConfig;
  generatedLayout: GeneratedStadiumLayout;
  savedPayload: StadiumSavePayload | null;
  setStadiumId: (value: string) => void;
  setLayoutType: (value: GeneratorLayoutType) => void;
  updateConfig: <K extends keyof StadiumGeneratorConfig>(
    key: K,
    value: StadiumGeneratorConfig[K]
  ) => void;
  generateLayout: () => void;
  saveLayout: () => void;
  mathSnapshot: ReturnType<typeof getGeneratorMathSnapshot>;
}

export const useStadiumGenerator = (): UseStadiumGeneratorResult => {
  const [stadiumId, setStadiumId] = useState(DEFAULT_STADIUM_ID);
  const [layoutType, setLayoutType] = useState<GeneratorLayoutType>("circle");
  const [config, setConfig] = useState<StadiumGeneratorConfig>(DEFAULT_CONFIG);
  const [generatedLayout, setGeneratedLayout] = useState<GeneratedStadiumLayout>(() =>
    buildGeneratedStadiumLayout({
      stadiumId: DEFAULT_STADIUM_ID,
      layoutType: "circle",
      config: DEFAULT_CONFIG,
    })
  );
  const [savedPayload, setSavedPayload] = useState<StadiumSavePayload | null>(null);

  const updateConfig = useCallback(
    <K extends keyof StadiumGeneratorConfig>(
      key: K,
      value: StadiumGeneratorConfig[K]
    ) => {
      setConfig((current) => ({
        ...current,
        [key]: value,
      }));
    },
    []
  );

  const generateLayout = useCallback(() => {
    const nextLayout = buildGeneratedStadiumLayout({
      stadiumId,
      layoutType,
      config,
    });
    setGeneratedLayout(nextLayout);
  }, [stadiumId, layoutType, config]);

  const saveLayout = useCallback(() => {
    const payload = buildSavePayload(generatedLayout);
    setSavedPayload(payload);
    console.log("Generated stadium payload:", payload);
  }, [generatedLayout]);

  const mathSnapshot = useMemo(() => getGeneratorMathSnapshot(config), [config]);

  return {
    stadiumId,
    layoutType,
    config,
    generatedLayout,
    savedPayload,
    setStadiumId,
    setLayoutType,
    updateConfig,
    generateLayout,
    saveLayout,
    mathSnapshot,
  };
};
