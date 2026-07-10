import React from "react";
import { Typography, Row, Col, Table, Divider } from "antd";
import { useTheme } from "../../../contexts/ThemeContext";

const { Title, Text } = Typography;

const ProfessionalInvoice = ({ invoice }) => {
  const { isDark } = useTheme();
  const textSecondaryColor = isDark ? "#c7d2e4" : "#666";
  const sectionLabelColor = isDark ? "#c7d2e4" : "#8c8c8c";
  const dividerColor = isDark ? "#30425f" : "#e8e8e8";
  const footerTextColor = isDark ? "#c7d2e4" : "#666";
  const bodyTextColor = isDark ? "#f8fafc" : "#0b1220";

  if (!invoice) return null;

  // Derive items from masterItems if available
  const masterItems = invoice.proposalId?.masterItems || [];
  
  const columns = [
    {
      title: "Description",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (text) => text || "Service",
    },
    {
      title: "Duration",
      dataIndex: "handlingDuration",
      key: "handlingDuration",
      render: (text) => text || "N/A",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      align: "right",
      render: (val) => `₹${Number(val || 0).toLocaleString()}`,
    },
    {
      title: "Amount",
      dataIndex: "amount", // usually price * quantity, but here we assume 1 or use price directly since quantity is abstracted in categories for projects
      key: "amount",
      align: "right",
      render: (_, record) => `₹${Number(record.price || 0).toLocaleString()}`,
    },
  ];

  return (
    <div
      className="professional-invoice"
      style={{
        padding: "20px 40px",
        background: isDark ? "#111c31" : "#fff",
        color: bodyTextColor,
        fontFamily: "'Inter', sans-serif",
      }}
      id="printable-invoice"
    >
      {/* Header Section */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 40 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: isDark ? "#7aa6ff" : "#1890ff" }}>
            INVOICE
          </Title>
          <Text style={{ fontSize: "16px", color: textSecondaryColor }}>
            #{invoice.invoiceNumber}
          </Text>
        </Col>
        <Col style={{ textAlign: "right" }}>
          {/* Placeholder for Logo */}
          <Title level={3} style={{ margin: 0, color: bodyTextColor }}>
            {invoice.agencyId?.name || invoice.adminId?.name || "BCC SEO"}
          </Title>
          <Text style={{ color: textSecondaryColor }}>
            Agency & Consultancy Services
            <br />
            contact@bccseo.com
          </Text>
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0", borderColor: dividerColor }} />

      {/* Addresses and Dates */}
      <Row justify="space-between" style={{ marginBottom: 40 }}>
        <Col span={8}>
          <Text strong style={{ fontSize: "16px", color: sectionLabelColor, textTransform: "uppercase" }}>Billed To:</Text>
          <div style={{ marginTop: 8 }}>
            <Title level={5} style={{ margin: 0 }}>
              {invoice.clientId?.name || "Client Name"}
            </Title>
            <Text>
              {invoice.clientId?.address || ""}
              <br />
              {invoice.clientId?.email || ""}
              {invoice.clientId?.phone && (
                <>
                  <br />
                  {invoice.clientId.phone}
                </>
              )}
            </Text>
          </div>
        </Col>
        <Col span={8} style={{ textAlign: "right" }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ color: sectionLabelColor, textTransform: "uppercase" }}>Date of Issue:</Text>
            <br />
            <Text strong>
              {invoice.invoiceDate
                ? new Date(invoice.invoiceDate).toLocaleDateString()
                : new Date(invoice.createdAt).toLocaleDateString()}
            </Text>
          </div>
          <div>
            <Text strong style={{ color: sectionLabelColor, textTransform: "uppercase" }}>Due Date:</Text>
            <br />
            <Text strong>
              {invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString()
                : "Upon Receipt"}
            </Text>
          </div>
        </Col>
      </Row>

      {/* Items Table */}
      <Table
        dataSource={masterItems}
        columns={columns}
        rowKey="_id"
        pagination={false}
        bordered={false}
        style={{ marginBottom: 40 }}
      />

      {/* Totals Section */}
      <Row justify="end">
        <Col span={10}>
          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <Text strong>Subtotal:</Text>
            <Text>₹{(invoice.amount || 0).toLocaleString()}</Text>
          </Row>
          {invoice.discount > 0 && (
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text strong>Discount:</Text>
              <Text style={{ color: "#f5222d" }}>
                -₹{invoice.discount.toLocaleString()}
              </Text>
            </Row>
          )}
          {invoice.tax > 0 && (
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text strong>Tax:</Text>
              <Text>₹{invoice.tax.toLocaleString()}</Text>
            </Row>
          )}
          <Divider style={{ margin: "12px 0", borderColor: "#e8e8e8" }} />
          <Row justify="space-between">
            <Title level={4} style={{ margin: 0 }}>
              Grand Total:
            </Title>
            <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
              ₹{(invoice.grandTotal || 0).toLocaleString()}
            </Title>
          </Row>
        </Col>
      </Row>

      {/* Footer / Payment Details */}
      <div style={{ marginTop: 60, borderTop: `2px solid ${dividerColor}`, paddingTop: 24 }}>
        <Row justify="space-between">
          <Col span={12}>
            <Title level={5} style={{ color: sectionLabelColor, textTransform: "uppercase", fontSize: "14px" }}>Payment Details</Title>
            <Text>
              <Text strong>Status:</Text>{" "}
              <Text
                strong
                style={{
                  color: invoice.paymentStatus === "Paid" ? "#52c41a" : "#f5222d",
                }}
              >
                {invoice.paymentStatus?.toUpperCase() || "PENDING"}
              </Text>
              <br />
              <Text strong>Mode:</Text> {invoice.paymentMode || "Bank Transfer"}
              <br />
              {invoice.transactionId && <><Text strong>Transaction ID:</Text> {invoice.transactionId}</>}
            </Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Title level={5} style={{ color: sectionLabelColor, textTransform: "uppercase", fontSize: "14px" }}>Terms & Conditions</Title>
            <Text style={{ fontSize: "12px", color: footerTextColor }}>
              Please pay the invoice amount within the due date.
              <br />
              Late payments may be subject to a fee.
              <br />
              Thank you for your business!
            </Text>
          </Col>
        </Row>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide layout wrappers and UI elements completely */
          .ant-layout-sider, .ant-layout-header, aside, header, nav, 
          .ant-tabs-nav, .ant-space, .ant-btn, button, 
          .ant-modal-close, .ant-modal-footer, .ant-breadcrumb {
            display: none !important;
          }
          
          /* Reset containers to take full width */
          .ant-layout, .ant-layout-content, main, body, html {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }

          .page-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }

          .ant-card {
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          
          .ant-card-body {
            padding: 0 !important;
          }

          #printable-invoice {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box;
          }

          .ant-table-wrapper {
            margin-bottom: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfessionalInvoice;
