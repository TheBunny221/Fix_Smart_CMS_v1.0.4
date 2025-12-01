import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Users,
  Search,
  Plus,
  Edit,

  UserCheck,
  Shield,
  Settings,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  useLazyGetAllUsersQuery,
  useGetUserStatsQuery,
  useActivateUserMutation,
  useDeactivateUserMutation,

  useCreateUserMutation,
  useUpdateUserMutation,
  type AdminUser,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "../store/api/adminApi";
import { useGetWardsQuery } from "../store/api/wardApi";
import { toast } from "../components/ui/use-toast";
import { useAppTranslation } from "../utils/i18n";

const AdminUsers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const { t } = useAppTranslation();

  // Form states
  const [formData, setFormData] = useState<CreateUserRequest>({
    fullName: "",
    email: "",
    phoneNumber: "",
    role: "CITIZEN",
    wardId: "",
    department: "",
  });

  // Initialize filters from URL parameters
  useEffect(() => {
    const roleParam = searchParams.get("role");
    const statusParam = searchParams.get("status");

    if (roleParam) {
      setRoleFilter(roleParam);
    }
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Check authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // API queries - use lazy for users to prevent AbortErrors
  const [
    getAllUsers,
    { data: usersResponse, isLoading: isLoadingUsers, error: usersError },
  ] = useLazyGetAllUsersQuery();

  // Use regular hook with skip for stats
  const {
    data: statsResponse,
    isLoading: isLoadingStats,
    error: statsError,
  } = useGetUserStatsQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Trigger users query when authentication and parameters are ready
  useEffect(() => {
    if (isAuthenticated) {
      try {
        getAllUsers({
          page,
          limit,
          ...(roleFilter !== "all" && { role: roleFilter }),
          status: statusFilter,
        });
      } catch (error) {
        // Silently handle any errors from lazy query in Strict Mode
        console.debug(
          "Lazy query error (likely from React Strict Mode):",
          error,
        );
      }
    }
  }, [page, limit, roleFilter, statusFilter, isAuthenticated, getAllUsers]);

  // Manual refetch function
  const refetchUsers = () => {
    if (isAuthenticated) {
      try {
        getAllUsers({
          page,
          limit,
          ...(roleFilter !== "all" && { role: roleFilter }),
          status: statusFilter,
        });
      } catch (error) {
        // Silently handle any errors from lazy query
        console.debug("Lazy query refetch error:", error);
      }
    }
  };

  // Fetch wards for form dropdowns using RTK Query
  const {
    data: wardsResponse,
    isLoading: isLoadingWards,
    error: wardsError,
  } = useGetWardsQuery({ includeSubzones: false });

  // Extract wards data from the API response
  // wardApi returns { data: { wards: [...] } }
  const wards = wardsResponse?.data?.wards || [];

  // Mutations
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const users = usersResponse?.data?.users || [];
  const pagination = usersResponse?.data?.pagination;
  const stats = statsResponse?.data;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "bg-red-100 text-red-800";
      case "WARD_OFFICER":
        return "bg-blue-100 text-blue-800";
      case "MAINTENANCE_TEAM":
        return "bg-green-100 text-green-800";
      case "CITIZEN":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

    const getRoleIcon = (role: string) => {
      switch (role) {
        case "ADMINISTRATOR":
          return <Shield className="h-4 w-4" />;
      case "WARD_OFFICER":
        return <UserCheck className="h-4 w-4" />;
      case "MAINTENANCE_TEAM":
        return <Settings className="h-4 w-4" />;
      case "CITIZEN":
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
      }
    };

    const getRoleLabel = (role: string) => {
      switch (role) {
        case "ADMINISTRATOR":
          return t("admin.users.roles.administrator");
        case "WARD_OFFICER":
          return t("admin.users.roles.wardOfficer");
        case "MAINTENANCE_TEAM":
          return t("admin.users.roles.maintenanceTeam");
        case "CITIZEN":
          return t("admin.users.roles.citizen");
        default:
          return role;
      }
    };

    const handleActivateUser = async (userId: string) => {
      try {
        await activateUser(userId).unwrap();
        toast({
          title: t("common.success"),
          description: t("admin.users.toasts.activated"),
        });
        refetchUsers();
      } catch (error: any) {
        toast({
          title: t("common.error"),
          description:
            error?.data?.message || t("admin.users.toasts.activateFailed"),
          variant: "destructive",
        });
      }
    };

    const handleDeactivateUser = async (userId: string) => {
      try {
        await deactivateUser(userId).unwrap();
        toast({
          title: t("common.success"),
          description: t("admin.users.toasts.deactivated"),
        });
        refetchUsers();
      } catch (error: any) {
        toast({
          title: t("common.error"),
          description:
            error?.data?.message || t("admin.users.toasts.deactivateFailed"),
          variant: "destructive",
        });
      }
    };



  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
    // Update URL parameters
    setSearchParams({});
  };

  // Handle filter changes and update URL
  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    const newParams = new URLSearchParams(searchParams);
    if (role !== "all") {
      newParams.set("role", role);
    } else {
      newParams.delete("role");
    }
    setSearchParams(newParams);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status !== "all") {
      newParams.set("status", status);
    } else {
      newParams.delete("status");
    }
    setSearchParams(newParams);
  };

  // Form handlers
  const handleOpenAddDialog = () => {
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      role: "CITIZEN",
      wardId: "",
      department: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      wardId: user.wardId || "",
      department: user.department || "",
    });
    setIsEditDialogOpen(true);
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      role: "CITIZEN",
      wardId: "",
      department: "",
    });
    setFormErrors({});
  };

    const validateForm = (): Record<string, string> => {
      const errors: Record<string, string> = {};
      if (!formData.fullName || formData.fullName.trim().length < 3) {
        errors.fullName = t("admin.users.validation.fullNameMin");
      }
      if (!formData.email) {
        errors.email = t("admin.users.validation.emailRequired");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = t("admin.users.validation.emailInvalid");
      }
      if (!formData.role) {
        errors.role = t("admin.users.validation.roleRequired");
      }
      // If role is maintenance team, department is required
      if (formData.role === "MAINTENANCE_TEAM" && !formData.department) {
        errors.department = t("admin.users.validation.departmentRequired");
      }

      return errors;
    };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

      const errors = validateForm();
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        // show a toast as well
        toast({
          title: t("admin.users.validation.title"),
          description: t("admin.users.validation.message"),
          variant: "destructive",
        });
        return;
      }

    try {
        if (editingUser) {
          // Update user
          await updateUser({
            id: editingUser.id,
            data: formData,
          }).unwrap();
          toast({
            title: t("common.success"),
            description: t("admin.users.toasts.updateSuccess"),
          });
        } else {
          // Create user
          await createUser(formData).unwrap();
          toast({
            title: t("common.success"),
            description: t("admin.users.toasts.createSuccess"),
          });
        }

      handleCloseDialogs();
      refetchUsers();
      } catch (error: any) {
        // If backend returns structured field errors, show them
        const msg =
          error?.data?.message || error?.message || t("admin.users.toasts.unexpectedError");
        if (error?.data?.errors && typeof error.data.errors === "object") {
          setFormErrors(error.data.errors);
        }

        toast({ title: t("common.error"), description: msg, variant: "destructive" });
      }
    };

  // Export users as JSON (respects role/status filters; applies search locally)
  const handleExportUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/export?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      const allUsers: Array<{
        id: string;
        fullName: string;
        email: string;
        role: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }> = json?.data?.users || [];

      const searched = searchTerm
        ? allUsers.filter(
          (u) =>
            u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        : allUsers;

      const blob = new Blob([JSON.stringify(searched, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        title: t("admin.users.toasts.exportFailed"),
        description: t("admin.users.toasts.exportFailedDescription"),
        variant: "destructive",
      });
    }
  };

  // Filter users locally based on search term
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

    if (usersError || statsError) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("admin.users.errors.loadTitle")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("admin.users.errors.loadMessage")}
              </p>
              <Button onClick={() => refetchUsers()}>{t("common.retry")}</Button>
            </div>
          </div>
        </div>
      );
    }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("admin.users.title")}</h1>
            <p className="text-gray-600">{t("admin.users.subtitle")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleExportUsers} variant="outline" className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              {t("admin.users.actions.exportUsers")}
            </Button>
            <Button onClick={handleOpenAddDialog} variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              {t("admin.users.actions.addUser")}
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.users.stats.totalUsers")}
                  </p>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      stats?.totalUsers || 0
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("admin.users.stats.activeUsers")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.activeUsers || 0
                  )}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("admin.users.stats.citizens")}
                </p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.usersByRole?.find((role) => role.role === "CITIZEN")
                      ?._count || 0
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("admin.users.stats.wardOfficers")}
                </p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.usersByRole?.find(
                      (role) => role.role === "WARD_OFFICER",
                    )?._count || 0
                  )}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("admin.users.stats.maintenance")}
                </p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.usersByRole?.find(
                      (role) => role.role === "MAINTENANCE_TEAM",
                    )?._count || 0
                  )}
                </p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("admin.users.filters.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.users.filters.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.users.filters.allRoles")}</SelectItem>
                  <SelectItem value="CITIZEN">{t("admin.users.roles.citizen")}</SelectItem>
                  <SelectItem value="WARD_OFFICER">{t("admin.users.roles.wardOfficer")}</SelectItem>
                  <SelectItem value="MAINTENANCE_TEAM">
                    {t("admin.users.roles.maintenanceTeam")}
                  </SelectItem>
                  <SelectItem value="ADMINISTRATOR">{t("admin.users.roles.administrator")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.users.filters.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.users.filters.allStatus")}</SelectItem>
                  <SelectItem value="active">{t("admin.users.status.active")}</SelectItem>
                  <SelectItem value="inactive">{t("admin.users.status.inactive")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleResetFilters}>
                {t("admin.users.filters.reset")}
              </Button>
            </div>
          </CardContent>
        </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            {t("admin.users.table.title", { count: pagination?.total || 0 })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">{t("admin.users.table.loading")}</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.users.table.columns.name")}</TableHead>
                  <TableHead>{t("admin.users.table.columns.role")}</TableHead>
                  <TableHead>{t("admin.users.table.columns.ward")}</TableHead>
                  <TableHead>{t("admin.users.table.columns.status")}</TableHead>
                  <TableHead>{t("admin.users.table.columns.activity")}</TableHead>
                  <TableHead>{t("admin.users.table.columns.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.phoneNumber && (
                          <p className="text-sm text-gray-500">
                            {user.phoneNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        <span className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className="ml-1">
                            {getRoleLabel(user.role)}
                          </span>
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.ward?.name || t("admin.users.table.noWard")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {user.isActive
                          ? t("admin.users.status.active")
                          : t("admin.users.status.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>
                          {t("admin.users.counts.submitted", {
                            count: user._count?.submittedComplaints || 0,
                          })}
                        </p>
                        <p>
                          {t("admin.users.counts.assigned", {
                            count: user._count?.assignedComplaints || 0,
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(user)}
                          className="h-8 w-8 p-0"
                          title={t("admin.users.actions.editUser")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => user.isActive ? handleDeactivateUser(user.id) : handleActivateUser(user.id)}
                          className={`h-8 w-8 p-0 ${user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                          title={
                            user.isActive
                              ? t("admin.users.actions.deactivateUser")
                              : t("admin.users.actions.activateUser")
                          }
                        >
                          {user.isActive ? <UserCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-gray-500">
                  {t("admin.users.pagination.showing", {
                    start: (pagination.page - 1) * pagination.limit + 1,
                    end: Math.min(pagination.page * pagination.limit, pagination.total),
                    total: pagination.total,
                  })}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    {t("common.previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.pages}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t("admin.users.dialogs.add.title")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.users.dialogs.add.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">{t("admin.users.fields.fullName")}</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder={t("admin.users.fields.fullNamePlaceholder")}
                required
                aria-invalid={!!formErrors.fullName}
              />
              {formErrors.fullName && (
                <p className="text-sm text-red-600 mt-1">
                  {formErrors.fullName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">{t("admin.users.fields.email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={t("admin.users.fields.emailPlaceholder")}
                required
                aria-invalid={!!formErrors.email}
              />
              {formErrors.email && (
                <p className="text-sm text-red-600 mt-1">{formErrors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phoneNumber">{t("admin.users.fields.phoneNumber")}</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder={t("admin.users.fields.phonePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="role">{t("admin.users.fields.role")}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.users.fields.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CITIZEN">{t("admin.users.roles.citizen")}</SelectItem>
                  <SelectItem value="WARD_OFFICER">{t("admin.users.roles.wardOfficer")}</SelectItem>
                  <SelectItem value="MAINTENANCE_TEAM">
                    {t("admin.users.roles.maintenanceTeam")}
                  </SelectItem>
                  <SelectItem value="ADMINISTRATOR">{t("admin.users.roles.administrator")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ward">{t("admin.users.fields.ward")}</Label>
              <Select
                value={formData.wardId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    wardId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.users.fields.wardPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("admin.users.fields.noWardOption")}</SelectItem>
                  {wards.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Department only visible for Maintenance Team */}
            {formData.role === "MAINTENANCE_TEAM" && (
              <div>
                <Label htmlFor="department">{t("admin.users.fields.department")}</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder={t("admin.users.fields.departmentPlaceholder")}
                  aria-invalid={!!formErrors.department}
                />
                {formErrors.department && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.department}
                  </p>
                )}
              </div>
            )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialogs}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isCreating} className="bg-primary hover:bg-primary/90">
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("admin.users.actions.creating")}
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      {t("admin.users.actions.createUser")}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              {t("admin.users.dialogs.edit.title")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.users.dialogs.edit.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editFullName">{t("admin.users.fields.fullName")}</Label>
              <Input
                id="editFullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder={t("admin.users.fields.fullNamePlaceholder")}
                required
              />
            </div>
            <div>
              <Label htmlFor="editEmail">{t("admin.users.fields.email")}</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={t("admin.users.fields.emailPlaceholder")}
                required
              />
            </div>
            <div>
              <Label htmlFor="editPhoneNumber">{t("admin.users.fields.phoneNumber")}</Label>
              <Input
                id="editPhoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder={t("admin.users.fields.phonePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="editRole">{t("admin.users.fields.role")}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.users.fields.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CITIZEN">{t("admin.users.roles.citizen")}</SelectItem>
                  <SelectItem value="WARD_OFFICER">{t("admin.users.roles.wardOfficer")}</SelectItem>
                  <SelectItem value="MAINTENANCE_TEAM">
                    {t("admin.users.roles.maintenanceTeam")}
                  </SelectItem>
                  <SelectItem value="ADMINISTRATOR">{t("admin.users.roles.administrator")}</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-600 mt-1">{formErrors.role}</p>
              )}
            </div>
            <div>
              <Label htmlFor="editWard">{t("admin.users.fields.ward")}</Label>
              <Select
                value={formData.wardId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    wardId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.users.fields.wardPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("admin.users.fields.noWardOption")}</SelectItem>
                  {wards.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.role === "MAINTENANCE_TEAM" && (
              <div>
                <Label htmlFor="editDepartment">{t("admin.users.fields.department")}</Label>
                <Input
                  id="editDepartment"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder={t("admin.users.fields.departmentPlaceholder")}
                  aria-invalid={!!formErrors.department}
                />
                {formErrors.department && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.department}
                  </p>
                )}
              </div>
            )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialogs}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isUpdating} className="bg-primary hover:bg-primary/90">
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("admin.users.actions.updating")}
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      {t("admin.users.actions.updateUser")}
                    </>
                  )}
                </Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
