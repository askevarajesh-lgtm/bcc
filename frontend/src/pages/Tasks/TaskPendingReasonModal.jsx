import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Button,
  Typography,
  message,
  theme as antTheme,
} from "antd";
import { useUpdateCoordinatorTaskMutation } from "../../api/coordinatorTaskApi";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text } = Typography;

const TaskPendingReasonModal = ({ visible, onCancel, task, onSuccess }) => {
  const { token } = antTheme.useToken();
  const [reason, setReason] = useState("");
  const [updateTask, { isLoading }] = useUpdateCoordinatorTaskMutation();

  useEffect(() => {
    if (visible && task) {
      setReason(task.pendingReason || "");
    }
  }, [visible, task]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      message.warning("Please enter a reason");
      return;
    }
    try {
      await updateTask({
        id: task._id,
        pendingReason: reason.trim(),
      }).unwrap();
      message.success("Pending reason updated");
      onSuccess?.();
      onCancel();
    } catch (err) {
      message.error("Failed to update pending reason");
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={440}
      destroyOnClose
      centered
      title={null}
      styles={{
        content: { borderRadius: 16, padding: 0, overflow: "hidden" },
        body: { padding: 0 },
      }}
    >
      {/* Header */}
      <div
        style={{
          background: token.colorPrimary,
          padding: "22px 24px 18px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -25,
            right: -25,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ExclamationCircleOutlined
                style={{ fontSize: 14, color: "#fff" }}
              />
            </div>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Pending Reason
            </Text>
          </div>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12.5 }}>
            Explain why the checklist for{" "}
            <strong style={{ color: "rgba(255,255,255,0.9)" }}>
              {task?.companyId?.name || "this client"}
            </strong>{" "}
            is still pending.
          </Text>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: "22px 24px 24px",
          background: token.colorBgContainer,
        }}
      >
        <TextArea
          rows={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the reason for the delay or pending status…"
          style={{
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13.5,
            border: `1.5px solid ${token.colorBorderSecondary}`,
            resize: "none",
            lineHeight: "1.6",
            color: token.colorText,
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <Button
            onClick={onCancel}
            style={{
              borderRadius: 8,
              height: 38,
              fontWeight: 600,
              paddingInline: 18,
              border: `1px solid ${token.colorBorderSecondary}`,
              color: token.colorTextSecondary,
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={isLoading}
            onClick={handleSubmit}
            style={{
              borderRadius: 8,
              height: 38,
              fontWeight: 600,
              paddingInline: 22,
              background: token.colorPrimary,
              border: "none",
              boxShadow: `0 2px 8px ${token.colorPrimary}40`,
            }}
          >
            Submit Reason
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskPendingReasonModal;
