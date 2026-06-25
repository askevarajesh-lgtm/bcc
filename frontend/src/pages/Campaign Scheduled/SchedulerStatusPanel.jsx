import React from "react";
import { ClockCircleOutlined, SendOutlined } from "@ant-design/icons";
import { Badge, Card, Space, Typography } from "antd";

const { Text } = Typography;

export default function SchedulerStatusPanel({ schedulerStatus }) {
  return (
    <Card
      size="small"
      bordered={false}
      className="campaign-scheduler-status-card"
    >
      <Space size={18} wrap>
        <Badge status="processing" text="Scheduler Active" />
        <Text type="secondary">
          <SendOutlined style={{ marginRight: 6 }} />
          Queue: {schedulerStatus?.pendingCount ?? 0}
        </Text>
        <Text type="secondary">
          <ClockCircleOutlined style={{ marginRight: 6 }} />
          Next:{" "}
          {schedulerStatus?.nextPost
            ? `${schedulerStatus.nextPost.scheduledDate} ${schedulerStatus.nextPost.scheduledTime}`
            : "N/A"}
        </Text>
      </Space>
    </Card>
  );
}
