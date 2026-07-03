import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Input,
  Select,
  DatePicker,
  Space,
  Button,
  Modal,
} from "antd";
import { SearchOutlined, EyeOutlined, SyncOutlined } from "@ant-design/icons";
import { useGetSmsLogsQuery } from "../../api/integrationApi";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SmsLogsPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState(undefined);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const startDate = dateRange?.[0] ? dateRange[0].toISOString() : undefined;
  const endDate = dateRange?.[1] ? dateRange[1].toISOString() : undefined;

  const { data, isLoading, isFetching, refetch } = useGetSmsLogsQuery({
    page,
    limit,
    status,
    search,
    startDate,
    endDate,
  });

  const handleTableChange = (pagination) => {
    setPage(pagination.current);
    setLimit(pagination.pageSize);
  };

  const showDetails = (record) => {
    setSelectedLog(record);
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => dayjs(text).format("MMM DD, YYYY HH:mm"),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (text) => (
        <div style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {text}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        if (status === "Sent" || status === "Delivered") color = "success";
        if (status === "Pending") color = "processing";
        if (status === "Failed") color = "error";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => showDetails(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>SMS Logs</Title>
        <Button icon={<SyncOutlined />} onClick={refetch} loading={isFetching}>
          Refresh
        </Button>
      </div>

      <Card bordered={false} className="shadow-md" style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16, display: "flex", flexWrap: "wrap" }}>
          <Input
            placeholder="Search phone or message..."
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            onPressEnter={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onBlur={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <Option value="Pending">Pending</Option>
            <Option value="Sent">Sent</Option>
            <Option value="Delivered">Delivered</Option>
            <Option value="Failed">Failed</Option>
          </Select>
          <RangePicker
            onChange={(dates) => {
              setDateRange(dates);
              setPage(1);
            }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data?.logs || []}
          rowKey="_id"
          pagination={{
            current: page,
            pageSize: limit,
            total: data?.pagination?.total || 0,
            showSizeChanger: true,
          }}
          loading={isLoading || isFetching}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title="SMS Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedLog && (
          <div>
            <p><strong>Date:</strong> {dayjs(selectedLog.createdAt).format("MMM DD, YYYY HH:mm:ss")}</p>
            <p><strong>Phone:</strong> {selectedLog.phone}</p>
            <p>
              <strong>Status:</strong>{" "}
              <Tag color={selectedLog.status === "Sent" || selectedLog.status === "Delivered" ? "success" : selectedLog.status === "Failed" ? "error" : "processing"}>
                {selectedLog.status}
              </Tag>
            </p>
            <p><strong>Provider:</strong> {selectedLog.provider}</p>
            {selectedLog.messageId && <p><strong>Message ID:</strong> {selectedLog.messageId}</p>}
            {selectedLog.errorMessage && (
              <p style={{ color: "red" }}><strong>Error:</strong> {selectedLog.errorMessage}</p>
            )}
            <div style={{ marginTop: 16 }}>
              <strong>Message Content:</strong>
              <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, marginTop: 8 }}>
                {selectedLog.message}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SmsLogsPage;
