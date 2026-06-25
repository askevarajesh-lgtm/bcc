import React from "react";
import { LockOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function EmptyState({
  onConnectPlatform,
  loadingPlatform,
  metaConfigured,
  linkedInConfigured,
}) {
  const options = [
    {
      id: "facebook",
      label: "Sign in with Facebook",
      enabled: metaConfigured,
    },
    {
      id: "instagram",
      label: "Sign in with Instagram",
      enabled: metaConfigured,
    },
    {
      id: "linkedin",
      label: "Sign in with LinkedIn",
      enabled: linkedInConfigured,
    },
  ];

  return (
    <Card
      className="campaign-scheduler-surface campaign-scheduler-empty"
      style={{ maxWidth: 620, margin: "40px auto" }}
    >
      <Space
        direction="vertical"
        size={16}
        style={{ width: "100%", textAlign: "center" }}
      >
        <div className="campaign-scheduler-empty-icon">
          <LockOutlined />
        </div>
        <Title level={3} style={{ marginBottom: 0 }}>
          Connect a Social Account
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Connect accounts to start scheduling and auto-publishing campaign
          posts.
        </Paragraph>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {metaConfigured
            ? "Live Meta API mode is enabled."
            : "Meta credentials are missing. Configure META_APP_ID and META_SECRET to enable Facebook/Instagram login."}
        </Paragraph>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {linkedInConfigured
            ? "Live LinkedIn API mode is enabled."
            : "LinkedIn credentials are missing. Configure LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET."}
        </Paragraph>
        <Row gutter={[12, 12]} style={{ width: "100%" }}>
          {options.map((option) => (
            <Col xs={24} md={8} key={option.id}>
              <Button
                block
                type="primary"
                size="large"
                disabled={!option.enabled}
                loading={loadingPlatform === option.id}
                onClick={() => onConnectPlatform?.(option.id)}
              >
                {option.label}
              </Button>
            </Col>
          ))}
        </Row>
      </Space>
    </Card>
  );
}
