import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintsQuery,
  useGetComplaintStatisticsQuery,
} from "../store/api/complaintsApi";
import {
  useGetDashboardAnalyticsQuery,
  useGetRecentActivityQuery,
  useGetDashboardStatsQuery,
  useGetUserActivityQuery,
  useGetSystemHealthQuery,
} from "../store/api/adminApi";
import type { DashboardAnalyticsResponse } from "../store/api/adminApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import HeatmapGrid, { HeatmapData } from "../components/charts/HeatmapGrid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Shield,
  Users,
  FileText,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  BarChart3,
  UserCheck,
  Database,
  MessageSquare,
  Activity,
  Target,
} from "lucide-react";

import { useConfigManager } from "../hooks/useConfigManager";
import { SafeRenderer, safeRenderValue } from "../components/SafeRenderer";
import { useAppTranslation } from "../utils/i18n";

// Suppress ResizeObserver loop limit warnings (non-blocking)
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop limit exceeded')) {
      return;
    }
    originalError.call(console, ...args);
  };
}

const AdminDashboard: React.FC = () => {
  const { translations } = useAppSelector((state) => state.language);
  const { getAppName } = useConfigManager();
  const { t } = useAppTranslation();

  // Get app name from centralized configuration
  const appName = getAppName();

  // Fetch real-time data using API queries
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
  } = useGetDashboardStatsQuery();

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useGetDashboardAnalyticsQuery();

  const {
    data: recentActivityData,
    isLoading: activityLoading,
    error: activityError,
  } = useGetRecentActivityQuery({ limit: 5 });

  const {
    data: userActivityData,
    isLoading: userActivityLoading,
    error: userActivityError,
  } = useGetUserActivityQuery({ period: "24h" });

  const {
    data: systemHealthData,
    isLoading: systemHealthLoading,
    error: systemHealthError,
  } = useGetSystemHealthQuery();

  const systemStats = dashboardStats?.data || {
    totalComplaints: 0,
    totalUsers: 0,
    activeComplaints: 0,
    resolvedComplaints: 0,
    overdue: 0,
    wardOfficers: 0,
    maintenanceTeam: 0,
    pendingTeamAssignments: 0,
  };

  const analytics = analyticsData?.data;
  const recentActivity = recentActivityData?.data || [];
  const isLoading =
    statsLoading ||
    analyticsLoading ||
    activityLoading ||
    userActivityLoading ||
    systemHealthLoading;

  // Use real data from APIs with fallbacks
  const complaintTrends = analytics?.complaintTrends || [];
  const complaintsByType = analytics?.complaintsByType || [];
  const wardPerformance = analytics?.wardPerformance || [];

  const defaultMetrics: DashboardAnalyticsResponse["metrics"] = {
    avgResolutionTime: 0,
    slaCompliance: 0,
    citizenSatisfaction: 0,
    resolutionRate: 0,
    slaBreaches: 0,
  };

  const metrics: DashboardAnalyticsResponse["metrics"] =
    analytics?.metrics ?? defaultMetrics;

  // Development debugging - memoized to prevent infinite re-renders
  const debugData = useMemo(() => ({
    analytics: analytics,
    complaintTrends: complaintTrends,
    complaintsByType: complaintsByType,
    wardPerformance: wardPerformance,
    metrics: metrics,
    systemStats: systemStats,
  }), [analytics, complaintTrends, complaintsByType, wardPerformance, metrics, systemStats]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Dashboard Data Debug:", debugData);
    }
  }, [debugData]);

  // Heatmap overview state
  const [overviewHeatmap, setOverviewHeatmap] = useState<HeatmapData | null>(
    null,
  );
  const [overviewHeatmapLoading, setOverviewHeatmapLoading] = useState(false);

  const fetchOverviewHeatmap = useCallback(async () => {
    setOverviewHeatmapLoading(true);
    try {
      const baseUrl = window.location.origin;
      const resp = await fetch(`${baseUrl}/api/reports/heatmap`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!resp.ok) throw new Error(resp.statusText);
      const json = await resp.json();
      const apiData = json.data as HeatmapData & { xTypeKeys?: string[] };
      // Server returns display names already in xLabels; use directly
      setOverviewHeatmap(apiData as HeatmapData);
    } catch (e) {
      console.warn("Failed to load overview heatmap", e);
      setOverviewHeatmap(null);
    } finally {
      setOverviewHeatmapLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewHeatmap();
  }, [fetchOverviewHeatmap]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">{t("dashboard.loadingDashboardData")}</div>
      </div>
    );
  }

  const hasError = Boolean(
    statsError ||
    analyticsError ||
    activityError ||
    userActivityError ||
    systemHealthError,
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "complaint":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "resolution":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "assignment":
        return <UserCheck className="h-4 w-4 text-orange-600" />;
      case "login":
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case "user_created":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "user":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Modern Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
              🛡️ {t("dashboard.admin.title")} 🛠️
            </h1>
            <p className="text-primary-foreground/90 text-base md:text-lg">
              {t("dashboard.admin.subtitle")} {appName}
            </p>
          </div>
          <Shield className="h-16 w-16 md:h-20 md:w-20 text-primary-foreground/40 hidden sm:block" />
        </div>

        {/* Stats Grid - Modern Cards */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            {
              value: systemStats.totalComplaints,
              label: t("dashboard.citizen.totalComplaints"),
            },
            {
              value: systemStats.activeUsers || 0,
              label: t("dashboard.activeUsers"),
            },
            {
              value: `${metrics?.slaCompliance || 0}%`,
              label: t("dashboard.slaCompliance"),
            },
            {
              value: `${(metrics?.citizenSatisfaction || 0).toFixed(1)}/5`,
              label: t("dashboard.satisfaction"),
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl p-5 md:p-6 
                bg-gradient-to-br from-white/95 to-white/85 
                backdrop-blur-xl border border-white/50 shadow-lg
                transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/80"
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  {item.value}
                </div>
                <div className="text-sm font-medium text-slate-700">{item.label}</div>
              </div>

              {/* Bottom Accent Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </div>
          ))}
        </div>
      </div>

      {hasError && (
        <div className="mt-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="font-medium">
              {t("dashboard.admin.dataLoadError")}
            </div>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-1 text-xs text-red-600/80">
                {JSON.stringify({
                  statsError: Boolean(statsError),
                  analyticsError: Boolean(analyticsError),
                  activityError: Boolean(activityError),
                  userActivityError: Boolean(userActivityError),
                  systemHealthError: Boolean(systemHealthError),
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.admin.activeComplaints")}
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {systemStats.activeComplaints}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.admin.pendingResolution")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.admin.overdueComplaints")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {systemStats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.admin.openPastDeadline")}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {t("dashboard.admin.slaBreaches")}: {metrics.slaBreaches ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.admin.pendingAssignments")}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {systemStats.pendingTeamAssignments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.admin.needsMaintenanceAssignment")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.admin.avgResolution")}
            </CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(metrics?.avgResolutionTime || 0).toFixed(1) + " " + t("reports.kpi.days")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.admin.averageClosureTime")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">{t("dashboard.overview")}</TabsTrigger>
          {/* <TabsTrigger value="performance">Performance</TabsTrigger> */}
          {/* <TabsTrigger value="users">Users</TabsTrigger> */}
          <TabsTrigger value="system">{t("dashboard.system")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaint Trends */}
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.complaintTrends")}</CardTitle>
              </CardHeader>
              <CardContent>
                {complaintTrends && complaintTrends.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={complaintTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 12 }}
                        />
                        <RechartsTooltip
                          formatter={(value, name) => [value, name]}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="complaints"
                          stroke="#0f5691"
                          strokeWidth={2}
                          name={t("dashboard.complaints")}
                          connectNulls={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="resolved"
                          stroke="#10B981"
                          strokeWidth={2}
                          name={t("dashboard.resolved")}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    {process.env.NODE_ENV === "development" && (
                      <div className="mt-2 text-xs text-gray-400">
                        Data points: {complaintTrends.length} | Total
                        complaints:{" "}
                        {complaintTrends.reduce(
                          (sum, trend) => sum + (trend.complaints || 0),
                          0,
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="mb-2">
                        {t("dashboard.noComplaintTrendData")}
                      </div>
                      {process.env.NODE_ENV === "development" &&
                        analytics && (
                          <div className="text-xs">
                            Analytics loaded: {analytics ? "Yes" : "No"} |
                            Trends array length:{" "}
                            {complaintTrends?.length || 0}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complaints by Type */}
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.complaintsByType")}</CardTitle>
              </CardHeader>
              <CardContent>
                {complaintsByType && complaintsByType.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={complaintsByType.filter(item => item && item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {complaintsByType
                            .filter(item => item && item.value > 0)
                            .map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry?.color || "#6B7280"}
                              />
                            ))}
                        </Pie>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length)
                              return null;
                            const entry = payload[0];
                            const typeName =
                              entry?.payload?.name || entry?.name || "Type";
                            const count =
                              entry?.value ?? entry?.payload?.value ?? 0;
                            return (
                              <div className="rounded-md border bg-white px-3 py-2 text-sm shadow">
                                <div className="font-medium">{typeName}</div>
                                <div className="text-gray-600">
                                  {count} complaints
                                </div>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 max-h-32 overflow-y-auto">
                      {complaintsByType
                        .filter(item => item && item.name && item.value > 0) // Only show items with valid names and values > 0
                        .map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 text-xs"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: item?.color || "#6B7280",
                              }}
                            ></div>
                            <span className="truncate">
                              {item?.name}
                              {/* {console.warn(item)} */}
                              {/* <SafeRenderer fallback="Unknown (0)">
                                {safeRenderValue(item?.name, 'Unknown')} ({typeof item?.value === 'number' ? item.value : 0})
                              </SafeRenderer> */}
                            </span>
                          </div>
                        ))}
                    </div>
                    {process.env.NODE_ENV === "development" && (
                      <div className="mt-2 text-xs text-gray-400">
                        Types: {complaintsByType.filter(item => item && item.value > 0).length} | Total:{" "}
                        {complaintsByType
                          .filter(item => item && item.value > 0)
                          .reduce((sum, type) => sum + (type.value || 0), 0)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="mb-2">
                        {t("dashboard.noComplaintTypeData")}
                      </div>
                      {process.env.NODE_ENV === "development" &&
                        analytics && (
                          <div className="text-xs">
                            Analytics loaded: {analytics ? "Yes" : "No"} |
                            Types array length:{" "}
                            {complaintsByType?.length || 0}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Overview Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.admin.overviewHeatmap")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("dashboard.admin.overviewHeatmapDesc")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <HeatmapGrid
                  title={t("dashboard.overallComplaintsHeatmap")}
                  description={t("dashboard.complaintsByTypeAcrossWards")}
                  data={
                    overviewHeatmap || {
                      xLabels: [],
                      yLabels: [],
                      matrix: [],
                      xAxisLabel: t("dashboard.complaintType"),
                      yAxisLabel: t("dashboard.ward"),
                    }
                  }
                  className="min-h-[420px]"
                />
                {overviewHeatmapLoading && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {t("dashboard.loadingHeatmap")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                {t("dashboard.admin.recentActivity")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {activity.message}
                          </p>
                          <span className="text-[10px] uppercase tracking-wide text-gray-400">
                            {activity.type}
                          </span>
                        </div>
                        {activity.user && (
                          <p className="text-xs text-gray-600">
                            {activity.user.name}
                            {activity.user.email ? (
                              <>
                                {" "}
                                ·{" "}
                                <span className="text-gray-500">
                                  {activity.user.email}
                                </span>
                              </>
                            ) : null}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  {t("dashboard.noRecentActivity")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {(metrics?.avgResolutionTime || 0).toFixed(1)}d
                </div>
                <p className="text-sm text-gray-600">
                  Average resolution time
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    {/* <span>Target: 3d</span> */}
                    <span>
                      {(metrics?.avgResolutionTime || 0) <= 3
                        ? t("dashboard.onTarget")
                        : t("dashboard.needsImprovement")}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      (3 / Math.max(metrics?.avgResolutionTime || 0.1, 0.1)) *
                      100,
                      100,
                    )}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics?.resolutionRate || 0}%
                </div>
                <p className="text-sm text-gray-600">Complaints resolved</p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Target: 90%</span>
                    <span>
                      {(metrics?.resolutionRate || 0) >= 90
                        ? t("dashboard.excellent")
                        : (metrics?.resolutionRate || 0) >= 75
                          ? t("dashboard.good")
                          : t("dashboard.needsImprovement")}
                    </span>
                  </div>
                  <Progress
                    value={metrics?.resolutionRate || 0}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {metrics?.slaCompliance || 0}%
                </div>
                <p className="text-sm text-gray-600">Meeting deadlines</p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Target: 85%</span>
                    <span>
                      {(metrics?.slaCompliance || 0) >= 85
                        ? t("dashboard.excellent")
                        : (metrics?.slaCompliance || 0) >= 70
                          ? t("dashboard.good")
                          : t("dashboard.belowTarget")}
                    </span>
                  </div>
                  <Progress
                    value={metrics?.slaCompliance || 0}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.satisfactionScore")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {(metrics?.citizenSatisfaction || 0).toFixed(1)}/5
                </div>
                <p className="text-sm text-gray-600">{t("dashboard.citizenFeedback")}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("dashboard.target")}: 4.0</span>
                    <span>
                      {(metrics?.citizenSatisfaction || 0) >= 4.0
                        ? t("dashboard.aboveTarget")
                        : t("dashboard.belowTarget")}
                    </span>
                  </div>
                  <Progress
                    value={((metrics?.citizenSatisfaction || 0) / 5) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.performanceSummary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("dashboard.overallResolutionRate")}</span>
                      <span className="text-lg font-bold text-green-600">
                        {metrics?.resolutionRate || 0}%
                      </span>
                    </div>
                    <Progress
                      value={metrics?.resolutionRate || 0}
                      className="h-3"
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("dashboard.slaCompliance")}</span>
                      <span className="text-lg font-bold text-blue-600">
                        {metrics?.slaCompliance || 0}%
                      </span>
                    </div>
                    <Progress
                      value={metrics?.slaCompliance || 0}
                      className="h-3"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {(metrics?.avgResolutionTime || 0).toFixed(1)}d
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("dashboard.averageResolutionTime")}
                      </p>
                      {/* <div className="text-xs text-gray-500 mt-1">
                        Target: 3 days
                      </div> */}
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {(metrics?.citizenSatisfaction || 0).toFixed(1)}/5
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("dashboard.satisfactionScore")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.quickActions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/reports">
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t("dashboard.detailedReports")}
                    </Button>
                  </Link>
                  <Link to="/admin/analytics">
                    <Button variant="outline" className="w-full">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {t("dashboard.analytics")}
                    </Button>
                  </Link>
                  <Link to="/admin/users/new">
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      {t("dashboard.addUser")}
                    </Button>
                  </Link>
                  <Link to="/admin/config">
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      {t("common.settings")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.userManagement")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin/users" className="block">
                  <Button className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    {t("dashboard.manageUsers")} (
                    {systemStats.wardOfficers + systemStats.maintenanceTeam})
                  </Button>
                </Link>
                <Link to="/admin/users?role=WARD_OFFICER" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <UserCheck className="h-4 w-4 mr-2" />
                    {t("dashboard.wardOfficers")} ({systemStats.wardOfficers})
                  </Button>
                </Link>
                <Link
                  to="/admin/users?role=MAINTENANCE_TEAM"
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    {t("dashboard.maintenanceTeam")} ({systemStats.maintenanceTeam})
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.userActivity")}</CardTitle>
              </CardHeader>
              <CardContent>
                {userActivityLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm">{t("dashboard.loadingActivity")}</span>
                  </div>
                ) : userActivityError ? (
                  <div className="text-center py-4 text-red-600">
                    <p className="text-sm">{t("dashboard.failedToLoadUserActivity")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("dashboard.activeUsers24h")}</span>
                      <Badge variant="secondary">
                        {userActivityData?.data?.metrics?.activeUsers || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("dashboard.newRegistrations24h")}</span>
                      <Badge variant="secondary">
                        {userActivityData?.data?.metrics?.newRegistrations ||
                          0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("dashboard.loginSuccessRate")}</span>
                      <Badge variant="secondary">
                        {userActivityData?.data?.metrics?.loginSuccessRate ||
                          0}
                        %
                      </Badge>
                    </div>
                    {userActivityData?.data?.activities &&
                      userActivityData.data.activities.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">
                            {t("dashboard.recentActivity")}
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {userActivityData.data.activities
                              .slice(0, 3)
                              .map((activity) => (
                                <div
                                  key={activity.id}
                                  className="text-xs p-2 bg-gray-50 rounded"
                                >
                                  <p className="font-medium">
                                    {activity.message}
                                  </p>
                                  <p className="text-gray-500">
                                    {activity.time}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.systemConfiguration")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin/config" className="block">
                  <Button className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    {t("dashboard.systemSettings")}
                  </Button>
                </Link>
                <Link to="/admin/config?tab=wards" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    {t("dashboard.wardManagement")}
                  </Button>
                </Link>
                <Link to="/admin/config?tab=types" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    {t("dashboard.complaintTypes")}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.systemHealth")}</CardTitle>
              </CardHeader>
              <CardContent>
                {systemHealthLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm">{t("dashboard.checkingHealth")}</span>
                  </div>
                ) : systemHealthError ? (
                  <div className="text-center py-4 text-red-600">
                    <p className="text-sm">{t("dashboard.failedToLoadSystemHealth")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("dashboard.applicationUptime")}</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {systemHealthData?.data?.uptime?.formatted || t("dashboard.notAvailable")}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("dashboard.databaseStatus")}</span>
                      <Badge
                        className={
                          systemHealthData?.data?.services?.database
                            ?.status === "healthy"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {systemHealthData?.data?.services?.database
                          ?.status === "healthy"
                          ? t("dashboard.healthy")
                          : t("dashboard.unhealthy")}
                        {systemHealthData?.data?.services?.database
                          ?.responseTime &&
                          ` (${systemHealthData.data.services.database.responseTime})`}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("dashboard.emailService")}</span>
                      <Badge
                        className={
                          systemHealthData?.data?.services?.emailService
                            ?.status === "operational"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {systemHealthData?.data?.services?.emailService
                          ?.status === "operational"
                          ? t("dashboard.operational")
                          : systemHealthData?.data?.services?.emailService?.status || t("dashboard.unknown")}
                      </Badge>
                    </div>
                    {/* <div className="flex justify-between items-center">
                        <span className="text-sm">File Storage</span>
                        <Badge
                          className={
                            (systemHealthData?.data?.services?.fileStorage
                              ?.usedPercent || 0) > 90
                              ? "bg-red-100 text-red-800"
                              : (systemHealthData?.data?.services?.fileStorage
                                    ?.usedPercent || 0) > 75
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }
                        >
                          {systemHealthData?.data?.services?.fileStorage
                            ?.usedPercent || 0}
                          % Used
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">API Response</span>
                        <Badge className="bg-green-100 text-green-800">
                          {systemHealthData?.data?.services?.api
                            ?.averageResponseTime || t("dashboard.notAvailable")}
                        </Badge>
                      </div>
                      {systemHealthData?.data?.system?.memory && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Memory Usage</span>
                          <Badge
                            className={
                              systemHealthData.data.system.memory.percentage >
                              80
                                ? "bg-red-100 text-red-800"
                                : systemHealthData.data.system.memory
                                      .percentage > 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {systemHealthData.data.system.memory.used} (
                            {systemHealthData.data.system.memory.percentage}%)
                          </Badge>
                        </div>
                      )} */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
