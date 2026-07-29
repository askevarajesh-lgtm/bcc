import React from "react";
import {
  Modal,
  Timeline,
  Tag,
  Typography,
  Spin,
  Empty,
  Space,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetSalaryHistoryQuery } from "../../api/expenseApi";

const { Title, Text } = Typography;

const SalaryHistoryModal = ({ visible, open, onClose, employeeId }) => {
  const modalOpen = open !== undefined ? open : visible;
  const { data, isLoading, error } = useGetSalaryHistoryQuery(
    employeeId,
    {},
    { skip: !employeeId || !modalOpen },
  );

  const history = data?.data?.history || [];

  const getChangeTypeColor = (changeType) => {
    switch (changeType) {
      case "increment":
        return "green";
      case "decrement":
        return "red";
      case "initial":
        return "blue";
      default:
        return "default";
    }
  };

  const getChangeTypeIcon = (changeType) => {
    switch (changeType) {
      case "increment":
        return <ArrowUpOutlined />;
      case "decrement":
        return <ArrowDownOutlined />;
      case "initial":
        return <DollarOutlined />;
      default:
        return <MinusOutlined />;
    }
  };

  const getChangeTypeLabel = (changeType) => {
    switch (changeType) {
      case "increment":
        return "Salary Increment";
      case "decrement":
        return "Salary Decrement";
      case "initial":
        return "Initial Salary";
      default:
        return "Salary Adjustment";
    }
  };

  const calculatePercentageChange = (oldSalary, newSalary) => {
    if (!oldSalary || oldSalary === 0) return null;
    const change = ((newSalary - oldSalary) / oldSalary) * 100;
    return change.toFixed(1);
  };

  return (
    <Modal
      title="Salary History"
      open={open !== undefined ? open : visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Spin spinning={isLoading}>
        {error && (
          <Empty
            description="Failed to load salary history"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
        {!error && history.length === 0 && (
          <Empty
            description="No salary history available"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
        {!error && history.length > 0 && (
          <div>
            {/* Employee Info */}
            {history[0]?.staffId && (
              <div
                style={{
                  marginBottom: 24,
                  padding: 16,
                  background: "#f5f5f5",
                  borderRadius: 4,
                }}
              >
                <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
                  {history[0].staffId.name}
                </Title>
                <Space>
                  {history[0].staffId.email && (
                    <Text type="secondary">{history[0].staffId.email}</Text>
                  )}
                  {history[0].staffId.role && (
                    <Tag>{history[0].staffId.role.replace(/_/g, " ")}</Tag>
                  )}
                  {history[0].staffId.team && (
                    <Tag color="blue">{history[0].staffId.team}</Tag>
                  )}
                </Space>
              </div>
            )}

            {/* Current Salary Summary */}
            {history.length > 0 && (
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Statistic
                    title="Current Salary"
                    value={history[0].newSalary}
                    prefix={<DollarOutlined />}
                    formatter={(value) =>
                      `₹${value?.toLocaleString("en-IN") || 0}`
                    }
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Initial Salary"
                    value={
                      history[history.length - 1].oldSalary ||
                      history[history.length - 1].newSalary
                    }
                    prefix={<DollarOutlined />}
                    formatter={(value) =>
                      `₹${value?.toLocaleString("en-IN") || 0}`
                    }
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Total Changes"
                    value={history.length}
                    suffix="times"
                  />
                </Col>
              </Row>
            )}

            {/* Timeline */}
            <Timeline mode="left" style={{ marginTop: 24 }}>
              {history.map((entry, index) => {
                const percentageChange =
                  entry.oldSalary > 0
                    ? calculatePercentageChange(
                        entry.oldSalary,
                        entry.newSalary,
                      )
                    : null;
                const changeAmount = entry.newSalary - entry.oldSalary;

                return (
                  <Timeline.Item
                    key={entry._id || index}
                    color={getChangeTypeColor(entry.changeType)}
                    dot={getChangeTypeIcon(entry.changeType)}
                  >
                    <div style={{ marginBottom: 16 }}>
                      <Space
                        direction="vertical"
                        size="small"
                        style={{ width: "100%" }}
                      >
                        <div>
                          <Tag color={getChangeTypeColor(entry.changeType)}>
                            {getChangeTypeLabel(entry.changeType)}
                          </Tag>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            {dayjs(entry.effectiveDate).format("DD MMM YYYY")}
                          </Text>
                        </div>
                        <div>
                          <Text strong>From: </Text>
                          <Text>
                            ₹{entry.oldSalary.toLocaleString("en-IN")}
                          </Text>
                          <Text strong style={{ marginLeft: 16 }}>
                            To:{" "}
                          </Text>
                          <Text>
                            ₹{entry.newSalary.toLocaleString("en-IN")}
                          </Text>
                          {changeAmount !== 0 && (
                            <>
                              <Text
                                type={changeAmount > 0 ? "success" : "danger"}
                                style={{ marginLeft: 16 }}
                              >
                                ({changeAmount > 0 ? "+" : ""}₹
                                {Math.abs(changeAmount).toLocaleString("en-IN")}
                                )
                              </Text>
                              {percentageChange && (
                                <Text
                                  type={changeAmount > 0 ? "success" : "danger"}
                                  style={{ marginLeft: 8 }}
                                >
                                  ({percentageChange > 0 ? "+" : ""}
                                  {percentageChange}%)
                                </Text>
                              )}
                            </>
                          )}
                        </div>
                        {entry.reason && (
                          <div>
                            <Text type="secondary">Reason: </Text>
                            <Text>{entry.reason}</Text>
                          </div>
                        )}
                        {entry.notes && (
                          <div>
                            <Text type="secondary">Notes: </Text>
                            <Text>{entry.notes}</Text>
                          </div>
                        )}
                        {entry.createdBy && (
                          <div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              Updated by: {entry.createdBy.name || "System"}
                            </Text>
                          </div>
                        )}
                      </Space>
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default SalaryHistoryModal;
