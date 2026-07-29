import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Tabs, Button, Typography, message, Table, Spin, Tag, Space, Dropdown } from "antd";
import { ArrowLeftOutlined, PrinterOutlined, SendOutlined, MailOutlined, DashboardOutlined, WhatsAppOutlined } from "@ant-design/icons";
import ProfessionalInvoice from "./components/ProfessionalInvoice";
import InvoiceTransactionsTab from "./components/InvoiceTransactionsTab";
import { useAuth } from "../../contexts/AuthContext";

const { Title } = Typography;

// Roles that are considered "client" — should NOT see Send to Client
const CLIENT_ROLES = ['agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user', 'client'];

const InvoiceViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const isClientRole = CLIENT_ROLES.includes(role);
  // Detect if we are inside the /client/* layout
  const isClientPanel = location.pathname.startsWith('/client');

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handleBack = () => {
    if (isClientPanel) {
      navigate('/client/billing');
    } else {
      navigate(-1);
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInvoice(data.data);
      } else {
        message.error("Failed to fetch invoice");
        handleBack();
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      message.error("Error loading invoice");
      handleBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async (method) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ method })
      });
      const data = await res.json();
      if (data.success) {
        message.success(data.message);
        setInvoice(data.data);
      } else {
        message.error(data.message || "Failed to send invoice");
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      message.error("Error sending invoice");
    }
  };

  const sendMenuItems = [
    { key: "email", icon: <MailOutlined />, label: "Email" },
    { key: "whatsapp", icon: <WhatsAppOutlined />, label: "WhatsApp" },
    { key: "dashboard", icon: <DashboardOutlined />, label: "Client Dashboard" },
  ];

  const transactionColumns = [
    {
      title: "Transaction Date",
      key: "date",
      render: (_, record) => new Date(record.updatedAt || record.createdAt).toLocaleDateString(),
    },
    {
      title: "Payment Mode",
      dataIndex: "paymentMode",
      key: "paymentMode",
      render: (mode) => mode || "N/A",
    },
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      render: (txId) => txId || "N/A",
    },
    {
      title: "Amount",
      dataIndex: "grandTotal",
      key: "amount",
      render: (amount) => `\u20b9${Number(amount || 0).toLocaleString()}`,
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      key: "status",
      render: (status) => (
        <Tag color={status === "Paid" ? "green" : "orange"}>
          {status || "Pending"}
        </Tag>
      ),
    },
  ];

  const transactions =
    invoice?.paymentStatus === "Paid" || invoice?.transactionId
      ? [invoice]
      : [];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <Spin size="large" />
      </div>
    );
  }

  // ── CLIENT VIEW: clean invoice only, no Send to Client ──
  if (isClientRole) {
    return (
      <div className="page-container">
        <Space style={{ marginBottom: 24 }} wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Back to Billing
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Invoice: {invoice?.invoiceNumber}
          </Title>
          <Tag
            color={invoice?.paymentStatus === "Paid" ? "green" : "orange"}
            style={{ fontWeight: 700, fontSize: 13, padding: "2px 12px" }}
          >
            {invoice?.paymentStatus || "Pending"}
          </Tag>
        </Space>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print / Save as PDF
          </Button>
        </div>

        <Card bodyStyle={{ padding: 0 }} bordered={false}>
          <ProfessionalInvoice invoice={invoice} />
        </Card>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            #printable-invoice, #printable-invoice * { visibility: visible; }
            #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
            .ant-space, .ant-btn, .ant-tag { display: none !important; }
            .page-container { padding: 0 !important; margin: 0 !important; }
          }
        `}</style>
      </div>
    );
  }

  // ── AGENCY VIEW: full controls, Send to Client, Transactions tab ──
  const tabItems = [
    {
      key: "1",
      label: "Invoice",
      children: (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 12 }}>
            <Dropdown
              menu={{
                items: sendMenuItems,
                onClick: ({ key }) => handleSend(key)
              }}
              placement="bottomRight"
            >
              <Button type="primary" icon={<SendOutlined />}>
                Send to Client
              </Button>
            </Dropdown>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print / Save as PDF
            </Button>
          </div>
          <Card bodyStyle={{ padding: 0 }} bordered={false}>
            <ProfessionalInvoice invoice={invoice} />
          </Card>
        </div>
      ),
    },
    {
      key: "2",
      label: "Transactions",
      children: <InvoiceTransactionsTab invoice={invoice} isClientRole={isClientRole} />,
    },
  ];

  return (
    <div className="page-container">
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          Back
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          Invoice: {invoice?.invoiceNumber}
        </Title>
      </Space>

      <Tabs defaultActiveKey="1" items={tabItems} className="invoice-tabs" />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
          .ant-tabs-nav, .ant-space, .ant-btn { display: none !important; }
          .page-container { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceViewPage;

