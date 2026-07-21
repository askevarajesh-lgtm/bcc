import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetIntegrationsQuery,
  useSyncEktaStaffMutation,
} from "../../api/integrationApi";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { ArrowLeftOutlined, SearchOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const toYMD = (d) => {
  if (!d) return null;
  // dayjs
  if (typeof d?.format === "function") return d.format("YYYY-MM-DD");
  // moment (if used)
  if (typeof d?.toDate === "function")
    return d.toDate().toISOString().slice(0, 10);
  // native Date
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  // fallback string
  if (typeof d === "string") return d.slice(0, 10);
  return null;
};

const formatDateTime = (value) => {
  if (!value) return "";
  const d =
    typeof value === "string" || value instanceof Date ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const EktaHrStaffPage = () => {
  const navigate = useNavigate();
  const { data } = useGetIntegrationsQuery();
  const [syncEktaStaff, { isLoading }] = useSyncEktaStaffMutation();

  const ektaIntegration = useMemo(() => {
    return data?.data?.integrations?.find((i) => i.type === "ekta") || null;
  }, [data]);

  const apiConnected = Boolean(ektaIntegration?.config?.api?.apiKey);
  const staffConfig = ektaIntegration?.config?.staff || {};
  const staffEnabled = Boolean(staffConfig?.enabled);
  const staffEndpoint = staffConfig?.endpoint || "";
  const present =
    Boolean(staffConfig?.present) || Boolean(staffConfig?.lastSyncedAt);

  const [dateRange, setDateRange] = useState(() => [
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  const [pageSize, setPageSize] = useState(10);
  const [current, setCurrent] = useState(1);

  const [staffAllRows, setStaffAllRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [fetching, setFetching] = useState(false);
  const [filters, setFilters] = useState({ staffSearch: "" });

  const displayedStaffRows = useMemo(() => {
    return staffAllRows.slice((current - 1) * pageSize, current * pageSize);
  }, [staffAllRows, current, pageSize]);

  const handleFetch = async () => {
    // For Ekta Staff endpoint, the API may change response shape when `from/to` is sent.
    // To ensure email-matching works reliably, we fetch staff without date filters
    // and only apply email matching + pagination.

    if (!ektaIntegration) {
      message.warning("Ekta integration not found. Connect Ekta first.");
      return;
    }
    if (!apiConnected) {
      message.warning(
        "Ekta API is not connected. Go to Ekta HR Integration and click Get API.",
      );
      return;
    }
    if (!staffEndpoint) {
      message.warning(
        "Staff endpoint is not configured. Configure it in Ekta HR Integration.",
      );
      return;
    }

    setFetching(true);
    try {
      const res = await syncEktaStaff({
        id: ektaIntegration._id,
        endpoint: staffEndpoint,
        // If Ekta supports search, you can enable this. Otherwise it will be ignored.
        search: filters.staffSearch?.trim() || undefined,
      }).unwrap();

      const staffArr = Array.isArray(res?.data?.staff)
        ? res.data.staff
        : Array.isArray(res?.data?.data?.staff)
          ? res.data.data.staff
          : [];
      const totalVal =
        res?.data?.pagination?.total ?? res?.data?.data?.pagination?.total;
      setStaffAllRows(staffArr);
      setTotal(staffArr.length);
    } catch (error) {
      message.error(
        error?.data?.message || error?.message || "Failed to fetch staff",
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    // Auto-fetch first load if already configured and enabled
    if (!ektaIntegration || !apiConnected || !staffEnabled || !staffEndpoint)
      return;
    handleFetch();
  }, [ektaIntegration?._id, apiConnected, staffEnabled, staffEndpoint]);

  const columns = [
    {
      title: "Employee Code",
      key: "employeeCode",
      render: (_, row) => row?.employeeId?.employeeId || row?.employeeId || "",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Designation", dataIndex: "designation", key: "designation" },
    { title: "Department", dataIndex: "department", key: "department" },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Joining Date",
      dataIndex: "joiningDate",
      key: "joiningDate",
      render: (v) => (v ? new Date(v).toLocaleDateString() : ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag color={v === "Active" ? "green" : "default"}>{v}</Tag>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/settings/company")}
        >
          Back
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          Staff
        </Title>
      </Space>

      {!ektaIntegration ? (
        <Alert
          type="warning"
          message="Ekta integration not connected"
          description="Open Ekta HR Integration from Integrations and click Get API."
          showIcon
        />
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Space align="center" wrap>
              <Text>Staff Module</Text>
              <Switch checked={staffEnabled} disabled />
              <Tag color={present ? "green" : "default"}>
                {present ? "Staff Present" : "Staff Not Present"}
              </Tag>
            </Space>
            <Space
              direction="vertical"
              style={{ width: "100%", textAlign: "right" }}
            >
              <Space wrap>
                <Button
                  type="primary"
                  loading={fetching || isLoading}
                  onClick={() => {
                    setCurrent(1);
                    handleFetch();
                  }}
                >
                  Fetch Staff
                </Button>
              </Space>
            </Space>
          </Card>

          {!apiConnected ? (
            <Alert
              type="warning"
              message="Ekta API not connected"
              description="Go to Ekta HR Integration and click Get API."
              showIcon
              action={
                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate("/settings/company")}
                >
                  Configure Ekta
                </Button>
              }
            />
          ) : !staffEnabled ? (
            <Alert
              type="info"
              message="Staff sync is disabled"
              description="Enable Staff in Ekta HR Integration first."
              showIcon
              action={
                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate("/settings/company")}
                >
                  Enable in Config
                </Button>
              }
            />
          ) : (
            <>
              <Table
                rowKey="_id"
                columns={columns}
                dataSource={displayedStaffRows}
                loading={fetching || isLoading}
                pagination={{
                  current,
                  pageSize,
                  total,
                  showSizeChanger: true,
                  onChange: (page, size) => {
                    setCurrent(page);
                    setPageSize(size);
                  },
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EktaHrStaffPage;
