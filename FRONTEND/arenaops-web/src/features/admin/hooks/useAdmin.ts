import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminDashboardService, userManagementService } from "../api/adminService";
import type {
  ActivityFilterRequest,
  UserFilterRequest,
  BulkActionRequest,
} from "../types/admin.types";

// Dashboard Hooks
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminDashboardService.getDashboardMetrics(),
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000,
  });
}

export function useQuickStats() {
  return useQuery({
    queryKey: ["admin", "quick-stats"],
    queryFn: () => adminDashboardService.getQuickStats(),
    staleTime: 30_000, // 30 seconds
    refetchInterval: 30_000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: () => adminDashboardService.getSystemHealth(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useRecentActivities(count: number = 20) {
  return useQuery({
    queryKey: ["admin", "activities", "recent", count],
    queryFn: () => adminDashboardService.getRecentActivities(count),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useActivities(filter: ActivityFilterRequest) {
  return useQuery({
    queryKey: ["admin", "activities", filter],
    queryFn: () => adminDashboardService.getActivities(filter),
    staleTime: 30_000,
  });
}

// Stadium Approval Hooks
export function usePendingStadiums() {
  return useQuery({
    queryKey: ["admin", "stadiums", "pending"],
    queryFn: () => adminDashboardService.getPendingStadiums(),
    staleTime: 30_000,
  });
}

export function useApproveStadium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stadiumId: string) => adminDashboardService.approveStadium(stadiumId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stadiums"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useRejectStadium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stadiumId, reason }: { stadiumId: string; reason: string }) =>
      adminDashboardService.rejectStadium(stadiumId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stadiums"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// User Management Hooks
export function useUsers(filter: UserFilterRequest) {
  return useQuery({
    queryKey: ["admin", "users", filter],
    queryFn: () => userManagementService.getUsers(filter),
    staleTime: 30_000,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => userManagementService.getUserById(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ["admin", "users", "stats"],
    queryFn: () => userManagementService.getUserStats(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => userManagementService.getRoles(),
    staleTime: 300_000, // 5 minutes
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      userManagementService.updateUserRoles(userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      userManagementService.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userManagementService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useBulkUserAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkActionRequest) => userManagementService.bulkAction(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
