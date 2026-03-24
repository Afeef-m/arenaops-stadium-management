"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, Skeleton } from "@/components/ui";
import {
  useAdminDashboard,
  useSystemHealth,
  useRecentActivities,
} from "@/features/admin/hooks/useAdmin";
import {
  Users,
  Building2,
  Calendar,
  Ticket,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const dashboard = useAdminDashboard();
  const systemHealth = useSystemHealth();
  const activities = useRecentActivities(10);

  const loading = dashboard.isLoading && !dashboard.data;
  const data = dashboard.data;

  const getHealthStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-red-600 bg-red-100";
    }
  };

  const getHealthIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getActivityIcon = (type: string) => {
    if (type.includes("User")) return <Users className="w-4 h-4" />;
    if (type.includes("Stadium")) return <Building2 className="w-4 h-4" />;
    if (type.includes("Event")) return <Calendar className="w-4 h-4" />;
    if (type.includes("Booking")) return <Ticket className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const mainStats = [
    {
      key: "totalUsers",
      label: "Total Users",
      icon: <Users className="w-5 h-5" />,
      value: data?.totalUsers ?? 0,
      subtext: `${data?.activeUsers ?? 0} active`,
      color: "text-blue-600 bg-blue-100",
    },
    {
      key: "totalStadiums",
      label: "Total Stadiums",
      icon: <Building2 className="w-5 h-5" />,
      value: data?.totalStadiums ?? 0,
      subtext: `${data?.pendingStadiums ?? 0} pending approval`,
      color: "text-purple-600 bg-purple-100",
    },
    {
      key: "totalEvents",
      label: "Total Events",
      icon: <Calendar className="w-5 h-5" />,
      value: data?.totalEvents ?? 0,
      subtext: `${data?.activeEvents ?? 0} live`,
      color: "text-orange-600 bg-orange-100",
    },
    {
      key: "totalBookings",
      label: "Total Bookings",
      icon: <Ticket className="w-5 h-5" />,
      value: data?.totalBookings ?? 0,
      subtext: `${data?.todaysBookings ?? 0} today`,
      color: "text-green-600 bg-green-100",
    },
  ];

  const revenueStats = [
    { label: "Today", value: data?.todaysRevenue ?? 0 },
    { label: "This Week", value: data?.thisWeekRevenue ?? 0 },
    { label: "This Month", value: data?.thisMonthRevenue ?? 0 },
    { label: "Total", value: data?.totalRevenue ?? 0 },
  ];

  const userRoleStats = [
    { label: "Admins", value: data?.usersByRole?.admins ?? 0, color: "bg-red-500" },
    { label: "Stadium Owners", value: data?.usersByRole?.stadiumOwners ?? 0, color: "bg-purple-500" },
    { label: "Event Managers", value: data?.usersByRole?.eventManagers ?? 0, color: "bg-blue-500" },
    { label: "Regular Users", value: data?.usersByRole?.regularUsers ?? 0, color: "bg-green-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-500">
            System overview and management controls
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            dashboard.refetch();
            systemHealth.refetch();
            activities.refetch();
          }}
          disabled={dashboard.isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${dashboard.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {dashboard.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <p>Failed to load dashboard metrics</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => dashboard.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => (
          <Card key={stat.key} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  {loading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {stat.value.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{stat.subtext}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Section Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Health Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {systemHealth.data && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getHealthStatusColor(systemHealth.data.status)}`}>
                {systemHealth.data.status}
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getHealthIcon(systemHealth.data?.databaseConnected ?? false)}
                    <span className="text-sm">Database</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {systemHealth.data?.databaseResponseTimeMs?.toFixed(0) ?? 0}ms
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getHealthIcon(systemHealth.data?.redisConnected ?? false)}
                    <span className="text-sm">Redis Cache</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {systemHealth.data?.redisResponseTimeMs?.toFixed(0) ?? 0}ms
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getHealthIcon(systemHealth.data?.authServiceHealthy ?? false)}
                    <span className="text-sm">Auth Service</span>
                  </div>
                  <span className="text-xs text-green-600">Connected</span>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  Last checked: {systemHealth.data?.lastChecked
                    ? formatDistanceToNow(new Date(systemHealth.data.lastChecked), { addSuffix: true })
                    : "Unknown"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Revenue Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              revenueStats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">{stat.label}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    ${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              userRoleStats.map((role) => (
                <div key={role.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${role.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{role.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{role.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${role.color}`}
                        style={{
                          width: `${Math.min(
                            ((role.value / (data?.totalUsers || 1)) * 100),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed & Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <a href="/admin/activities">View all</a>
            </Button>
          </CardHeader>
          <CardContent>
            {activities.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : activities.data?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.data?.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        {activity.userName && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs text-slate-500">{activity.userName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Metrics */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">New Users Today</span>
                    <span className="text-2xl font-bold text-blue-600">
                      +{data?.newUsersToday ?? 0}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">New Users This Week</span>
                    <span className="text-2xl font-bold text-purple-600">
                      +{data?.newUsersThisWeek ?? 0}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">New Users This Month</span>
                    <span className="text-2xl font-bold text-green-600">
                      +{data?.newUsersThisMonth ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
