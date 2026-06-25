import { useAuth } from "../../contexts/AuthContext";
import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Space,
  Tabs,
  Drawer,
  message,
  Typography,
  Select,
  Alert,
  Row,
  Col,
  Card,
  Statistic,
  Modal,
  List,
  Tag,
} from "antd";
import {
  PlusOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  SettingOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useGetDepartmentsDynamicQuery } from "../../api/accessControlApi";
import { useActionPermissions } from "../../hooks/useActionPermissions";
import { PERMISSION_ACTIONS } from "../../utils/actionPermissions";
import KanbanBoard from "./KanbanBoard";
import TaskListView from "./TaskListView";
import TaskCalendarView from "./TaskCalendarView";
import TaskDetailDrawer from "./TaskDetailDrawer";
import TaskSettings from "./TaskSettings";
import NotificationSettings from "./NotificationSettings";
import TaskCompletionCelebrate from "./TaskCompletionCelebrate";
import TaskCompletionToast from "./Taskcompletiontoast";
import {
  useGetTodayTaskStatsQuery,
  useGetTodayAssignedDMSummaryQuery,
} from "../../api/taskApi";
import { useGetUnassignedDeliverablesSummaryQuery } from "../../api/projectApi";
import { useGetDMTeamSettingsQuery } from "../../api/settingsApi";
import { useTheme } from "../../contexts/ThemeContext";

const { Title, Text } = Typography;

const TasksPage = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: user } = useAuth();
  const userRole = user?.role;
  const { hasPermission } = useActionPermissions("/tasks");

  // Check permissions for actions
  const canCreate = hasPermission(PERMISSION_ACTIONS.CREATE_TASK);
  const canEdit = hasPermission(PERMISSION_ACTIONS.EDIT_TASK);

  // Define roles that have full access (can create tasks and access settings)
  const rolesWithFullAccess = [
    "super_admin",
    "admin",
    "operations_head",
    "digital_marketing_manager",
  ];
  const isAdmin = rolesWithFullAccess.includes(userRole);

  // Intern type must not see Create Task regardless of role
  // SEO users must be full-time
  const userType = (user?.type || "").toLowerCase().trim();
  const isIntern = userType === "intern";
  const isSEO = userRole === "seo";
  const isSEOFullTime = isSEO && userType === "full_time";

  const canCreateTask = !isIntern && canCreate && (!isSEO || isSEOFullTime);

  // Define roles that can view tasks (all regular users + admins)
  const rolesWithTaskAccess = [
    "super_admin",
    "admin",
    "operations_head",
    "digital_marketing_manager",
    "designer",
    "editor",
    "developer",
    "sales_manager",
    "salesperson",
    "seo",
  ];

  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' | 'list' | 'calendar'
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("workflow");
  const [drawerWidth, setDrawerWidth] = useState(900);
  const [isMobile, setIsMobile] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastCount, setToastCount] = useState(0);
  const [toastTotal, setToastTotal] = useState(0);

  const { data: todayStatsData, refetch: refetchTodayStats } =
    useGetTodayTaskStatsQuery(undefined, {
      skip: !user?._id,
    });
  const todayStats = todayStatsData?.data || {
    completedToday: 0,
    totalToday: 0,
  };
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isTodayAssignedModalOpen, setIsTodayAssignedModalOpen] =
    useState(false);

  const canViewTaskInsightCards =
    ["admin", "super_admin"].includes(userRole) ||
    userRole?.toLowerCase().includes("digital-marketing") ||
    user?.team?.toLowerCase().includes("marketing");

  const { data: unassignedSummaryData, isLoading: isUnassignedSummaryLoading } =
    useGetUnassignedDeliverablesSummaryQuery(undefined, {
      skip: !canViewTaskInsightCards,
    });
  const { data: todayAssignedDMData, isLoading: isTodayAssignedLoading } =
    useGetTodayAssignedDMSummaryQuery(undefined, {
      skip: !canViewTaskInsightCards,
    });

  // Dynamic DM team daily task limits (admin-configurable)
  const { data: dmTeamSettingsData } = useGetDMTeamSettingsQuery();
  const dmTeamSettings = dmTeamSettingsData?.data?.dmTeam;
  const designerDailyLimit = dmTeamSettings?.designerDailyLimit ?? 7;
  const videoEditorDailyLimit = dmTeamSettings?.videoEditorDailyLimit ?? 2;

  const unassignedSummary = unassignedSummaryData?.data?.summary || {};
  const posterProjects = unassignedSummary.posterProjects || [];
  const videoProjects = unassignedSummary.videoProjects || [];
  const todayAssignedSummary = todayAssignedDMData?.data?.summary || {};
  const todayAssignedBreakdown = todayAssignedSummary.breakdown || [];
  const creativeRoles = ["video_editor", "designer"];
  const getDailyLimitForCreativeRole = (role) => {
    const normalized = (role || "").toLowerCase().replace(/\s+/g, "_");
    if (normalized.includes("designer")) return designerDailyLimit;
    if (normalized.includes("video_editor")) return videoEditorDailyLimit;
    return 0;
  };
  const todayAssignedCreativeBreakdown = useMemo(
    () =>
      todayAssignedBreakdown.filter((row) =>
        creativeRoles.includes((row.role || "").toLowerCase()),
      ),
    [todayAssignedBreakdown],
  );
  const todayAssignedCreativeWithLimits = useMemo(
    () =>
      todayAssignedCreativeBreakdown.map((row) => {
        const dailyLimit = getDailyLimitForCreativeRole(row.role);
        const assignedCount = Number(row.taskCount) || 0;
        return {
          ...row,
          dailyLimit,
          assignedCount,
          unassignedCount: Math.max(0, dailyLimit - assignedCount),
        };
      }),
    [todayAssignedCreativeBreakdown, designerDailyLimit, videoEditorDailyLimit],
  );
  const todayAssignedCreativeTotal = useMemo(
    () =>
      todayAssignedCreativeBreakdown.reduce(
        (sum, row) => sum + (Number(row.taskCount) || 0),
        0,
      ),
    [todayAssignedCreativeBreakdown],
  );
  const todayAssignedCreativeUnassignedTotal = useMemo(
    () =>
      todayAssignedCreativeWithLimits.reduce(
        (sum, row) => sum + (Number(row.unassignedCount) || 0),
        0,
      ),
    [todayAssignedCreativeWithLimits],
  );

  // Page title based on user role
  const pageTitle = isAdmin ? "Tasks" : "My Tasks";

  // Calculate responsive drawer width
  useEffect(() => {
    const calculateWidth = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);

      if (mobile) {
        // Mobile: full width
        setDrawerWidth("100%");
      } else if (width < 1024) {
        // Tablet: 85% width
        setDrawerWidth("85%");
      } else if (width < 1440) {
        // Small desktop: 900px
        setDrawerWidth(900);
      } else {
        // Large desktop: 1200px
        setDrawerWidth(1200);
      }
    };

    calculateWidth();
    window.addEventListener("resize", calculateWidth);
    return () => window.removeEventListener("resize", calculateWidth);
  }, []);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDrawerVisible(true);
  };

  const handleAddTask = (statusId) => {
    navigate("/tasks/new", { state: { initialStatus: statusId } });
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedTask(null);
  };

  const handleTaskCompleted = async () => {
    if (!user?._id) return;

    // Small delay to ensure DB consistency before refetching stats
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const result = await refetchTodayStats();
      // Handle the nested structure from our sendSuccess wrapper
      const statsResponse = result.data?.data || result.data;
      const stats = statsResponse || { completedToday: 0, totalToday: 0 };

      // Only show toast/celebration if there are tasks assigned for today
      if (stats.totalToday > 0) {
        if (stats.completedToday >= stats.totalToday) {
          setShowCelebration(true);
        } else {
          setToastCount(stats.completedToday);
          setToastTotal(stats.totalToday);
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Handle celebration triggered via navigation state (e.g. from TaskForm)
  useEffect(() => {
    if (location.state?.triggerCelebration && user?._id) {
      handleTaskCompleted();
      // Clear state so it doesn't trigger again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, user?._id]);

  const tabItems = [
    {
      key: "kanban",
      label: (
        <span>
          <AppstoreOutlined /> Kanban
        </span>
      ),
      children: (
        <KanbanBoard
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          departmentFilter={selectedDepartment}
          onTaskCompleted={handleTaskCompleted}
        />
      ),
    },
    {
      key: "list",
      label: (
        <span>
          <UnorderedListOutlined /> List
        </span>
      ),
      children: (
        <TaskListView
          onTaskClick={handleTaskClick}
          departmentFilter={selectedDepartment}
          onTaskCompleted={handleTaskCompleted}
        />
      ),
    },
    {
      key: "calendar",
      label: (
        <span>
          <CalendarOutlined /> Calendar View
        </span>
      ),
      children: (
        <TaskCalendarView
          onTaskClick={handleTaskClick}
          departmentFilter={selectedDepartment}
        />
      ),
    },
  ];

  const { data: departmentsResp } = useGetDepartmentsDynamicQuery();
  const departments = departmentsResp?.data?.departments || [];

  const departmentTabItems = useMemo(() => {
    const base = [{ value: "all", label: "All" }];
    const dynamicItems = departments
      .filter((d) => {
        // Hide "General" from non-admin/client roles
        if (d.slug === "general" || d.name?.toLowerCase() === "general") {
          return ["admin", "super_admin", "client"].includes(userRole);
        }
        return true;
      })
      .map((d) => ({
        value: d.slug || d._id,
        label: d.name,
      }));
    return [...base, ...dynamicItems];
  }, [departments, userRole]);

  const settingsTabItems = [
    {
      key: "workflow",
      label: "Workflow Configuration",
      children: <TaskSettings />,
    },
    {
      key: "notifications",
      label: "Notification Settings",
      children: <NotificationSettings />,
    },
  ];

  const getProjectStatusTagColor = (status) => {
    const s = (status || "").toLowerCase();
    if (["in_progress", "assigned"].includes(s)) return "processing";
    if (["completed", "done", "validated"].includes(s)) return "success";
    if (["on_hold", "pending", "review"].includes(s)) return "warning";
    if (["cancelled", "rejected"].includes(s)) return "error";
    return "default";
  };

  const summaryCardBase = {
    borderRadius: 14,
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: isDark
      ? "0 8px 20px rgba(0,0,0,0.35)"
      : "0 8px 20px rgba(15,23,42,0.08)",
    border: isDark ? "1px solid #2b2b31" : "1px solid #e8edf3",
    background: isDark ? "#141419" : "#ffffff",
  };

  const summaryCardBody = (tone) => ({
    padding: "14px 16px",
    borderTop: `3px solid ${tone}`,
    background: isDark
      ? `linear-gradient(180deg, ${tone}18 0%, #141419 80%)`
      : `linear-gradient(180deg, ${tone}10 0%, #ffffff 80%)`,
  });

  const summaryValueStyle = {
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1.1,
    color: isDark ? "#f3f4f6" : "#0f172a",
  };

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "12px" : "0",
          marginBottom: isMobile ? "16px" : "24px",
        }}
      >
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          {pageTitle}
        </Title>
        <Space wrap>
          {isAdmin && (
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
              size={isMobile ? "small" : "default"}
            >
              Settings
            </Button>
          )}
          {canCreateTask && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/workspace/tasks/new")}
              size={isMobile ? "small" : "default"}
            >
              Create Task
            </Button>
          )}
        </Space>
      </div>

      {/* Universal Tracking Reminder for all departments */}
      {userRole !== "client" && (
        <Alert
          message="Tracking Reminder"
          description="Before starting a task, move it to 'In Progress' to begin tracking."
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {canViewTaskInsightCards && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => setIsPosterModalOpen(true)}
              styles={{ body: summaryCardBody("#2563eb") }}
              style={summaryCardBase}
            >
              <Statistic
                title="Overall Unassigned Posters"
                value={unassignedSummary.overallUnassignedPosters || 0}
                loading={isUnassignedSummaryLoading}
                valueStyle={summaryValueStyle}
                prefix={
                  <PictureOutlined
                    style={{ color: isDark ? "#93c5fd" : "#2563eb" }}
                  />
                }
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => setIsVideoModalOpen(true)}
              styles={{ body: summaryCardBody("#7c3aed") }}
              style={summaryCardBase}
            >
              <Statistic
                title="Overall Unassigned Videos"
                value={unassignedSummary.overallUnassignedVideos || 0}
                loading={isUnassignedSummaryLoading}
                valueStyle={summaryValueStyle}
                prefix={
                  <VideoCameraOutlined
                    style={{ color: isDark ? "#c4b5fd" : "#7c3aed" }}
                  />
                }
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => setIsTodayAssignedModalOpen(true)}
              styles={{ body: summaryCardBody("#dc2626") }}
              style={summaryCardBase}
            >
              <Statistic
                title="Today Assigned Total Tasks"
                value={todayAssignedCreativeTotal || 0}
                loading={isTodayAssignedLoading}
                valueStyle={summaryValueStyle}
                prefix={
                  <TeamOutlined
                    style={{ color: isDark ? "#fca5a5" : "#dc2626" }}
                  />
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs
        activeKey={viewMode}
        onChange={setViewMode}
        items={tabItems}
        type={isMobile ? "line" : "card"}
        size={isMobile ? "small" : "default"}
        style={{ marginBottom: 16 }}
        tabBarExtraContent={
          [
            "admin",
            "super_admin",
            "digital_marketing_coordinator",
            "website_coordinator",
          ].includes(userRole) && (
            <Select
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              style={{ width: isMobile ? 180 : 300 }}
              options={departmentTabItems}
            />
          )
        }
      />

      <TaskDetailDrawer
        task={selectedTask}
        visible={drawerVisible}
        onClose={handleCloseDrawer}
      />

      <Modal
        title="Projects with Unassigned Posters"
        open={isPosterModalOpen}
        onCancel={() => setIsPosterModalOpen(false)}
        footer={null}
        width={700}
      >
        <List
          dataSource={posterProjects}
          locale={{ emptyText: "No projects with pending posters." }}
          renderItem={(project) => (
            <List.Item
              style={{ paddingInline: 0, alignItems: "flex-start" }}
              actions={[<Tag color="blue">{project.pendingCount} pending</Tag>]}
            >
              <List.Item.Meta
                title={
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <span style={{ fontWeight: 600 }}>{project.name}</span>
                    <Tag color={getProjectStatusTagColor(project.status)}>
                      {(project.status || "").replace(/_/g, " ")}
                    </Tag>
                  </Space>
                }
                description={
                  <span style={{ color: "#6b7280" }}>
                    Client: {project.clientName}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title="Projects with Unassigned Videos"
        open={isVideoModalOpen}
        onCancel={() => setIsVideoModalOpen(false)}
        footer={null}
        width={700}
      >
        <List
          dataSource={videoProjects}
          locale={{ emptyText: "No projects with pending videos." }}
          renderItem={(project) => (
            <List.Item
              style={{ paddingInline: 0, alignItems: "flex-start" }}
              actions={[
                <Tag color="purple">{project.pendingCount} pending</Tag>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <span style={{ fontWeight: 600 }}>{project.name}</span>
                    <Tag color={getProjectStatusTagColor(project.status)}>
                      {(project.status || "").replace(/_/g, " ")}
                    </Tag>
                  </Space>
                }
                description={
                  <span style={{ color: "#6b7280" }}>
                    Client: {project.clientName}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title="Today Assigned Tasks - Designer & Video Editor Users"
        open={isTodayAssignedModalOpen}
        onCancel={() => setIsTodayAssignedModalOpen(false)}
        footer={null}
        width={700}
        styles={{
          body: {
            maxHeight: "60vh",
            overflowY: "auto",
            paddingRight: 8,
          },
        }}
      >
        <Card
          size="small"
          style={{
            marginBottom: 14,
            borderRadius: 12,
            border: "1px solid #f3d4d4",
            boxShadow: "0 6px 18px rgba(220, 38, 38, 0.08)",
          }}
          styles={{ body: { padding: "14px 16px" } }}
        >
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <span style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600 }}>
              TODAY ASSIGNED TOTAL TASKS
            </span>
            <Statistic
              value={todayAssignedCreativeTotal || 0}
              loading={isTodayAssignedLoading}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: "#111827" }}
              prefix={<TeamOutlined style={{ color: "#dc2626" }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Remaining unassigned to role limits:{" "}
              {todayAssignedCreativeUnassignedTotal}
            </Text>
          </Space>
        </Card>
        <List
          dataSource={todayAssignedCreativeWithLimits}
          locale={{
            emptyText: "No designer/video editor task assignments today.",
          }}
          renderItem={(row) => (
            <List.Item
              style={{ paddingInline: 0, alignItems: "flex-start" }}
              actions={[
                <Space key={`row-metrics-${row.userId}`} size={6}>
                  <Tag color="red">Assigned: {row.assignedCount}</Tag>
                  <Tag color="blue">Limit: {row.dailyLimit}</Tag>
                  <Tag color={row.unassignedCount > 0 ? "gold" : "green"}>
                    Unassigned: {row.unassignedCount}
                  </Tag>
                </Space>,
              ]}
            >
              <List.Item.Meta
                title={row.userName}
                description={
                  <Space size={6} wrap>
                    <span style={{ color: "#6b7280" }}>
                      {row.userEmail || "N/A"}
                    </span>
                    <Tag>{(row.role || "").replace(/_/g, " ") || "staff"}</Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      <Drawer
        title={
          <Typography.Title level={4} style={{ margin: 0 }}>
            Task Settings
          </Typography.Title>
        }
        placement="right"
        width={drawerWidth}
        open={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        styles={{
          body: {
            padding: isMobile ? "16px" : "24px",
            overflow: "auto",
          },
        }}
        closable={true}
        maskClosable={isMobile}
        destroyOnClose={false}
      >
        <Tabs
          activeKey={activeSettingsTab}
          onChange={setActiveSettingsTab}
          items={settingsTabItems}
          size={isMobile ? "small" : "default"}
          type={isMobile ? "line" : "card"}
        />
      </Drawer>

      <TaskCompletionCelebrate
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
      />

      <TaskCompletionToast
        visible={showToast}
        count={toastCount}
        total={toastTotal}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default TasksPage;
