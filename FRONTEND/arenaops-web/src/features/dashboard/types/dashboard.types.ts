export type ManagerDashboardMetrics = {
  totalStadiums: number;
  todaysBookings: number;
  totalUsers: number;
  ticketsSold: number;
};

export type RecentBookingStatus = "confirmed" | "pending" | "cancelled";

export type RecentBooking = {
  id: string;
  userName: string;
  eventName: string;
  stadiumName: string;
  seats: number;
  status: RecentBookingStatus;
  createdAt: string;
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
  error: ApiError | null;
  pagination?: { page: number; pageSize: number; totalCount: number };
};
