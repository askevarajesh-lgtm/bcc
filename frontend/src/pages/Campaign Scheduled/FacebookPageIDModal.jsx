import React, { useState } from "react";
import { Modal, Input, Button, Typography, Space, Alert } from "antd";

const { Text } = Typography;

export default function FacebookPageIDModal({
  open,
  onCancel,
  onConnect,
  hideInstagram = false,
}) {
  const [pageId, setPageId] = useState("");
  const [instaId, setInstaId] = useState("");

  const handleConnectWithId = () => {
    if (!pageId.trim()) return;
    onConnect(pageId.trim(), instaId.trim() || null);
    setPageId("");
    setInstaId("");
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Connect Facebook via Page ID"
      footer={null}
      width={480}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Alert
          type="info"
          showIcon
          message="Why do I need to provide a Page ID?"
          description="Due to Meta's strict cross-business security rules, our app may not automatically discover your Facebook Page. Providing your exact Page ID explicitly allows us to connect it securely."
        />

        <div>
          <Text strong>Facebook Page ID</Text>
          <Input
            placeholder="e.g. 1046203923402"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            style={{ marginTop: 8 }}
          />
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block', marginBottom: hideInstagram ? 0 : 16 }}>
            You can find your Page ID in your Facebook Page Settings &gt; About.
          </Text>

          {!hideInstagram && (
            <>
              <Text strong>Instagram Account ID (Optional)</Text>
              <Input
                placeholder="e.g. 1784140000000"
                value={instaId}
                onChange={(e) => setInstaId(e.target.value)}
                style={{ marginTop: 8 }}
              />
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                If you want to explicitly connect an Instagram account, provide its numeric ID here.
              </Text>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button 
            type="primary" 
            onClick={handleConnectWithId}
            disabled={!pageId.trim()}
          >
            Connect Page
          </Button>
        </div>
      </Space>
    </Modal>
  );
}
