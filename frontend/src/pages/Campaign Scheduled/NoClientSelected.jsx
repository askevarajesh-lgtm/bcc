import React from "react";
import { UserOutlined } from "@ant-design/icons";
import { Card, Typography, Space } from "antd";

const { Title, Text } = Typography;

export default function NoClientSelected() {
  return (
    <Card
      className="campaign-scheduler-surface"
      style={{
        maxWidth: 500,
        margin: "60px auto",
        textAlign: "center",
        borderRadius: "16px",
        border: "1px dashed #d9d9d9",
        backgroundColor: "#fafafa",
      }}
    >
      <Space
        direction="vertical"
        size={24}
        style={{ width: "100%", padding: "20px 0" }}
      >
        <div
          style={{
            fontSize: 48,
            color: "#bfbfbf",
            width: 80,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 80,
            lineHeight: "80px",
            borderRadius: "50%",
            margin: "0 auto",
          }}
        >
          <UserOutlined />
        </div>
        <div>
          <Title level={4} style={{ marginBottom: 8 }}>
            No Client Selected
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Please select a specific client from the dropdown at the top to
            manage social accounts and schedule campaigns.
          </Text>
        </div>
      </Space>
    </Card>
  );
}
