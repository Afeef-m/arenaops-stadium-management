import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../api/dashboardService";

export function useManagerDashboard() {
  return useQuery({
    queryKey: ["manager-dashboard-metrics"],
    queryFn: () => dashboardService.getManagerDashboardMetrics(),
    staleTime: 30_000,
    retry: 1,
  });
}

