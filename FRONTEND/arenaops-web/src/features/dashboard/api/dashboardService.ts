import { api } from "@/services/axios";
import type {
  ApiEnvelope,
  ManagerDashboardMetrics,
  RecentBooking,
  RecentBookingStatus,
} from "../types/dashboard.types";

type UnknownRecord = Record<string, unknown>;

function toNumber(value: unknown, fieldName: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  throw new Error(`Invalid dashboard metric '${fieldName}'`);
}

function normalizeMetrics(payload: unknown): ManagerDashboardMetrics {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid dashboard metrics payload");
  }

  const obj = payload as UnknownRecord;

  return {
    totalStadiums: toNumber(obj.totalStadiums, "totalStadiums"),
    todaysBookings: toNumber(obj.todaysBookings, "todaysBookings"),
    totalUsers: toNumber(obj.totalUsers, "totalUsers"),
    ticketsSold: toNumber(obj.ticketsSold, "ticketsSold"),
  };
}

function toString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return fallback;
}

function normalizeBookingStatus(value: unknown): RecentBookingStatus {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "confirmed") return "confirmed";
    if (lower === "pending") return "pending";
    if (lower === "cancelled" || lower === "canceled") return "cancelled";

    // Backend booking enums often look like: PendingPayment | Confirmed | Cancelled | Expired | Failed
    if (lower.includes("confirm")) return "confirmed";
    if (lower.includes("pending")) return "pending";
    if (lower.includes("cancel")) return "cancelled";
  }

  return "pending";
}

function normalizeRecentBooking(payload: unknown): RecentBooking {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid booking payload");
  }

  const obj = payload as UnknownRecord;

  const id = toString(obj.id ?? obj.bookingId, "");
  if (!id) {
    throw new Error("Invalid booking id");
  }

  return {
    id,
    userName: toString(obj.userName ?? obj.userFullName ?? obj.userEmail, "Unknown"),
    eventName: toString(obj.eventName ?? obj.eventTitle ?? obj.event?.name, "Unknown event"),
    stadiumName: toString(obj.stadiumName ?? obj.stadium?.name, "Unknown stadium"),
    seats: toNumber(obj.seats ?? obj.seatCount ?? obj.totalSeats, "seats"),
    status: normalizeBookingStatus(obj.status),
    createdAt: toString(obj.createdAt ?? obj.createdOn, new Date().toISOString()),
  };
}

function normalizeRecentBookings(payload: unknown): RecentBooking[] {
  // API Response may be either:
  // - data: RecentBooking[]
  // - data: { items: RecentBooking[] }
  // - data: { data: RecentBooking[] } (double-wrapped)
  const root = payload as any;

  const candidate =
    Array.isArray(root) ? root : Array.isArray(root?.items) ? root.items : Array.isArray(root?.data) ? root.data : null;

  if (!candidate) {
    throw new Error("Invalid recent bookings payload");
  }

  return candidate.map(normalizeRecentBooking);
}

export const dashboardService = {
  async getManagerDashboardMetrics(): Promise<ManagerDashboardMetrics> {
    const response = await api.get<ApiEnvelope<unknown>>("/api/core/admin/dashboard");

    if (!response.data?.success) {
      const message =
        response.data?.error?.message ||
        response.data?.message ||
        "Failed to load dashboard metrics";
      throw new Error(message);
    }

    return normalizeMetrics(response.data.data);
  },

  async getRecentBookings(limit: number = 5): Promise<RecentBooking[]> {
    const pageSize = Math.max(1, Math.min(20, Math.floor(limit)));
    const response = await api.get<ApiEnvelope<unknown>>(
      `/api/core/admin/bookings?page=1&pageSize=${pageSize}`
    );

    if (!response.data?.success) {
      const message =
        response.data?.error?.message ||
        response.data?.message ||
        "Failed to load recent bookings";
      throw new Error(message);
    }

    return normalizeRecentBookings(response.data.data);
  },
};
