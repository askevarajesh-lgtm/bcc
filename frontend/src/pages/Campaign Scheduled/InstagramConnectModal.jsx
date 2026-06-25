import React, { useState } from "react";
import { Modal, Button, Card, Typography, Space, Divider } from "antd";
import {
  InstagramFilled,
  FacebookFilled,
  ArrowLeftOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;

export default function InstagramConnectModal({
  open,
  onCancel,
  onConnectStandard,
  onConnectDirect,
}) {
  const [view, setView] = useState("choice"); // "choice" or "standard-steps"

  const resetAndView = (newView) => setView(newView);

  const renderChoice = () => (
    <div style={{ padding: "10px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Choose how to connect Instagram
        </Title>
      </div>

      <div
        className="instagram-choice-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <Card
          hoverable
          className="instagram-choice-card"
          onClick={() => setView("standard-steps")}
          style={{ textAlign: "center", borderRadius: 12 }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16 }}>
              Instagram with Facebook
            </Text>
          </div>
          <div
            className="instagram-choice-icon-wrap"
            style={{
              position: "relative",
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              background:
                "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 32,
            }}
          >
            <InstagramFilled />
            <div
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                background: "#1877f2",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                border: "2px solid #fff",
              }}
            >
              <FacebookFilled />
            </div>
          </div>
          <Paragraph type="secondary" style={{ fontSize: 12, minHeight: 48 }}>
            Best for accounts linked to a Facebook Page. Sign in using Facebook
            to complete setup easily.
          </Paragraph>
          <Button type="primary" block style={{ borderRadius: 8 }}>
            Select
          </Button>
        </Card>

        <Card
          hoverable
          className="instagram-choice-card"
          onClick={onConnectDirect}
          style={{ textAlign: "center", borderRadius: 12 }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16 }}>
              Direct Instagram Integration
            </Text>
          </div>
          <div
            className="instagram-choice-icon-wrap"
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              background:
                "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 32,
            }}
          >
            <InstagramFilled />
          </div>
          <Paragraph type="secondary" style={{ fontSize: 12, minHeight: 48 }}>
            Best for accounts not linked to a Facebook Page. Sign in using
            Instagram to complete setup easily.
          </Paragraph>
          <Button type="primary" block style={{ borderRadius: 8 }}>
            Select
          </Button>
        </Card>
      </div>

      <div
        style={{
          background: "#f8fafc",
          padding: "10px 14px",
          borderRadius: 8,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div style={{ color: "#64748b", fontSize: 16 }}>ⓘ</div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Note (applies to both): Meta API only supports business and creator
          Instagram accounts
        </Text>
      </div>
    </div>
  );

  const renderStandardSteps = () => (
    <div style={{ padding: "10px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => setView("choice")}
        />
        <Title level={4} style={{ margin: 0 }}>
          Add the Instagram business or creator account
        </Title>
      </div>

      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Instagram business or creator profiles have to be connected to Facebook
        Pages.
      </Paragraph>

      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#1877f2",
              color: "#fff",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyCenter: "center",
              fontSize: 18,
            }}
          >
            <FacebookFilled />
          </div>
          <div
            style={{
              flex: 1,
              width: 2,
              background: "#f0f0f0",
              margin: "4px 0",
            }}
          ></div>
          <div
            style={{
              background:
                "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
              color: "#fff",
              width: 32,
              height: 32,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            <InstagramFilled />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
              1. Log in to Facebook page to add Instagram
            </Text>
            <Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
              We'll find the Instagram Business or Creator profiles that are
              connected to your Facebook Pages. Otherwise, please go to Facebook
              Page &gt; Settings &gt; Instagram to link it.
            </Paragraph>
          </div>
          <div>
            <Text strong style={{ display: "block" }}>
              2. Select the Instagram business or creator profile to add to
              Tunepath Crm
            </Text>
          </div>
        </div>
      </div>

      <Divider style={{ margin: "0 0 16px" }} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" onClick={onConnectStandard}>
          Log in to Facebook
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={720}
      centered
      closeIcon={<CloseOutlined style={{ fontSize: 16 }} />}
      className="instagram-connect-modal"
      bodyStyle={{ padding: 24 }}
    >
      {view === "choice" ? renderChoice() : renderStandardSteps()}
    </Modal>
  );
}
