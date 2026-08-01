import { useAuth } from "../../contexts/AuthContext";
import React from "react";
import {
  Modal,
  Typography,
  Divider,
  Button,
  Avatar,
  message,
  Checkbox,
  Progress,
  theme as antTheme,
  Spin,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  UserOutlined,
  UserSwitchOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Input } from "antd";
import dayjs from "dayjs";
import {
  useUpdateCoordinatorTaskMutation,
  useGetCoordinatorTaskByIdQuery,
} from "../../api/coordinatorTaskApi";
import { notifyLoading, notifySuccess, notifyError } from '../../utils/notify';

const { Text, Title } = Typography;

const STATUS_CONFIG = {
  completed: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    label: "Completed",
    icon: <CheckCircleOutlined />,
  },
  in_progress: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    label: "In Progress",
    icon: <ClockCircleOutlined />,
  },
  assigned: {
    color: "var(--accent-primary)",
    bg: "rgba(59,130,246,0.12)",
    label: "Assigned",
    icon: <ClockCircleOutlined />,
  },
};

const CoordinatorTaskDetailModal = ({
  taskId,
  visible,
  onCancel,
  readOnly = false,
  onTaskCompleted,
}) => {
  const { token } = antTheme.useToken();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || readOnly;

  const { data: taskResponse, isLoading, refetch } = useGetCoordinatorTaskByIdQuery(
    taskId,
    { skip: !taskId || !visible },
  );
  const [updateTask] = useUpdateCoordinatorTaskMutation();
  const [newItemText, setNewItemText] = React.useState("");

  if (isLoading) {
    return (
      <Modal
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={560}
        destroyOnClose
        styles={{
          content: { borderRadius: 16 },
          body: { padding: "60px 0", textAlign: "center" },
        }}
      >
        <Spin size="large" />
        <Text
          style={{
            display: "block",
            marginTop: 14,
            color: token.colorTextSecondary,
            fontSize: 13,
          }}
        >
          Loading task details…
        </Text>
      </Modal>
    );
  }

  const task = taskResponse?.data;
  if (!task) return null;

  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.assigned;

  const handleAddItem = async () => {
    if (!newItemText.trim() || isAdmin || readOnly) return;
    try {
      const newChecklist = [
        ...task.checklist,
        { label: newItemText.trim(), completed: false },
      ];
      await updateTask({ id: task._id, checklist: newChecklist });
      refetch();
      setNewItemText("");
      notifySuccess('item', task._id, 'Item added');
    } catch (err) {
      notifyError('item', task._id, err.data?.message || err.message || 'Failed to add item');
    }
  };

  const handleDeleteItem = async (index) => {
    if (isAdmin || readOnly) return;
    try {
      const newChecklist = task.checklist.filter((_, i) => i !== index);
      const completedCount = newChecklist.filter((i) => i.completed).length;
      const totalCount = newChecklist.length;
      let newStatus =
        totalCount === 0
          ? "assigned"
          : completedCount === totalCount
            ? "completed"
            : completedCount > 0
              ? "in_progress"
              : "assigned";
      await updateTask({
        id: task._id,
        checklist: newChecklist,
        status: newStatus,
      });
      refetch();
      if (newStatus === "completed" && onTaskCompleted) {
        onTaskCompleted();
      }
      notifySuccess('item', task._id, 'Item removed');
    } catch (err) {
      notifyError('item', task._id, err.data?.message || err.message || 'Failed to remove item');
    }
  };

  const handleCheckChange = async (index, checked) => {
    if (isAdmin || readOnly) return;
    try {
      const newChecklist = task.checklist.map((item, i) =>
        i === index ? { ...item, completed: checked } : item,
      );
      const completedCount = newChecklist.filter((i) => i.completed).length;
      const totalCount = newChecklist.length;
      const newStatus =
        completedCount === totalCount
          ? "completed"
          : completedCount > 0
            ? "in_progress"
            : "assigned";
      await updateTask({
        id: task._id,
        checklist: newChecklist,
        status: newStatus,
      });
      refetch();
      if (newStatus === "completed" && onTaskCompleted) {
        onTaskCompleted();
      }
    } catch (err) {
      notifyError('checklist', task._id, err.data?.message || err.message || 'Failed to update checklist item');
    }
  };

  const completedCount =
    task.checklist?.filter((item) => item.completed).length || 0;
  const totalCount = task.checklist?.length || 0;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button
          key="close"
          onClick={onCancel}
          style={{
            borderRadius: 8,
            height: 36,
            fontWeight: 600,
            paddingInline: 22,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          Close
        </Button>,
      ]}
      width={560}
      title={null}
      destroyOnClose
      styles={{
        content: { borderRadius: 16, overflow: "hidden", padding: 0 },
        header: { display: "none" },
        body: { padding: 0 },
        footer: {
          padding: "12px 24px 20px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
        },
      }}
    >
      {/* ── Header Band ── */}
      <div
        style={{
          background: token.colorPrimary,
          padding: "24px 24px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -30,
            right: 80,
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 700,
                display: "block",
                marginBottom: 4,
              }}
            >
              {task.isManual
                ? "Personal / Custom Checklist"
                : "Coordinator Task Checklist"}
            </Text>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GlobalOutlined style={{ fontSize: 16, color: "#fff" }} />
              </div>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {task.isManual
                  ? "Manual Task"
                  : task.companyId?.name || "All Client Works"}
              </Text>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 11.5,
                fontWeight: 600,
                background: "rgba(255,255,255,0.12)",
                padding: "4px 10px",
                borderRadius: 8,
              }}
            >
              {dayjs(task.taskDate).format("MMMM D, YYYY")}
            </div>

            {task.status !== "assigned" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 8,
                  background: status.bg,
                  color: status.color,
                  fontWeight: 700,
                  fontSize: 11.5,
                  border: `1px solid ${status.color}30`,
                }}
              >
                {status.icon}
                <span style={{ marginLeft: 2 }}>{status.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress Section ── */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 7,
              }}
            >
              <Text strong style={{ fontSize: 13, color: token.colorText }}>
                Overall Progress
              </Text>
              <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                {completedCount}/{totalCount} Items
              </Text>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 100,
                background: token.colorFillSecondary,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  borderRadius: 100,
                  background:
                    progressPercent === 100 ? "#10b981" : token.colorPrimary,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              minWidth: 56,
              padding: "8px 12px",
              borderRadius: 10,
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Text
              strong
              style={{
                fontSize: 22,
                color: progressPercent === 100 ? "#10b981" : token.colorPrimary,
                display: "block",
                lineHeight: 1.1,
              }}
            >
              {progressPercent}%
            </Text>
            <Text
              style={{
                fontSize: 9.5,
                textTransform: "uppercase",
                color: token.colorTextTertiary,
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              Done
            </Text>
          </div>
        </div>
      </div>

      {/* ── Checklist Body ── */}
      <div
        style={{
          padding: "16px 24px 20px",
          background: token.colorBgContainer,
        }}
      >
        {/* Checklist Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <CheckCircleOutlined
              style={{ color: token.colorPrimary, fontSize: 15 }}
            />
            <Text strong style={{ fontSize: 14, color: token.colorText }}>
              Task Activities
            </Text>
          </div>

          {!isAdmin && (
            <div style={{ display: "flex", gap: 6 }}>
              <Input
                placeholder="Add item…"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onPressEnter={handleAddItem}
                style={{
                  width: 170,
                  borderRadius: 8,
                  height: 30,
                  fontSize: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
                size="small"
              />
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                style={{
                  borderRadius: 8,
                  height: 30,
                  background: token.colorPrimary,
                  border: "none",
                }}
              />
            </div>
          )}
        </div>

        {/* Checklist Items */}
        <div
          style={{
            maxHeight: 340,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            paddingRight: 2,
          }}
        >
          {task.checklist && task.checklist.length > 0 ? (
            task.checklist.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: item.completed
                    ? token.colorFillAlter
                    : token.colorBgContainer,
                  borderRadius: 10,
                  border: `1px solid ${
                    item.completed
                      ? token.colorBorderSecondary
                      : token.colorBorderSecondary
                  }`,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!item.completed)
                    e.currentTarget.style.background = token.colorFillAlter;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = item.completed
                    ? token.colorFillAlter
                    : token.colorBgContainer;
                }}
              >
                <Checkbox
                  checked={item.completed}
                  disabled={isAdmin}
                  onChange={(e) => handleCheckChange(index, e.target.checked)}
                  style={{ flex: 1 }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      marginLeft: 6,
                      color: item.completed
                        ? token.colorTextTertiary
                        : token.colorText,
                      textDecoration: item.completed ? "line-through" : "none",
                    }}
                  >
                    {item.label}
                  </Text>
                </Checkbox>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {item.completed && (
                    <CheckCircleOutlined
                      style={{ color: "#10b981", fontSize: 14 }}
                    />
                  )}
                  {!isAdmin && (
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                      onClick={() => handleDeleteItem(index)}
                      style={{
                        color: token.colorTextQuaternary,
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 6,
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = token.colorError;
                        e.currentTarget.style.background = token.colorErrorBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = token.colorTextQuaternary;
                        e.currentTarget.style.background = "transparent";
                      }}
                    />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: token.colorTextTertiary,
                fontSize: 13,
              }}
            >
              No checklist items found.
            </div>
          )}
        </div>

        {/* Footer timestamp */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: `1px solid ${token.colorFillSecondary}`,
            textAlign: "right",
          }}
        >
          <Text style={{ fontSize: 11, color: token.colorTextQuaternary }}>
            Created on {dayjs(task.createdAt).format("MMM D, YYYY · h:mm A")}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default CoordinatorTaskDetailModal;
