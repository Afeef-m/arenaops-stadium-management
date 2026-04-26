import { api } from "@/services/axios";
import type {
  ApiEnvelope,
  AdminDashboardMetrics,
  QuickStats,
  SystemHealth,
  AdminActivity,
  PaginatedResult,
  ActivityFilterRequest,
  UserListItem,
  UserDetail,
  UserFilterRequest,
  UserStats,
  BulkActionRequest,
  BulkActionResult,
  PendingStadium,
  EventListItem,
  UpdateEventStatusRequest,
} from "../types/admin.types";

// Admin Dashboard API
export const adminDashboardService = {
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const response = await api.get<ApiEnvelope<AdminDashboardMetrics>>(
      "/core/admin/dashboard"
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || "Failed to load dashboard metrics");
    }

    return response.data.data;
  },

  async getQuickStats(): Promise<QuickStats> {
    const response = await api.get<ApiEnvelope<QuickStats>>(
      "/core/admin/dashboard/quick-stats"
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || "Failed to load quick stats");
    }

    return response.data.data;
  },

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get<ApiEnvelope<SystemHealth>>(
      "/core/admin/system/health"
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || "Failed to load system health");
    }

    return response.data.data;
  },

  async getRecentActivities(count: number = 20): Promise<AdminActivity[]> {
    const response = await api.get<ApiEnvelope<AdminActivity[]>>(
      `/core/admin/activities/recent?count=${count}`
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || "Failed to load recent activities");
    }

    return response.data.data;
  },

  async getActivities(filter: ActivityFilterRequest): Promise<PaginatedResult<AdminActivity>> {
    const params = new URLSearchParams();
    if (filter.activityType) params.append("activityType", filter.activityType);
    if (filter.startDate) params.append("startDate", filter.startDate);
    if (filter.endDate) params.append("endDate", filter.endDate);
    if (filter.page) params.append("page", filter.page.toString());
    if (filter.pageSize) params.append("pageSize", filter.pageSize.toString());

    const response = await api.get<ApiEnvelope<PaginatedResult<AdminActivity>>>(
      `/core/admin/activities?${params.toString()}`
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || "Failed to load activities");
    }

    return response.data.data;
  },

  // Stadium Approval
  async getPendingStadiums(): Promise<PendingStadium[]> {
    const response = await api.get<ApiEnvelope<PendingStadium[]>>(
      "/core/admin/stadiums"
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || "Failed to load pending stadiums");
    }

    return response.data.data;
  },

  async approveStadium(stadiumId: string): Promise<void> {
    const response = await api.post<ApiEnvelope<unknown>>(
      `/core/admin/stadiums/${stadiumId}/approve`
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || "Failed to approve stadium");
    }
  },

  async rejectStadium(stadiumId: string, reason: string): Promise<void> {
    const response = await api.post<ApiEnvelope<unknown>>(
      `/core/admin/stadiums/${stadiumId}/reject`,
      { reason }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || "Failed to reject stadium");
    }
  },
};

// User Management API
export const userManagementService = {
  async getUsers(filter: UserFilterRequest): Promise<PaginatedResult<UserListItem>> {
    const params = new URLSearchParams();
    if (filter.search) params.append("search", filter.search);
    if (filter.role) params.append("role", filter.role);
    if (filter.isActive !== undefined) params.append("isActive", filter.isActive.toString());
    if (filter.createdFrom) params.append("createdFrom", filter.createdFrom);
    if (filter.createdTo) params.append("createdTo", filter.createdTo);
    if (filter.sortBy) params.append("sortBy", filter.sortBy);
    if (filter.sortDescending !== undefined) params.append("sortDescending", filter.sortDescending.toString());
    if (filter.page) params.append("page", filter.page.toString());
    if (filter.pageSize) params.append("pageSize", filter.pageSize.toString());

    const response = await api.get<{ success: boolean; data: PaginatedResult<UserListItem> }>(
      `/auth/users?${params.toString()}`
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error("Failed to load users");
    }

    return response.data.data;
  },

  async getUserById(userId: string): Promise<UserDetail> {
    const response = await api.get<{ success: boolean; data: UserDetail }>(
      `/auth/users/${userId}`
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error("Failed to load user");
    }

    return response.data.data;
  },

  async getUserStats(): Promise<UserStats> {
    const response = await api.get<{ success: boolean; data: UserStats }>(
      "/auth/users/stats"
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error("Failed to load user stats");
    }

    return response.data.data;
  },

  async getRoles(): Promise<string[]> {
    const response = await api.get<{ success: boolean; data: string[] }>(
      "/auth/users/roles"
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error("Failed to load roles");
    }

    return response.data.data;
  },

  async updateUserRoles(userId: string, roles: string[]): Promise<void> {
    const response = await api.put<{ success: boolean }>(
      `/auth/users/${userId}/roles`,
      { roles }
    );

    if (!response.data?.success) {
      throw new Error("Failed to update user roles");
    }
  },

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    const response = await api.put<{ success: boolean }>(
      `/auth/users/${userId}/status`,
      { isActive }
    );

    if (!response.data?.success) {
      throw new Error("Failed to update user status");
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const response = await api.delete<{ success: boolean }>(
      `/auth/users/${userId}`
    );

    if (!response.data?.success) {
      throw new Error("Failed to delete user");
    }
  },

  async bulkAction(request: BulkActionRequest): Promise<BulkActionResult> {
    const response = await api.post<{ success: boolean; data: BulkActionResult }>(
      "/auth/users/bulk-action",
      request
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error("Failed to perform bulk action");
    }

    return response.data.data;
  },
};

// Event Management API
export const eventManagementService = {
  async getAllEvents(status?: string): Promise<EventListItem[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);

    const response = await api.get<ApiEnvelope<EventListItem[]>>(
      `/core/events${params.toString() ? `?${params.toString()}` : ""}`
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || "Failed to load events");
    }

    return response.data.data;
  },

  async getEventById(eventId: string): Promise<EventListItem> {
    const response = await api.get<ApiEnvelope<EventListItem>>(
      `/core/events/${eventId}`
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || "Failed to load event");
    }

    return response.data.data;
  },

  async updateEventStatus(eventId: string, statusData: UpdateEventStatusRequest): Promise<void> {
    const response = await api.patch<ApiEnvelope<unknown>>(
      `/core/events/${eventId}/status`,
      statusData
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || "Failed to update event status");
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    const response = await api.delete<ApiEnvelope<unknown>>(
      `/core/events/${eventId}`
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || "Failed to delete event");
    }
  },
};
