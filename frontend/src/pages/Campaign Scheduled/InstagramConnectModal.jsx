import React from "react";
import { Modal, Button, Typography, Divider } from "antd";
import {
  InstagramFilled,
  FacebookFilled,
  CloseOutlined,
} from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;

export default function InstagramConnectModal({
  open,
  onCancel,
  onConnectStandard,
}) {
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
      <div style={{ padding: "10px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
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
                justifyContent: "center",
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
    </Modal>
  );
}
