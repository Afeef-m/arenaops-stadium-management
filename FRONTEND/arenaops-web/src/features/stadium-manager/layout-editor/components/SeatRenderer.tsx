"use client";

"use client";

import React from "react";
import type { LayoutSeat } from "../types";
import { SEAT_TYPE_COLORS } from "../utils/seatTypeColors";

const SELECTED_SEAT_COLORS: Record<LayoutSeat["type"], string> = {
  vip: "#fff7c0",
  premium: "#dbeafe",
  standard: "#dcfce7",
  economy: "#e0e7ff",
  accessible: "#f5f3ff",
};

const DISABLED_SEAT_COLOR = "#0f172a";
const DISABLED_CROSS_COLOR = "#94a3b8";

type SeatRendererProps = {
  seats: LayoutSeat[];
  showSeatNumbers?: boolean;
  selectedSeatIds?: Set<string>;
  onSeatClick?: (seat: LayoutSeat, event: React.MouseEvent<SVGCircleElement>) => void;
  currency?: string;
};

export function SeatRenderer({
  seats,
  showSeatNumbers = false,
  selectedSeatIds,
  onSeatClick,
  currency = "USD",
}: SeatRendererProps) {
  return (
    <g>
      {seats.map((seat) => {
        const isSelected = selectedSeatIds?.has(seat.seatId) ?? false;
        const seatColor = seat.disabled
          ? DISABLED_SEAT_COLOR
          : isSelected
            ? SELECTED_SEAT_COLORS[seat.type]
            : SEAT_TYPE_COLORS[seat.type];
        const strokeColor = seat.disabled ? DISABLED_CROSS_COLOR : isSelected ? "#0f172a" : "#0f172a";
        const strokeWidth = isSelected ? 1.4 : 0.6;

        const handleClick = (event: React.MouseEvent<SVGCircleElement>) => {
          event.stopPropagation();
          onSeatClick?.(seat, event);
        };

        return (
          <g key={seat.seatId}>
            <circle
              cx={seat.x}
              cy={seat.y}
              r={3}
              fill={seatColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={seat.disabled ? 0.8 : 0.95}
              pointerEvents="auto"
              onClick={handleClick}
            />
            <title>{`Seat: ${seat.seatId}\nType: ${seat.type}\nPrice: ${currency} ${seat.price}`}</title>
            {seat.disabled && (
              <>
                <line
                  x1={seat.x - 2}
                  y1={seat.y - 2}
                  x2={seat.x + 2}
                  y2={seat.y + 2}
                  stroke={DISABLED_CROSS_COLOR}
                  strokeWidth={0.8}
                  pointerEvents="none"
                />
                <line
                  x1={seat.x - 2}
                  y1={seat.y + 2}
                  x2={seat.x + 2}
                  y2={seat.y - 2}
                  stroke={DISABLED_CROSS_COLOR}
                  strokeWidth={0.8}
                  pointerEvents="none"
                />
              </>
            )}
            {showSeatNumbers && (
              <text
                x={seat.x}
                y={seat.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="6"
                fontWeight="600"
                fill="#e2e8f0"
                pointerEvents="none"
              >
                {seat.seatNumber}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
