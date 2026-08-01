import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  DatePicker,
  Space,
  Spin,
} from "antd";
import {
  DollarOutlined,
  RiseOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useGetProfitLossQuery } from "../../api/expenseApi";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PLAnalyticsPage = () => {
  const [dateRange, setDateRange] = useState(null);
  const { user: currentUser } = useAuth();
  const tenantName = currentUser?.companyId?.name || "Company";

  const params = {};
  if (dateRange && dateRange.length === 2) {
    params.startDate = dayjs(dateRange[0]).toISOString();
    params.endDate = dayjs(dateRange[1]).toISOString();
  }

  const { data: plData, isLoading: plLoading } = useGetProfitLossQuery(params);
  const pl = plData?.data || {};

  // Extract P&L data
  const totalRevenue = pl.totalRevenue || pl.totalIncome || 0; // Use totalRevenue, fallback to totalIncome for backward compatibility
  const tunepathRevenue = pl.tunepathRevenue || 0; // Non-GST receipts revenue (from invoices without GST)
  const includeGstRevenue = pl.includeGstRevenue || 0; // GST receipts revenue (from invoices with GST)
  const totalHandlingAmount = pl.totalHandlingAmount || 0;
  const totalCampaignAmount = pl.totalCampaignAmount || 0;
  const totalDomainPurchaseAmount = pl.totalDomainPurchaseAmount || 0;
  const totalGST = pl.totalGST || 0;
  const totalDomainPurchaseGST = pl.totalDomainPurchaseGST || 0;
  const isAskEva = pl.isAskEva || false;
  // Ensure totalPendingAmount is always a number, default to 0 if not provided
  const totalPendingAmount =
    typeof pl.totalPendingAmount === "number"
      ? pl.totalPendingAmount
      : pl.totalPendingAmount || 0;
  // Ensure totalHoldPendingAmount is always a number
  const totalHoldPendingAmount =
    typeof pl.totalHoldPendingAmount === "number"
      ? pl.totalHoldPendingAmount
      : 0;
  // Ensure totalCollectedAmount is always a number, default to 0 if not provided
  const totalCollectedAmount =
    typeof pl.totalCollectedAmount === "number"
      ? pl.totalCollectedAmount
      : pl.totalCollectedAmount || 0;
  const totalExpenses = pl.totalExpenses || 0;
  const profit =
    pl.profit !== undefined ? pl.profit : totalRevenue - totalExpenses;
  const profitPercentage =
    pl.profitPercentage !== undefined
      ? pl.profitPercentage
      : totalRevenue > 0
        ? (profit / totalRevenue) * 100
        : 0;
  const teamBreakdown = pl.teamBreakdown || [];

  return (
    <Spin spinning={plLoading}>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            P&L Analytics
          </h1>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
            />
          </Space>
        </div>

        {/* Row 1: 4 Cards - Revenue & Key Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Statistic
                title="Company Revenue"
                value={tunepathRevenue}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "var(--accent-primary)" }}
                precision={2}
                formatter={(value) =>
                  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  minHeight: 20,
                }}
              >
                Non-GST Receipts
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Statistic
                title="Included GST Revenue"
                value={includeGstRevenue}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#3f8600" }}
                precision={2}
                formatter={(value) =>
                  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  minHeight: 20,
                }}
              >
                AskEva Receipts
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Statistic
                title="Expense"
                value={totalExpenses}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#cf1322" }}
                precision={2}
                formatter={(value) =>
                  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  minHeight: 20,
                }}
              >
                &nbsp;
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Statistic
                title="Profit"
                value={profit}
                prefix={<RiseOutlined />}
                valueStyle={{ color: profit >= 0 ? "#3f8600" : "#cf1322" }}
                precision={2}
                formatter={(value) =>
                  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  minHeight: 20,
                }}
              >
                &nbsp;
              </div>
            </Card>
          </Col>
        </Row>

        {/* Row 2: 4 Cards - Profit Percentage & Revenue Breakdown */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Statistic
                title="Profit Percentage"
                value={profitPercentage}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{
                  color: profitPercentage >= 0 ? "#3f8600" : "#cf1322",
                }}
                precision={2}
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  minHeight: 20,
                }}
              >
                &nbsp;
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Statistic
                title="Total Handling Amount"
                value={totalHandlingAmount}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#3f8600" }}
                precision={2}
                formatter={(value) =>
                  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  minHeight: 20,
                }}
              >
                From paid transactions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Statistic
                title="Total Campaign Amount"
                value={totalCampaignAmount}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#52c41a" }}
                precision={2}
                formatter={(value) =>
                  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  minHeight: 20,
                }}
              >
                From paid transactions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Statistic
                title="Total Domain Purchase Amount"
                value={totalDomainPurchaseAmount}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "var(--accent-primary)" }}
                precision={2}
                formatter={(value) =>
                  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  minHeight: 20,
                }}
              >
                From domain purchases
              </div>
            </Card>
          </Col>
        </Row>

        {/* Row 3: 3 Cards - Payment Status */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "2px solid #faad14",
                backgroundColor: "#fffbe6",
              }}
            >
              <Statistic
                title="Total Pending Amount"
                value={Number(totalPendingAmount) || 0}
                valueStyle={{
                  color: "#faad14",
                  fontSize: 22,
                  fontWeight: "bold",
                }}
                precision={2}
                formatter={(value) => {
                  const numValue = Number(value) || 0;
                  return `₹${numValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }}
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  fontWeight: "500",
                  minHeight: 20,
                }}
              >
                Unpaid invoice amount
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "2px solid #722ed1",
                backgroundColor: "#f9f0ff",
              }}
            >
              <Statistic
                title="Hold Pending Amount"
                value={Number(totalHoldPendingAmount) || 0}
                valueStyle={{
                  color: "#722ed1",
                  fontSize: 22,
                  fontWeight: "bold",
                }}
                precision={2}
                formatter={(value) => {
                  const numValue = Number(value) || 0;
                  return `₹${numValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }}
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  fontWeight: "500",
                  minHeight: 20,
                }}
              >
                Amount from Hold invoices
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Statistic
                title="Total Collected Amount"
                value={totalCollectedAmount || 0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#3f8600" }}
                precision={2}
                formatter={(value) =>
                  `₹${value?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  minHeight: 20,
                }}
              >
                Paid invoice amount
              </div>
            </Card>
          </Col>
        </Row>

        {/* Team-wise Breakdown */}
        {teamBreakdown.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <Card title="Team-wise Expense & Profit Breakdown">
                <Spin spinning={plLoading}>
                  <Table
                    columns={[
                      {
                        title: "Team",
                        dataIndex: "teamLabel",
                        key: "team",
                        width: 200,
                      },
                      {
                        title: "Variable Expense",
                        dataIndex: "variableExpense",
                        key: "variableExpense",
                        render: (value) =>
                          `₹${(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        align: "right",
                      },
                      {
                        title: "Fixed Expense Allocated",
                        dataIndex: "fixedExpenseAllocated",
                        key: "fixedExpenseAllocated",
                        render: (value) =>
                          `₹${(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        align: "right",
                      },
                      {
                        title: "Total Team Expense",
                        dataIndex: "totalExpense",
                        key: "totalExpense",
                        render: (value) =>
                          `₹${(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        align: "right",
                        style: { fontWeight: "bold" },
                      },
                      {
                        title: "Team Profit",
                        dataIndex: "profit",
                        key: "profit",
                        render: (value) => {
                          const val = value || 0;
                          return (
                            <span
                              style={{
                                color: val >= 0 ? "#3f8600" : "#cf1322",
                                fontWeight: "bold",
                              }}
                            >
                              ₹
                              {val.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          );
                        },
                        align: "right",
                      },
                      {
                        title: "Profit Percentage",
                        dataIndex: "profitPercentage",
                        key: "profitPercentage",
                        render: (value, record) => {
                          const profitVal = record.profit || 0;
                          const isNegative = profitVal < 0;
                          const displayValue = (value || 0).toFixed(2);
                          return (
                            <span
                              style={{
                                color: !isNegative ? "#3f8600" : "#cf1322",
                                fontWeight: isNegative ? "bold" : "normal",
                              }}
                            >
                              {displayValue}%
                            </span>
                          );
                        },
                        align: "right",
                      },
                    ]}
                    dataSource={teamBreakdown}
                    rowKey="team"
                    pagination={false}
                    locale={{ emptyText: "No team expense data available" }}
                  />
                </Spin>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </Spin>
  );
};

export default PLAnalyticsPage;
