"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, Skeleton } from "@/components/ui";
import {
  useUsers,
  useUserStats,
  useRoles,
  useUpdateUserStatus,
  useUpdateUserRoles,
  useBulkUserAction,
} from "@/features/admin/hooks/useAdmin";
import type { UserFilterRequest, UserListItem } from "@/features/admin/types/admin.types";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Shield,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function UserManagementPage() {
  const [filter, setFilter] = useState<UserFilterRequest>({
    page: 1,
    pageSize: 10,
    sortBy: "CreatedAt",
    sortDescending: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  const users = useUsers(filter);
  const userStats = useUserStats();
  const roles = useRoles();
  const updateStatus = useUpdateUserStatus();
  const updateRoles = useUpdateUserRoles();
  const bulkAction = useBulkUserAction();

  const handleSearch = () => {
    setFilter((prev) => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handleFilterByRole = (role: string) => {
    setSelectedRole(role);
    setFilter((prev) => ({
      ...prev,
      role: role || undefined,
      page: 1,
    }));
  };

  const handleFilterByStatus = (status: string) => {
    setSelectedStatus(status);
    setFilter((prev) => ({
      ...prev,
      isActive: status === "" ? undefined : status === "active",
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilter((prev) => ({ ...prev, page }));
  };

  const handleToggleUserStatus = async (user: UserListItem) => {
    await updateStatus.mutateAsync({
      userId: user.userId,
      isActive: !user.isActive,
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.data?.data?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.data?.data?.map((u) => u.userId) ?? []);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkActivate = async () => {
    await bulkAction.mutateAsync({
      userIds: selectedUsers,
      action: "Activate",
    });
    setSelectedUsers([]);
  };

  const handleBulkDeactivate = async () => {
    await bulkAction.mutateAsync({
      userIds: selectedUsers,
      action: "Deactivate",
    });
    setSelectedUsers([]);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-700";
      case "StadiumOwner":
        return "bg-purple-100 text-purple-700";
      case "EventManager":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statCards = [
    {
      label: "Total Users",
      value: userStats.data?.totalUsers ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Active Users",
      value: userStats.data?.activeUsers ?? 0,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "New This Month",
      value: userStats.data?.newUsersThisMonth ?? 0,
      icon: <UserPlus className="w-5 h-5" />,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Inactive Users",
      value: userStats.data?.inactiveUsers ?? 0,
      icon: <XCircle className="w-5 h-5" />,
      color: "text-red-600 bg-red-100",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage all users and their permissions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => users.refetch()}
          disabled={users.isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${users.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  {userStats.isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {stat.value.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedRole}
                onChange={(e) => handleFilterByRole(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Roles</option>
                {roles.data?.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => handleFilterByStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-indigo-700">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkActivate}
                  disabled={bulkAction.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDeactivate}
                  disabled={bulkAction.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedUsers([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {users.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <p>Failed to load users</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => users.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length > 0 &&
                        selectedUsers.length === users.data?.data?.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-4" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-10 w-48" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-6 w-24" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-8 w-8" />
                      </td>
                    </tr>
                  ))
                ) : users.data?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No users found</p>
                    </td>
                  </tr>
                ) : (
                  users.data?.data?.map((user) => (
                    <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.userId)}
                          onChange={() => handleSelectUser(user.userId)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                            {user.fullName?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.fullName}</p>
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={updateStatus.isPending}
                          >
                            {user.isActive ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(user)}
                          >
                            <Shield className="w-4 h-4 text-indigo-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {users.data && users.data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Showing {(users.data.page - 1) * users.data.pageSize + 1} to{" "}
                {Math.min(users.data.page * users.data.pageSize, users.data.totalCount)} of{" "}
                {users.data.totalCount} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(users.data.page - 1)}
                  disabled={!users.data.hasPreviousPage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600">
                  Page {users.data.page} of {users.data.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(users.data.page + 1)}
                  disabled={!users.data.hasNextPage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Role Modal */}
      {editingUser && (
        <EditUserRoleModal
          user={editingUser}
          roles={roles.data ?? []}
          onClose={() => setEditingUser(null)}
          onSave={async (roles) => {
            await updateRoles.mutateAsync({
              userId: editingUser.userId,
              roles,
            });
            setEditingUser(null);
          }}
          isLoading={updateRoles.isPending}
        />
      )}
    </div>
  );
}

// Edit User Role Modal Component
function EditUserRoleModal({
  user,
  roles,
  onClose,
  onSave,
  isLoading,
}: {
  user: UserListItem;
  roles: string[];
  onClose: () => void;
  onSave: (roles: string[]) => Promise<void>;
  isLoading: boolean;
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles);

  const handleToggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Edit User Roles</h2>
          <p className="text-sm text-slate-500 mt-1">{user.fullName}</p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Select roles for this user:</p>
          <div className="space-y-2">
            {roles.map((role) => (
              <label
                key={role}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => handleToggleRole(role)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">{role}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(selectedRoles)}
            disabled={isLoading || selectedRoles.length === 0}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
