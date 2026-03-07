"use client";

import React from "react";
import { SeatMapRenderer } from "@/components/seat-map/SeatMapRenderer";
import styles from "./StadiumGenerator.module.scss";
import type { GeneratedStadiumLayout } from "./types";

interface SVGPreviewProps {
  layout: GeneratedStadiumLayout;
}

export function SVGPreview({ layout }: SVGPreviewProps) {
  const uniqueRows = React.useMemo(() => {
    const seen = new Set<number>();
    const rows = [];

    for (const row of layout.rows) {
      if (seen.has(row.rowIndex)) {
        continue;
      }
      seen.add(row.rowIndex);
      rows.push(row);
    }

    return rows;
  }, [layout.rows]);

  return (
    <div className={`${styles.generatorCard} ${styles.previewShell}`}>
      <SeatMapRenderer
        sections={layout.sections}
        landmarks={layout.landmarks}
        width="100%"
        height="100%"
        viewBox={layout.viewBox}
        className={styles.baseRenderer}
      />

      <svg
        className={styles.overlaySvg}
        viewBox={layout.viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <g>
          {uniqueRows.map((row) => (
            layout.type === "oval" ? (
              <ellipse
                key={row.rowId}
                cx={layout.centerX}
                cy={layout.centerY}
                rx={row.radiusX}
                ry={row.radiusY}
                className={styles.rowGuide}
              />
            ) : (
              <circle
                key={row.rowId}
                cx={layout.centerX}
                cy={layout.centerY}
                r={row.radius}
                className={styles.rowGuide}
              />
            )
          ))}
        </g>

        <g>
          {layout.seats.map((seat) => (
            <circle
              key={seat.seatId}
              cx={seat.posX}
              cy={seat.posY}
              r={2.25}
              className={styles.seatDot}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
