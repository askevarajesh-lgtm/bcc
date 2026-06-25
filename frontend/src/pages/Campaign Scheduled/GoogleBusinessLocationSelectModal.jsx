import React, { useState, useEffect } from "react";
import {
  Modal,
  Checkbox,
  Space,
  Typography,
  List,
  Divider,
  Empty,
  Tag,
  Button,
} from "antd";
import {
  GoogleOutlined,
  ShopOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

const { Text, Title } = Typography;

export default function GoogleBusinessLocationSelectModal({
  open,
  data,
  loading,
  onCancel,
  onConnect,
}) {
  const [selectedLocations, setSelectedLocations] = useState([]);

  useEffect(() => {
    if (open) setSelectedLocations([]);
  }, [open]);

  const handleToggle = (location, accountId) => {
    const key = location.name;
    const isSelected = selectedLocations.find((l) => l.locationId === key);

    if (isSelected) {
      setSelectedLocations(
        selectedLocations.filter((l) => l.locationId !== key),
      );
    } else {
      setSelectedLocations([
        ...selectedLocations,
        {
          accountId,
          locationId: location.name,
          businessName: location.title || "Unnamed Business",
          address: location.storefrontAddress?.addressLines?.join(", ") || "",
          phone: location.phoneNumbers?.primaryPhoneNumber || "",
          category: location.categories?.primaryCategory?.displayName || "",
        },
      ]);
    }
  };

  const accounts = data?.accounts || [];
  const totalLocations = accounts.reduce(
    (acc, curr) => acc + (curr.locations?.length || 0),
    0,
  );

  return (
    <Modal
      title={
        <Space>
          <GoogleOutlined style={{ color: "#4285f4" }} />
          <span>Connect Google Business Locations</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="connect"
          type="primary"
          disabled={selectedLocations.length === 0}
          loading={loading}
          onClick={() => onConnect(selectedLocations)}
        >
          Connect{" "}
          {selectedLocations.length > 0 ? `(${selectedLocations.length})` : ""}
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Select the business locations you want to manage within this client's
          profile.
        </Text>
        {data?.email && (
          <div style={{ marginTop: 8 }}>
            <Tag icon={<CheckCircleFilled />} color="blue">
              Connected as: {data.email}
            </Tag>
          </div>
        )}
      </div>

      {totalLocations === 0 ? (
        <Empty description="No business locations found for this account" />
      ) : (
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {accounts.map((account) => (
            <div key={account.name} style={{ marginBottom: 20 }}>
              <Title
                level={5}
                style={{ fontSize: 14, marginBottom: 8, color: "#64748b" }}
              >
                Account: {account.accountName || account.name}
              </Title>
              <List
                dataSource={account.locations || []}
                renderItem={(loc) => (
                  <List.Item
                    style={{
                      cursor: "pointer",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                      marginBottom: 8,
                      background: selectedLocations.find(
                        (l) => l.locationId === loc.name,
                      )
                        ? "#f0f7ff"
                        : "#fff",
                      transition: "all 0.2s",
                    }}
                    onClick={() => handleToggle(loc, account.name)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Checkbox
                        checked={
                          !!selectedLocations.find(
                            (l) => l.locationId === loc.name,
                          )
                        }
                        style={{ marginRight: 16 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <ShopOutlined style={{ color: "#4285f4" }} />
                          <Text strong>{loc.title}</Text>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginTop: 4,
                          }}
                        >
                          {loc.storefrontAddress?.addressLines?.join(", ") ||
                            "No address provided"}
                        </div>
                        {loc.categories?.primaryCategory?.displayName && (
                          <Tag size="small" style={{ marginTop: 4 }}>
                            {loc.categories.primaryCategory.displayName}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
