import React, { useState, useMemo } from "react";
import {
  Modal,
  Input,
  List,
  Avatar,
  Checkbox,
  Typography,
  Empty,
  Alert,
  Spin,
} from "antd";
import { SearchOutlined, LinkedinFilled } from "@ant-design/icons";

const { Text, Title } = Typography;

export default function LinkedInPageSelectModal({
  open,
  onCancel,
  data,
  onConnect,
  loading,
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredProfile = useMemo(() => {
    if (!data?.profile) return null;
    const name = data.profile.name || "";
    if (name.toLowerCase().includes(search.toLowerCase())) {
      return data.profile;
    }
    return null;
  }, [data, search]);

  const filteredOrgs = useMemo(() => {
    if (!data?.organizations) return [];
    return Object.entries(data.organizations)
      .filter(([id, name]) => name.toLowerCase().includes(search.toLowerCase()))
      .map(([id, name]) => ({ id, name }));
  }, [data, search]);

  const toggleSelection = (id, type) => {
    const key = `${type}:${id}`;
    setSelectedIds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleConnect = () => {
    const selections = selectedIds.map((key) => {
      const [type, id] = key.split(":");
      return { id, type };
    });
    onConnect(selections);
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LinkedinFilled style={{ color: "#0077b5", fontSize: 24 }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            Which LinkedIn profiles and pages do you want to connect?
          </span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleConnect}
      okText="Connect Selected"
      confirmLoading={loading}
      width={600}
      centered
      okButtonProps={{ disabled: selectedIds.length === 0 }}
    >
      <div style={{ marginBottom: 20, marginTop: 10 }}>
        <Input
          placeholder="Search for LinkedIn profiles & pages"
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="large"
          style={{ borderRadius: 8 }}
        />
      </div>

      <div style={{ maxHeight: 400, overflowY: "auto", paddingRight: 8 }}>
        <div style={{ marginBottom: 24 }}>
          <Title
            level={5}
            style={{ marginBottom: 12, fontSize: 14, color: "#595959" }}
          >
            Profile(s)
          </Title>
          {filteredProfile ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                marginBottom: 8,
                background: selectedIds.includes(`user:${filteredProfile.id}`)
                  ? "#f0f7ff"
                  : "white",
                cursor: "pointer",
              }}
              onClick={() => toggleSelection(filteredProfile.id, "user")}
            >
              <Avatar
                src={filteredProfile.avatar}
                size={40}
                style={{ marginRight: 12, backgroundColor: "#0077b5" }}
              >
                {filteredProfile.name?.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 15 }}>
                  {filteredProfile.name}
                </Text>
              </div>
              <Checkbox
                checked={selectedIds.includes(`user:${filteredProfile.id}`)}
              />
            </div>
          ) : (
            !search && (
              <Empty
                description="No profile found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          )}
        </div>

        <div>
          <Title
            level={5}
            style={{ marginBottom: 12, fontSize: 14, color: "#595959" }}
          >
            Page(s)
          </Title>
          {filteredOrgs.length > 0 ? (
            <List
              dataSource={filteredOrgs}
              renderItem={(org) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    marginBottom: 8,
                    background: selectedIds.includes(`organization:${org.id}`)
                      ? "#f0f7ff"
                      : "white",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleSelection(org.id, "organization")}
                >
                  <Avatar
                    size={40}
                    style={{ marginRight: 12, backgroundColor: "#8c8c8c" }}
                  >
                    {org.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 15 }}>
                      {org.name}
                    </Text>
                  </div>
                  <Checkbox
                    checked={selectedIds.includes(`organization:${org.id}`)}
                  />
                </div>
              )}
            />
          ) : (
            <Alert
              message={
                <span style={{ color: "#cf1322" }}>
                  There are no pages associated with this account at this
                  moment. Please try to connect again once you have setup the
                  LinkedIn.
                </span>
              }
              type="error"
              showIcon
              style={{
                background: "#fff1f0",
                border: "1px solid #ffa39e",
                borderRadius: 8,
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
