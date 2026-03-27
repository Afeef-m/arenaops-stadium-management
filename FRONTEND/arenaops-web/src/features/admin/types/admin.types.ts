// Admin Dashboard Types

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Dashboard Metrics
export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: UsersByRole;
  totalStadiums: number;
  approvedStadiums: number;
  pendingStadiums: number;
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  totalBookings: number;
  todaysBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  todaysRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  systemHealth: SystemHealth;
}

export interface UsersByRole {
  admins: number;
  stadiumOwners: number;
  eventManagers: number;
  regularUsers: number;
}

export interface SystemHealth {
  status: "Healthy" | "Degraded" | "Unhealthy";
  databaseConnected: boolean;
  redisConnected: boolean;
  authServiceHealthy: boolean;
  lastChecked: string;
  databaseResponseTimeMs: number;
  redisResponseTimeMs: number;
}

export interface QuickStats {
  activeUserSessions: number;
  ongoingBookings: number;
  systemAlerts: number;
  systemLoad: number;
}

// Activity Feed
export interface AdminActivity {
  id: string;
  activityType: string;
  description: string;
  entityId?: string;
  entityType?: string;
  userName?: string;
  userEmail?: string;
  timestamp: string;
  metadata?: string;
}

export interface ActivityFilterRequest {
  activityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// User Management Types
export interface UserListItem {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  authProvider: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface UserDetail extends UserListItem {
  lastLoginAt?: string;
  totalLogins: number;
  recentActivity: UserActivityLog[];
}

export interface UserActivityLog {
  logId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  isSuccess: boolean;
}

export interface UserFilterRequest {
  search?: string;
  role?: string;
  isActive?: boolean;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: UsersByRoleStats;
}

export interface UsersByRoleStats {
  admins: number;
  stadiumOwners: number;
  eventManagers: number;
  regularUsers: number;
}

export interface BulkActionRequest {
  userIds: string[];
  action: "Activate" | "Deactivate" | "AddRole" | "RemoveRole";
  roleName?: string;
}

export interface BulkActionResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

// Stadium Management
export interface PendingStadium {
  stadiumId: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isApproved: boolean;
  createdAt: string;
  isActive: boolean;
}

// Event Management
export interface EventListItem {
  eventId: string;
  stadiumId: string;
  stadiumName: string;
  eventManagerId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status: EventStatus;
  createdAt: string;
  updatedAt?: string;
}

export type EventStatus =
  | "Draft"
  | "PendingApproval"
  | "Live"
  | "Completed"
  | "Cancelled";

export interface CreateEventRequest {
  stadiumId: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateEventRequest {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateEventStatusRequest {
  status: string;
}

export interface EventFilterRequest {
  status?: string;
  stadiumId?: string;
  eventManagerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
