import React, { useState } from "react";
import { Modal, Input, Button, Typography, Space, Alert } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function FacebookPageIDModal({
  open,
  onCancel,
  onConnect,
  hideInstagram = false,
  platform = "facebook",
}) {
  const [pageIds, setPageIds] = useState([""]);
  const [instaIds, setInstaIds] = useState([""]);

  const handleConnectWithId = () => {
    const validPageIds = pageIds.filter(id => id.trim() !== "");
    const validInstaIds = instaIds.filter(id => id.trim() !== "");
    
    if (validPageIds.length === 0 && validInstaIds.length === 0) return;
    
    onConnect(validPageIds, validInstaIds);
    setPageIds([""]);
    setInstaIds([""]);
  };

  const isInstagram = platform === "instagram";

  const addField = (setter, state) => {
    setter([...state, ""]);
  };

  const removeField = (index, setter, state) => {
    const newState = [...state];
    newState.splice(index, 1);
    setter(newState.length ? newState : [""]);
  };

  const updateField = (index, value, setter, state) => {
    const newState = [...state];
    newState[index] = value;
    setter(newState);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={`Connect ${isInstagram ? "Instagram" : "Facebook"}`}
      footer={null}
      width={480}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {!isInstagram && (
          <Alert
            type="info"
            showIcon
            message="Why do I need to provide Page IDs?"
            description="Due to Meta's strict cross-business security rules, our app may not automatically discover your Facebook Pages. Providing your exact Page IDs explicitly allows us to connect them securely."
          />
        )}

        <div>
          {!isInstagram && (
            <div style={{ marginBottom: hideInstagram ? 0 : 16 }}>
              <Text strong>Facebook Page IDs</Text>
              {pageIds.map((id, index) => (
                <div key={index} style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <Input
                    placeholder="e.g. 1046203923402"
                    value={id}
                    onChange={(e) => updateField(index, e.target.value, setPageIds, pageIds)}
                  />
                  {pageIds.length > 1 && (
                    <MinusCircleOutlined
                      style={{ color: "red", cursor: "pointer" }}
                      onClick={() => removeField(index, setPageIds, pageIds)}
                    />
                  )}
                </div>
              ))}
              <Button 
                type="dashed" 
                onClick={() => addField(setPageIds, pageIds)} 
                icon={<PlusOutlined />} 
                style={{ width: "100%", marginTop: 8 }}
              >
                Add Another Page ID
              </Button>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                You can find your Page ID in your Facebook Page Settings &gt; About.
              </Text>
            </div>
          )}

          {(!hideInstagram && isInstagram) && (
            <div>
              <Text strong>Instagram Account IDs</Text>
              {instaIds.map((id, index) => (
                <div key={index} style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <Input
                    placeholder="e.g. 1784140000000"
                    value={id}
                    onChange={(e) => updateField(index, e.target.value, setInstaIds, instaIds)}
                  />
                  {instaIds.length > 1 && (
                    <MinusCircleOutlined
                      style={{ color: "red", cursor: "pointer" }}
                      onClick={() => removeField(index, setInstaIds, instaIds)}
                    />
                  )}
                </div>
              ))}
              <Button 
                type="dashed" 
                onClick={() => addField(setInstaIds, instaIds)} 
                icon={<PlusOutlined />} 
                style={{ width: "100%", marginTop: 8 }}
              >
                Add Another Instagram ID
              </Button>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                Provide your numeric Instagram Account IDs to connect them securely.
              </Text>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button 
            type="primary" 
            onClick={handleConnectWithId}
            disabled={(!isInstagram && !pageIds.some(id => id.trim())) || (isInstagram && !instaIds.some(id => id.trim()))}
          >
            Connect {isInstagram ? "Instagram" : "Pages"}
          </Button>
        </div>
      </Space>
    </Modal>
  );
}
