import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../api/dashboardService";

export function useRecentBookings(limit: number = 5) {
  return useQuery({
    queryKey: ["manager-dashboard-recent-bookings", { limit }],
    queryFn: () => dashboardService.getRecentBookings(limit),
    staleTime: 15_000,
    retry: 1,
  });
}

