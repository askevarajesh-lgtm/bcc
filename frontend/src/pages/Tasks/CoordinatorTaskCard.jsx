import React from "react";
import {
  Typography,
  Progress,
  Space,
  Tooltip,
  Popconfirm,
  Button,
  theme as antTheme,
} from "antd";
import {
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const STATUS_CONFIG = {
  assigned: {
    color: "#1DA54F",
    bg: "rgba(29,165,79,0.08)",
    dot: "#1DA54F",
    label: "Assigned",
    icon: <ClockCircleOutlined />,
  },
  in_progress: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    dot: "#f59e0b",
    label: "In Progress",
    icon: <ClockCircleOutlined />,
  },
  completed: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    dot: "#10b981",
    label: "Completed",
    icon: <CheckCircleOutlined />,
  },
};

const CoordinatorTaskCard = ({
  task,
  user,
  onEdit,
  onDelete,
  onClick,
  onPendingReason,
  showDate = false,
  readOnly = false,
}) => {
  const { token } = antTheme.useToken();
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.assigned;

  const canDelete =
    !readOnly &&
    user &&
    (user.role === "admin" || task.assignedBy?._id === user._id) &&
    user.role !== "admin";

  const completedCount =
    task.checklist?.filter((item) => item.completed).length || 0;
  const totalCount = task.checklist?.length || 0;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isComplete = progressPercent === 100;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 14,
        marginBottom: 10,
        cursor: "pointer",
        border: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = token.colorPrimary + "60";
        e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.07)`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = token.colorBorderSecondary;
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: isComplete
            ? "#10b981"
            : status.color === "#1DA54F"
              ? token.colorPrimary
              : status.color,
          borderRadius: "14px 14px 0 0",
        }}
      />

      <div style={{ padding: "16px 16px 14px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <Text
            strong
            style={{
              fontSize: 13.5,
              lineHeight: "1.35",
              flex: 1,
              paddingRight: 8,
              color: token.colorText,
              letterSpacing: "-0.01em",
            }}
          >
            {showDate
              ? dayjs(task.taskDate).format("MMM DD, YYYY")
              : task.companyId?.name || "All Client Works"}
          </Text>

          {!readOnly && canDelete && (
            <div onClick={(e) => e.stopPropagation()}>
              <Popconfirm
                title="Delete this task?"
                onConfirm={() => onDelete(task._id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true, size: "small" }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                  style={{
                    color: token.colorTextQuaternary,
                    width: 26,
                    height: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
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
              </Popconfirm>
            </div>
          )}

          {readOnly && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: 6,
                background: isComplete ? "#ecfdf5" : "#eff6ff",
                color: isComplete ? "#065f46" : "#1e40af",
                border: `1px solid ${isComplete ? "#d1fae5" : "#dbeafe"}`,
                flexShrink: 0,
              }}
            >
              {isComplete ? "Done" : "Active"}
            </span>
          )}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: task.pendingReason ? 12 : 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: token.colorTextTertiary,
                fontWeight: 500,
              }}
            >
              {completedCount} of {totalCount} tasks
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isComplete ? "#10b981" : token.colorPrimary,
                fontWeight: 700,
              }}
            >
              {progressPercent}%
            </Text>
          </div>
          <div
            style={{
              height: 5,
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
                background: isComplete
                  ? "#10b981"
                  : `linear-gradient(90deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Pending Reason */}
        {task.pendingReason && (
          <div
            style={{
              padding: "8px 10px",
              background: "#fff7ed",
              borderRadius: 8,
              border: "1px solid #fed7aa",
              marginBottom:
                !readOnly && progressPercent < 100 && user?.role !== "admin"
                  ? 10
                  : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 2,
              }}
            >
              <ExclamationCircleOutlined
                style={{ fontSize: 10, color: "#ea580c" }}
              />
              <span
                style={{
                  fontSize: 9.5,
                  color: "#ea580c",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Pending Reason
              </span>
            </div>
            <Text
              style={{
                fontSize: 11.5,
                color: "#9a3412",
                lineHeight: "1.4",
                display: "block",
              }}
              ellipsis={{ rows: 2, tooltip: task.pendingReason }}
            >
              {task.pendingReason}
            </Text>
          </div>
        )}

        {!readOnly && progressPercent < 100 && user?.role !== "admin" && (
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onPendingReason(task);
            }}
            style={{
              width: "100%",
              borderRadius: 8,
              fontSize: 11,
              height: 30,
              fontWeight: 600,
              color: token.colorTextSecondary,
              border: `1px dashed ${token.colorBorderSecondary}`,
              background: token.colorFillAlter,
              marginTop: task.pendingReason ? 0 : 10,
            }}
          >
            {task.pendingReason ? "✏ Update Reason" : "Add Pending Reason"}
          </Button>
        )}
      </div>

      {/* Footer */}
      {!readOnly && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 16px",
            borderTop: `1px solid ${token.colorFillSecondary}`,
            background: token.colorFillAlter,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background:
                  status.color === "#1DA54F"
                    ? token.colorPrimary
                    : status.color,
              }}
            />
            <Text
              style={{
                fontSize: 10,
                color: token.colorTextTertiary,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {status.label}
            </Text>
          </div>
          <Text style={{ fontSize: 10, color: token.colorTextQuaternary }}>
            {dayjs(task.taskDate).format("MMM D")}
          </Text>
        </div>
      )}
    </div>
  );
};

export default CoordinatorTaskCard;

const Tag = ({ color, children, style }) => {
  const { token } = antTheme.useToken();
  const colors = {
    success: { bg: "#ecfdf5", border: "#d1fae5", text: "#065f46" },
    processing: { bg: "#eff6ff", border: "#dbeafe", text: "#1e40af" },
  };
  const theme = colors[color] || colors.processing;

  return (
    <div
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        color: theme.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
