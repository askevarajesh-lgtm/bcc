import React, { useEffect, useState } from "react";
// import removed
import { useParams } from "react-router-dom";
import {
  Card,
  Button,
  Table,
  Tag,
  Switch,
  Modal,
  List,
  Popconfirm,
  message,
  Space,
  Typography,
  Divider,
  Alert,
  Tooltip,
  Skeleton
} from "antd";
import {
  FacebookOutlined,
  SyncOutlined,
  DisconnectOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  ApiOutlined
} from "@ant-design/icons";
import {
  useGetFacebookIntegrationsQuery,
  useDisconnectFacebookPageMutation,
  useLazyGetFacebookSyncLogsQuery,
  useSyncFacebookLeadsMutation
} from "../../api/integrationApi";

const { Title, Text, Paragraph } = Typography;

const getBackendUrl = () => {
  const url = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5500/api';
  return url.replace(/\/api$/, "");
};

const FacebookLeadsTab = () => {
  const token = localStorage.getItem('token');
  const selectedClientId = null; // Removed redux dependency
  const { id: integrationId } = useParams();
  
  const {
    data: integrationsData,
    isLoading: isFetchingList,
    refetch,
  } = useGetFacebookIntegrationsQuery(selectedClientId);

  const [disconnectPage, { isLoading: isDisconnecting }] = useDisconnectFacebookPageMutation();
  const [fetchLogs, { data: logsData, isFetching: isFetchingLogs }] = useLazyGetFacebookSyncLogsQuery();
  const [syncLeads] = useSyncFacebookLeadsMutation();

  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [isSyncingPageId, setIsSyncingPageId] = useState(null);

  // Parse callback outcomes from OAuth redirect parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("facebook_oauth");
    const reason = params.get("reason");

    if (oauthStatus === "success") {
      message.success("Facebook accounts connected successfully!");
      // Strip params cleanly from browser bar
      window.history.replaceState({}, document.title, window.location.pathname);
      refetch();
    } else if (oauthStatus === "error") {
      message.error(`Facebook connection failed: ${reason || "Unknown error"}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetch]);

  const handleConnectFacebook = () => {
    if (!token) {
      message.error("Authentication session missing. Please re-login.");
      return;
    }
    const backendUrl = getBackendUrl();
    const isClientPanel = window.location.pathname.includes("client-panel");
    const redirectPath = isClientPanel
      ? "/client-panel/settings/integration/website"
      : `/settings/integrations/website/${integrationId || ""}`;

    const clientIdParam = selectedClientId
      ? `&clientId=${selectedClientId}`
      : "";
    window.location.href = `${backendUrl}/api/facebook/auth?token=${token}&redirectPath=${encodeURIComponent(redirectPath)}${clientIdParam}`;
  };

  const handleManualSync = async (page) => {
    setIsSyncingPageId(page.pageId);
    try {
      const res = await syncLeads({
        pageId: page.pageId,
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
      }).unwrap();
      const { syncedCount, duplicateCount } = res?.data || {};
      
      if (syncedCount > 0 || duplicateCount > 0) {
        message.success(
          `Sync completed! Fetched ${syncedCount} new leads. (${duplicateCount} duplicate profiles skipped)`
        );
      } else {
        message.info("No new leads found on Facebook.");
      }
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to sync Facebook leads");
    } finally {
      setIsSyncingPageId(null);
    }
  };

  const handleDisconnectPage = async (pageId) => {
    try {
      await disconnectPage({
        pageId,
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
      }).unwrap();
      message.success("Facebook Page disconnected successfully");
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to disconnect page");
    }
  };

  const handleShowLogs = (page) => {
    setSelectedPage(page);
    setIsLogsModalOpen(true);
    fetchLogs({
      pageId: page.pageId,
      ...(selectedClientId ? { clientId: selectedClientId } : {}),
    });
  };

  const integrations = integrationsData?.data?.integrations || [];

  const columns = [
    {
      title: "Page Name",
      dataIndex: "pageName",
      key: "pageName",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: "15px" }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>ID: {record.pageId}</Text>
        </Space>
      )
    },
    {
      title: "Sync Status",
      dataIndex: "integrationStatus",
      key: "integrationStatus",
      render: (status) => {
        if (status === "active") {
          return <Tag color="success">Sync Active</Tag>;
        } else if (status === "expired") {
          return <Tag color="error">Token Expired</Tag>;
        }
        return <Tag color="default">Connected</Tag>;
      }
    },
    {
      title: "Last Sync Time",
      dataIndex: "lastSyncAt",
      key: "lastSyncAt",
      render: (time) => time ? new Date(time).toLocaleString() : <Text type="secondary">No leads synced yet</Text>
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<SyncOutlined />}
            loading={isSyncingPageId === record.pageId}
            onClick={() => handleManualSync(record)}
            style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
          >
            Sync Leads
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleShowLogs(record)}
          >
            Logs
          </Button>
          <Popconfirm
            title="Disconnect Page"
            description="Are you sure you want to disconnect this page? Real-time sync will stop."
            onConfirm={() => handleDisconnectPage(record.pageId)}
            okText="Yes, Disconnect"
            cancelText="Cancel"
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button
              size="small"
              danger
              icon={<DisconnectOutlined />}
              loading={isDisconnecting}
            >
              Disconnect
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (isFetchingList) {
    return (
      <Card style={{ borderRadius: "16px", padding: "20px" }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <div style={{ marginTop: "8px" }}>
      {integrations.length === 0 ? (
        <Card
          className="config-card"
          style={{
            borderRadius: "16px",
            textAlign: "center",
            padding: "40px 20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
          }}
        >
          <FacebookOutlined style={{ fontSize: "64px", color: "#1877F2", marginBottom: "20px" }} />
          <Title level={3}>Facebook Lead Ads Integration</Title>
          <Paragraph style={{ maxWidth: "600px", margin: "0 auto 24px auto", fontSize: "15px", lineHeight: "1.6" }}>
            Connect your Facebook Pages to automatically sync lead form submissions directly into the CRM.
            Incoming submissions are captured in real-time, checked for duplicate profiles, and cataloged with complete campaign metadata.
          </Paragraph>
          
          <Button
            type="primary"
            size="large"
            icon={<FacebookOutlined />}
            onClick={handleConnectFacebook}
            style={{
              background: "#1877F2",
              borderColor: "#1877F2",
              height: "48px",
              padding: "0 32px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Connect Facebook Account
          </Button>

          <Divider style={{ margin: "40px 0 30px 0" }} />

          <Title level={4} style={{ marginBottom: "20px" }}>How it works</Title>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ maxWidth: "250px", textAlign: "center" }}>
              <ApiOutlined style={{ fontSize: "28px", color: "var(--accent-secondary)", marginBottom: "12px" }} />
              <Title level={5}>1. Authenticate</Title>
              <Text type="secondary">Log in via Facebook secure OAuth dialog and authorize Page lead retrievals.</Text>
            </div>
            <div style={{ maxWidth: "250px", textAlign: "center" }}>
              <SyncOutlined style={{ fontSize: "28px", color: "#10b981", marginBottom: "12px" }} />
              <Title level={5}>2. Sync Leads</Title>
              <Text type="secondary">Click the "Sync Leads" action button to fetch all existing historic lead forms into your CRM.</Text>
            </div>
            <div style={{ maxWidth: "250px", textAlign: "center" }}>
              <CheckCircleOutlined style={{ fontSize: "28px", color: "#8b5cf6", marginBottom: "12px" }} />
              <Title level={5}>3. Automate Leads</Title>
              <Text type="secondary">Real-time submissions populate your CRM workspace immediately as Leads.</Text>
            </div>
          </div>
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            message="Facebook Lead Ads Integration Status"
            description="All connected pages are active. Click the green 'Sync Leads' button under Actions to retrieve historic form submissions, while all new incoming leads sync automatically via webhooks!"
            type="success"
            showIcon
            closable
            style={{ borderRadius: "12px" }}
          />

          <Card
            className="config-card"
            title={
              <Space>
                <FacebookOutlined style={{ color: "#1877F2", fontSize: "20px" }} />
                <span>Connected Facebook Pages ({integrations.length})</span>
              </Space>
            }
            extra={
              <Button
                type="dashed"
                icon={<SyncOutlined />}
                onClick={handleConnectFacebook}
              >
                Reconnect / Add Pages
              </Button>
            }
            style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}
          >
            <Table
              dataSource={integrations}
              columns={columns}
              rowKey="pageId"
              pagination={false}
              style={{ overflowX: "auto" }}
            />
          </Card>
        </Space>
      )}

      {/* Logs Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>Sync History & Logs — {selectedPage?.pageName}</span>
          </Space>
        }
        open={isLogsModalOpen}
        onCancel={() => {
          setIsLogsModalOpen(false);
          setSelectedPage(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsLogsModalOpen(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {isFetchingLogs ? (
          <Skeleton active paragraph={{ rows: 4 }} style={{ padding: "20px 0" }} />
        ) : !logsData?.data?.logs || logsData.data.logs.length === 0 ? (
          <Alert
            message="No Sync Records"
            description="We haven't received any webhook submission events for this page since it was configured."
            type="info"
            showIcon
            style={{ margin: "20px 0", borderRadius: "8px" }}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={logsData.data.logs}
            style={{ maxHeight: "400px", overflowY: "auto", margin: "16px 0" }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    item.status === "success" ? (
                      <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "22px" }} />
                    ) : item.status === "duplicate" ? (
                      <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: "22px" }} />
                    ) : (
                      <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: "22px" }} />
                    )
                  }
                  title={
                    <Space>
                      <Text strong>
                        {item.status === "success"
                          ? "Lead Created"
                          : item.status === "duplicate"
                          ? "Duplicate Lead Skipped"
                          : "Sync Error"}
                      </Text>
                      <Tag
                        color={
                          item.status === "success"
                            ? "success"
                            : item.status === "duplicate"
                            ? "warning"
                            : "error"
                        }
                      >
                        {item.status.toUpperCase()}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2} style={{ width: "100%" }}>
                      <Text style={{ display: "block" }}>{item.message}</Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        Leadgen ID: {item.leadgenId} | {new Date(item.timestamp).toLocaleString()}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default FacebookLeadsTab;
