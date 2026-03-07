import type { SeatType } from "../types";

export const SEAT_TYPE_COLORS = {
  vip: "#FFD700",
  premium: "#4F9CF9",
  standard: "#34C759",
  economy: "#8E8E93",
  accessible: "#AF52DE",
} as const satisfies Record<SeatType, string>;

export const SEAT_TYPES = Object.keys(SEAT_TYPE_COLORS) as SeatType[];
