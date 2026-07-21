import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  message,
  Space,
  Tabs,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  ApiOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  useGetIntegrationsQuery,
  useUpdateIntegrationMutation,
  useValidateEktaApiMutation,
  useSyncEktaStaffMutation,
  useSyncEktaAttendanceMutation,
} from "../../api/integrationApi";

const { Title, Text } = Typography;

const EktaHrConfigPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = useSelector((state) => state.auth.user);

  const { data: integrationsData, refetch: refetchIntegrations } =
    useGetIntegrationsQuery();
  const [updateIntegration] = useUpdateIntegrationMutation();
  const [validateEktaApi, { isLoading: validateLoading }] =
    useValidateEktaApiMutation();
  const [syncEktaStaff, { isLoading: staffSyncLoading }] =
    useSyncEktaStaffMutation();
  const [syncEktaAttendance, { isLoading: attendanceSyncLoading }] =
    useSyncEktaAttendanceMutation();

  const ektaIntegration = useMemo(() => {
    if (!integrationsData?.data?.integrations) return null;
    if (id === "new") return null;
    return integrationsData.data.integrations.find(
      (i) => i.type === "ekta" && (!id || i._id === id),
    );
  }, [integrationsData, id]);

  const [form] = Form.useForm();

  const ektaApiKey = ektaIntegration?.config?.api?.apiKey || "";

  const staffEnabled = ektaIntegration?.config?.staff?.enabled || false;
  const staffEndpoint = ektaIntegration?.config?.staff?.endpoint || "";
  const staffLastSyncedAt = ektaIntegration?.config?.staff?.lastSyncedAt;
  const staffPresent =
    Boolean(ektaIntegration?.config?.staff?.present) ||
    Boolean(staffLastSyncedAt);

  const attendanceEnabled =
    ektaIntegration?.config?.attendance?.enabled || false;
  const attendanceEndpoint =
    ektaIntegration?.config?.attendance?.endpoint || "";
  const attendanceLastSyncedAt =
    ektaIntegration?.config?.attendance?.lastSyncedAt;
  const attendancePresent =
    Boolean(ektaIntegration?.config?.attendance?.present) ||
    Boolean(attendanceLastSyncedAt);

  const [apiConnected, setApiConnected] = useState(false);
  const [activeEktaTab, setActiveEktaTab] = useState("staff");
  const [staffData, setStaffData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);

  useEffect(() => {
    // Pre-fill when editing an existing integration
    form.setFieldsValue({
      apiKey: ektaApiKey,
    });
    setApiConnected(
      Boolean(
        ektaIntegration?.config?.api?.apiKey ||
        ektaIntegration?.config?.api?.apiUrl,
      ),
    );
  }, [ektaIntegration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = () => navigate("/settings/integrations");

  const handleGetApi = async (values) => {
    try {
      const apiKey = values.apiKey?.trim();

      if (!apiKey) {
        message.error("Please enter Ekta API Key");
        return;
      }

      const payload = {
        integrationId: ektaIntegration?._id,
        apiKey,
      };

      const res = await validateEktaApi(payload).unwrap();

      const createdIntegrationId = res?.data?.integration?._id;
      setApiConnected(true);
      message.success("Ekta API connected successfully");
      refetchIntegrations();

      // If we created a new integration, navigate to its config page
      if (!ektaIntegration && createdIntegrationId) {
        navigate(`/settings/integrations/ekta/${createdIntegrationId}`, {
          replace: true,
        });
      }
    } catch (error) {
      message.error(
        error?.data?.message || error?.message || "Failed to connect Ekta API",
      );
    }
  };

  // Auto-fetch data when switching between Staff/Attendance tabs
  useEffect(() => {
    const integrationId = ektaIntegration?._id;
    if (!apiConnected || !integrationId) return;

    const runFetch = async () => {
      try {
        if (activeEktaTab === "staff") {
          if (!staffEnabled || !staffEndpoint) return;
          const res = await syncEktaStaff({
            id: integrationId,
            endpoint: staffEndpoint,
          }).unwrap();
          setStaffData(res?.data?.staff ?? null);
          refetchIntegrations();
        }

        if (activeEktaTab === "attendance") {
          if (!attendanceEnabled || !attendanceEndpoint) return;
          const res = await syncEktaAttendance({
            id: integrationId,
            endpoint: attendanceEndpoint,
          }).unwrap();
          setAttendanceData(res?.data?.attendance ?? null);
          refetchIntegrations();
        }
      } catch (error) {
        message.error(
          error?.data?.message ||
            error?.message ||
            `Failed to fetch Ekta ${activeEktaTab} data`,
        );
      }
    };

    runFetch();
  }, [
    apiConnected,
    activeEktaTab,
    ektaIntegration?._id,
    staffEnabled,
    staffEndpoint,
    attendanceEnabled,
    attendanceEndpoint,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (section, enabled) => {
    if (!ektaIntegration?._id) return;
    try {
      const nextConfig = { ...(ektaIntegration.config || {}) };

      if (section === "staff") {
        nextConfig.staff = {
          ...(nextConfig.staff || {}),
          enabled,
        };
      } else if (section === "attendance") {
        nextConfig.attendance = {
          ...(nextConfig.attendance || {}),
          enabled,
        };
      }

      await updateIntegration({
        id: ektaIntegration._id,
        isActive: true,
        config: nextConfig,
        type: "ekta",
        name: ektaIntegration.name || "Ekta HR Integration",
      }).unwrap();

      refetchIntegrations();
    } catch (error) {
      message.error(
        error?.data?.message || error?.message || "Failed to update setting",
      );
    }
  };

  const handleSyncStaff = async (values) => {
    if (!ektaIntegration?._id) return;
    const endpoint = values.staffEndpoint?.trim();
    if (!endpoint) {
      message.error("Please enter Staff endpoint");
      return;
    }
    try {
      const res = await syncEktaStaff({
        id: ektaIntegration._id,
        endpoint,
      }).unwrap();
      setStaffData(res?.data?.staff ?? null);
      message.success("Staff sync started");
      refetchIntegrations();
    } catch (error) {
      message.error(
        error?.data?.message || error?.message || "Failed to sync Staff",
      );
    }
  };

  const handleSyncAttendance = async (values) => {
    if (!ektaIntegration?._id) return;
    const endpoint = values.attendanceEndpoint?.trim();
    if (!endpoint) {
      message.error("Please enter Attendance endpoint");
      return;
    }
    try {
      const res = await syncEktaAttendance({
        id: ektaIntegration._id,
        endpoint,
      }).unwrap();
      setAttendanceData(res?.data?.attendance ?? null);
      message.success("Attendance sync started");
      refetchIntegrations();
    } catch (error) {
      message.error(
        error?.data?.message || error?.message || "Failed to sync Attendance",
      );
    }
  };

  const staffLastSyncedText = staffLastSyncedAt
    ? new Date(staffLastSyncedAt).toLocaleString()
    : null;

  const attendanceLastSyncedText = attendanceLastSyncedAt
    ? new Date(attendanceLastSyncedAt).toLocaleString()
    : null;

  const showApiWarning = !apiConnected;

  const staffCard = (
    <Card title="Staff" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Space align="center">
          <Text>Enable Staff Sync</Text>
          <Switch
            checked={staffEnabled}
            onChange={(checked) => handleToggle("staff", checked)}
            disabled={!apiConnected || !ektaIntegration?._id}
          />
        </Space>
      </div>

      {staffEnabled ? (
        <>
          <Form
            key={`staff-${staffEndpoint || "new"}`}
            layout="vertical"
            initialValues={{ staffEndpoint: staffEndpoint || "" }}
            onFinish={handleSyncStaff}
          >
            <Form.Item
              label="Staff endpoint"
              name="staffEndpoint"
              rules={[
                { required: true, message: "Staff endpoint is required" },
              ]}
            >
              <Input placeholder="Enter Staff API endpoint/path" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SyncOutlined />}
                  loading={staffSyncLoading}
                  disabled={!apiConnected}
                >
                  Sync Staff
                </Button>
                {staffLastSyncedText ? (
                  <Tag color="blue">Last synced: {staffLastSyncedText}</Tag>
                ) : (
                  <Tag color="default">Not synced yet</Tag>
                )}
                <Tag color={staffPresent ? "green" : "default"}>
                  Confirmation:{" "}
                  {staffPresent ? "Staff Present" : "Staff Not Present"}
                </Tag>
              </Space>
            </Form.Item>
            {staffData ? (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">Fetched Staff Data (preview):</Text>
                <pre
                  style={{
                    marginTop: 8,
                    maxHeight: 320,
                    overflow: "auto",
                    background: "#f6f6f6",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  {JSON.stringify(staffData, null, 2).slice(0, 8000)}
                  {JSON.stringify(staffData, null, 2).length > 8000
                    ? "..."
                    : ""}
                </pre>
              </div>
            ) : null}
          </Form>
        </>
      ) : (
        <Alert
          type="info"
          message="Staff sync disabled"
          description="Enable Staff to configure the endpoint and sync employee data."
          showIcon
        />
      )}
    </Card>
  );

  const attendanceCard = (
    <Card title="Attendance" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Space align="center">
          <Text>Enable Attendance Sync</Text>
          <Switch
            checked={attendanceEnabled}
            onChange={(checked) => handleToggle("attendance", checked)}
            disabled={!apiConnected || !ektaIntegration?._id}
          />
        </Space>
      </div>

      {attendanceEnabled ? (
        <>
          <Form
            key={`attendance-${attendanceEndpoint || "new"}`}
            layout="vertical"
            initialValues={{ attendanceEndpoint: attendanceEndpoint || "" }}
            onFinish={handleSyncAttendance}
          >
            <Form.Item
              label="Attendance endpoint"
              name="attendanceEndpoint"
              rules={[
                { required: true, message: "Attendance endpoint is required" },
              ]}
            >
              <Input placeholder="Enter Attendance API endpoint/path" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SyncOutlined />}
                  loading={attendanceSyncLoading}
                  disabled={!apiConnected}
                >
                  Sync Attendance
                </Button>
                {attendanceLastSyncedText ? (
                  <Tag color="blue">
                    Last synced: {attendanceLastSyncedText}
                  </Tag>
                ) : (
                  <Tag color="default">Not synced yet</Tag>
                )}
                <Tag color={attendancePresent ? "green" : "default"}>
                  Confirmation:{" "}
                  {attendancePresent
                    ? "Attendance Present"
                    : "Attendance Not Present"}
                </Tag>
              </Space>
            </Form.Item>
            {attendanceData ? (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">Fetched Attendance Data (preview):</Text>
                <pre
                  style={{
                    marginTop: 8,
                    maxHeight: 320,
                    overflow: "auto",
                    background: "#f6f6f6",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  {JSON.stringify(attendanceData, null, 2).slice(0, 8000)}
                  {JSON.stringify(attendanceData, null, 2).length > 8000
                    ? "..."
                    : ""}
                </pre>
              </div>
            ) : null}
          </Form>
        </>
      ) : (
        <Alert
          type="info"
          message="Attendance sync disabled"
          description="Enable Attendance to configure the endpoint and sync attendance data."
          showIcon
        />
      )}
    </Card>
  );

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          Back
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          <ApiOutlined /> Ekta HR Integration
        </Title>
      </Space>

      {!currentUser ? null : (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Company-scoped integration configuration for your tenant.
          </Text>
        </div>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          1) Connect Ekta API
        </Title>

        <Form form={form} layout="vertical" onFinish={handleGetApi}>
          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ required: true, message: "Please enter Ekta API Key" }]}
          >
            <Input.Password placeholder="Enter Ekta API key" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={validateLoading}
                disabled={false}
              >
                Save
              </Button>
              {apiConnected ? (
                <Space>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  <Text type="success">Connected</Text>
                </Space>
              ) : (
                <Space>
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                  <Text type="danger">Not connected</Text>
                </Space>
              )}
            </Space>
          </Form.Item>
        </Form>

        {showApiWarning ? (
          <Alert
            type="warning"
            style={{ marginTop: 12 }}
            message="After connecting, you can enable Staff and Attendance sync."
            showIcon
          />
        ) : null}
      </Card>

      {apiConnected ? (
        <>
          <Title level={4}>2) Configure Sync Options</Title>
          <Tabs
            tabPosition="left"
            activeKey={activeEktaTab}
            onChange={(key) => setActiveEktaTab(key)}
            style={{ marginTop: 8 }}
            items={[
              { key: "staff", label: "Staff", children: staffCard },
              {
                key: "attendance",
                label: "Attendance",
                children: attendanceCard,
              },
            ]}
          />
        </>
      ) : (
        <Alert
          type="info"
          message="Connect Ekta API to continue"
          description="Click 'Get API' above to connect, then enable Staff and/or Attendance."
          showIcon
        />
      )}
    </div>
  );
};

export default EktaHrConfigPage;
