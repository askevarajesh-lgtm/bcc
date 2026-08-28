import React, { useState } from "react";
import { Typography, Row, Col, Divider, Button, message, Modal, Radio, Input, Space, Tag } from "antd";
import { useTheme } from "../../../contexts/ThemeContext";
import { useGetPaymentIntegrationQuery } from "../../../api/integrationApi";
import { CheckCircleOutlined, WalletOutlined, RocketOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const ProfessionalInvoice = ({ invoice }) => {
  const { isDark } = useTheme();
  
  // Theme Variables
  const primaryColor = isDark ? "#10b981" : "#059669"; // Greenish accent for Invoice
  const secondaryBg = isDark ? "#1e293b" : "#f8fafc";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const textSecondaryColor = isDark ? "#94a3b8" : "#64748b";
  const bodyTextColor = isDark ? "#f8fafc" : "#0f172a";
  const headerGradient = isDark 
    ? "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)" 
    : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)";

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!invoice) return null;

  const handlePaymentSubmit = async () => {
    if (paymentMethod === "bank_transfer" && !transactionId.trim()) {
      return message.error("Please enter a transaction ID.");
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/invoices/${invoice._id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMode: paymentMethod === "razorpay" ? "Razorpay" : "Bank Transfer",
          transactionId: paymentMethod === "razorpay" ? `pay_mock_${Math.random().toString(36).substring(7)}` : transactionId
        })
      });
      const data = await res.json();
      if (data.success) {
        message.success("Payment recorded successfully!");
        setIsPaymentModalVisible(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        message.error(data.message || "Failed to process payment");
      }
    } catch (err) {
      console.error(err);
      message.error("An error occurred while processing payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyId = invoice?.agencyId?._id || invoice?.agencyId || invoice?.adminId?._id || invoice?.adminId;
  const { data: paymentData } = useGetPaymentIntegrationQuery(companyId, { skip: !companyId });
  const paymentIntegration = paymentData?.data?.integration;
  const paymentConfig = paymentIntegration?.isActive ? paymentIntegration.config : null;

  // Process items
  const masterItems = invoice.proposalId?.masterItems || [];
  const tableItems = [];
  masterItems.forEach(item => {
    tableItems.push({
      ...item,
      _id: item._id ? `${item._id}-service` : `service-${Math.random()}`
    });
    if (item.isCampaign && item.campaignDetails) {
      tableItems.push({
        _id: item._id ? `${item._id}-campaign` : `campaign-${Math.random()}`,
        name: `${item.name} - Campaign Execution`,
        description: `Days: ${item.campaignDetails.numberOfDays} | Daily Budget: ₹${item.campaignDetails.dailyBudget?.toLocaleString()} (* Paid directly to Meta)`,
        category: 'Campaign',
        handlingDuration: item.handlingDuration || 'N/A',
        price: item.campaignDetails.campaignAmount,
        isCampaignRow: true,
      });
    }
  });

  const sumOfItems = tableItems.reduce((acc, item) => acc + (item.price || 0), 0);
  const invoiceSubtotal = invoice.amount || 0;
  const hasAdjustment = sumOfItems !== invoiceSubtotal && sumOfItems > 0;

  return (
    <div
      className="professional-invoice"
      style={{
        background: isDark ? "#0f172a" : "#ffffff",
        color: bodyTextColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: `1px solid ${cardBorder}`
      }}
      id="printable-invoice"
    >
      {/* Hero Header Section */}
      <div style={{
        background: headerGradient,
        padding: "60px 48px",
        borderBottom: `1px solid ${cardBorder}`,
        position: 'relative'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Tag color="green" style={{ marginBottom: 16, fontSize: '14px', padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            Tax Invoice
          </Tag>
          <Title level={1} style={{ 
            margin: 0, 
            fontSize: "42px", 
            fontWeight: 800,
            color: bodyTextColor,
            lineHeight: 1.2
          }}>
            Invoice #{invoice.invoiceNumber}
          </Title>
          <Text style={{ 
            fontSize: "18px", 
            color: textSecondaryColor,
            display: 'block',
            marginTop: '12px'
          }}>
            For professional services rendered
          </Text>
        </div>
      </div>

      {/* Stakeholders Section */}
      <div style={{ padding: "48px" }}>
        <Row gutter={48}>
          <Col xs={24} md={12}>
            <div style={{ 
              padding: "24px", 
              background: secondaryBg, 
              borderRadius: "8px",
              height: '100%',
              border: `1px solid ${cardBorder}`
            }}>
              <Text style={{ fontSize: "12px", fontWeight: 700, color: textSecondaryColor, textTransform: "uppercase", letterSpacing: "1px" }}>
                Billed To
              </Text>
              <Title level={4} style={{ marginTop: 8, marginBottom: 4, color: bodyTextColor }}>
                {invoice.clientId?.name || "Client Name"}
              </Title>
              {invoice.clientId?.email && <Text style={{ display: 'block', color: textSecondaryColor }}>{invoice.clientId.email}</Text>}
              {invoice.clientId?.phone && <Text style={{ display: 'block', color: textSecondaryColor }}>{invoice.clientId.phone}</Text>}
              {invoice.clientId?.address && <Text style={{ display: 'block', color: textSecondaryColor, marginTop: 8 }}>{invoice.clientId.address}</Text>}
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ 
              padding: "24px", 
              background: secondaryBg, 
              borderRadius: "8px",
              height: '100%',
              border: `1px solid ${cardBorder}`
            }}>
              <Text style={{ fontSize: "12px", fontWeight: 700, color: textSecondaryColor, textTransform: "uppercase", letterSpacing: "1px" }}>
                From
              </Text>
              <Title level={4} style={{ marginTop: 8, marginBottom: 4, color: bodyTextColor }}>
                {invoice.agencyId?.name || invoice.adminId?.name || "Our Agency"}
              </Title>
              <Text style={{ display: 'block', color: textSecondaryColor }}>
                {invoice.agencyId?.industry || invoice.adminId?.industry || "Agency & Consultancy Services"}
              </Text>
              <Text style={{ display: 'block', color: textSecondaryColor }}>
                {invoice.agencyId?.email || invoice.adminId?.email || ""}
              </Text>
              
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${cardBorder}` }}>
                <Row>
                  <Col span={12}>
                    <Text style={{ fontSize: "12px", color: textSecondaryColor, display: 'block' }}>Date of Issue</Text>
                    <Text strong>{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : new Date(invoice.createdAt).toLocaleDateString()}</Text>
                  </Col>
                  <Col span={12}>
                    <Text style={{ fontSize: "12px", color: textSecondaryColor, display: 'block' }}>Due Date</Text>
                    <Text strong style={{ color: primaryColor }}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon Receipt"}</Text>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: 0, borderColor: cardBorder }} />

      {/* Invoice Items Section */}
      <div style={{ padding: "48px" }}>
        <div style={{ marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0, color: bodyTextColor }}>Description of Services</Title>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {tableItems.map((pkg, idx) => (
            <div key={pkg._id || idx} style={{ 
              border: `1px solid ${cardBorder}`, 
              borderRadius: "8px",
              background: cardBg,
              padding: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              pageBreakInside: "avoid"
            }}>
              <div style={{ flex: 1, paddingRight: "24px" }}>
                <Title level={5} style={{ margin: 0, color: bodyTextColor, display: "flex", alignItems: "center", gap: "8px" }}>
                  {pkg.name}
                </Title>
                {pkg.description && (
                  <Paragraph style={{ fontSize: "14px", color: textSecondaryColor, marginTop: 8, marginBottom: 0 }}>
                    {pkg.description}
                  </Paragraph>
                )}
                
                {(pkg.categories?.length > 0 || pkg.applicableAccess?.length > 0) && (
                  <div style={{ marginTop: 16, display: 'flex', gap: '32px' }}>
                    {pkg.categories?.length > 0 && (
                      <div>
                        <Text style={{ fontSize: "12px", fontWeight: 600, color: textSecondaryColor, textTransform: "uppercase" }}>Categories</Text>
                        <ul style={{ paddingLeft: '16px', margin: '4px 0 0 0', color: bodyTextColor, fontSize: '13px' }}>
                          {pkg.categories.map((cat, index) => (
                            <li key={index}>{cat.name || cat.categoryName}: <strong>{cat.count || cat.quantity}</strong></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pkg.applicableAccess?.length > 0 && (
                      <div>
                        <Text style={{ fontSize: "12px", fontWeight: 600, color: textSecondaryColor, textTransform: "uppercase" }}>Deliverables</Text>
                        <ul style={{ paddingLeft: '16px', margin: '4px 0 0 0', color: bodyTextColor, fontSize: '13px' }}>
                          {pkg.applicableAccess.map((acc, index) => (
                            <li key={index}>{acc.name}: <strong>{acc.value}</strong></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", minWidth: "150px" }}>
                <Text style={{ fontSize: "12px", color: textSecondaryColor, display: "block", marginBottom: "4px" }}>Amount</Text>
                <Text style={{ fontSize: "18px", fontWeight: 700, color: bodyTextColor }}>
                  ₹{(pkg.price || 0).toLocaleString()}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Summary */}
      <div className="print-no-break" style={{ background: secondaryBg, padding: "48px", borderTop: `1px solid ${cardBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          
          {/* Payment Status & Actions (Left Side) */}
          <div style={{ flex: 1, paddingRight: '48px' }}>
            <div style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: "13px", fontWeight: 600, color: textSecondaryColor, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Payment Status
              </Text>
              <Tag color={invoice.paymentStatus === "Paid" ? "green" : "orange"} style={{ padding: '6px 12px', fontSize: '14px', fontWeight: 600, borderRadius: '6px' }}>
                {invoice.paymentStatus?.toUpperCase() || "PENDING"}
              </Tag>
              
              <div style={{ marginTop: 16 }}>
                <Text style={{ fontSize: "14px", color: textSecondaryColor, display: "block" }}>
                  <strong>Mode:</strong> {invoice.paymentMode || "Bank Transfer"}
                </Text>
                {invoice.transactionId && (
                  <Text style={{ fontSize: "14px", color: textSecondaryColor, display: "block", marginTop: 4 }}>
                    <strong>Transaction ID:</strong> {invoice.transactionId}
                  </Text>
                )}
              </div>
            </div>

            {invoice.paymentStatus !== "Paid" && (
              <div className="no-print" style={{ padding: '24px', background: cardBg, borderRadius: '8px', border: `1px solid ${primaryColor}`, display: 'inline-block' }}>
                <Text strong style={{ display: 'block', marginBottom: 12, fontSize: '16px' }}>Ready to complete your payment?</Text>
                <Button type="primary" size="large" icon={<WalletOutlined />} style={{ backgroundColor: primaryColor, borderColor: primaryColor }} onClick={() => setIsPaymentModalVisible(true)}>
                  Pay Invoice Now
                </Button>
              </div>
            )}
          </div>

          {/* Totals Box (Right Side) */}
          <div style={{ flexShrink: 0, width: '400px' }}>
            <div className="totals-box" style={{ 
              background: cardBg, 
              padding: "32px", 
              borderRadius: "12px", 
              border: `1px solid ${cardBorder}`,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            }}>
              
              {hasAdjustment && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <Text style={{ fontSize: "15px", color: textSecondaryColor }}>Items Total:</Text>
                    <Text strong style={{ fontSize: "15px" }}>₹{sumOfItems.toLocaleString()}</Text>
                  </div>
                  {sumOfItems > invoiceSubtotal ? (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <Text style={{ fontSize: "15px", color: textSecondaryColor }}>Discount / Adjustment:</Text>
                      <Text strong style={{ fontSize: "15px", color: "#ef4444" }}>-₹{(sumOfItems - invoiceSubtotal).toLocaleString()}</Text>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <Text style={{ fontSize: "15px", color: textSecondaryColor }}>Additional Charges:</Text>
                      <Text strong style={{ fontSize: "15px" }}>+₹{(invoiceSubtotal - sumOfItems).toLocaleString()}</Text>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ fontSize: "15px", color: textSecondaryColor }}>Subtotal:</Text>
                <Text strong style={{ fontSize: "15px" }}>₹{invoiceSubtotal.toLocaleString()}</Text>
              </div>

              {invoice.discount > 0 && !hasAdjustment && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <Text style={{ fontSize: "15px", color: textSecondaryColor }}>Discount:</Text>
                  <Text strong style={{ fontSize: "15px", color: "#ef4444" }}>-₹{invoice.discount.toLocaleString()}</Text>
                </div>
              )}

              {invoice.tax > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <Text style={{ fontSize: "15px", color: textSecondaryColor }}>Tax:</Text>
                  <Text strong style={{ fontSize: "15px" }}>₹{invoice.tax.toLocaleString()}</Text>
                </div>
              )}

              <Divider style={{ margin: "16px 0", borderColor: cardBorder }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: "16px", textTransform: "uppercase", fontWeight: 700, color: bodyTextColor }}>
                  Grand Total
                </Text>
                <Text style={{ fontSize: "32px", fontWeight: 800, color: primaryColor }}>
                  ₹{(invoice.grandTotal || 0).toLocaleString()}
                </Text>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Notes */}
      <div className="print-no-break" style={{ padding: "32px 48px", background: cardBg, borderTop: `1px solid ${cardBorder}` }}>
        <Text style={{ fontSize: "13px", color: textSecondaryColor, display: "block", textAlign: "center" }}>
          Please pay the invoice amount within the due date. Late payments may be subject to a fee. Thank you for your business!
        </Text>
      </div>

      {/* Payment Modal */}
      <Modal
        title="Pay Invoice"
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsPaymentModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" style={{ backgroundColor: primaryColor }} loading={isSubmitting} onClick={handlePaymentSubmit}>
            Confirm Payment
          </Button>
        ]}
      >
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 18 }}>Amount Due: ₹{(invoice.grandTotal || 0).toLocaleString()}</Text>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Payment Method:</Text>
          <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)} value={paymentMethod}>
            <Space direction="vertical">
              <Radio value="bank_transfer">Bank Transfer / Offline Payment</Radio>
              {paymentConfig && paymentConfig.razorpayKeyId && (
                <Radio value="razorpay">Razorpay (Online Gateway)</Radio>
              )}
            </Space>
          </Radio.Group>
        </div>

        {paymentMethod === "bank_transfer" && (
          <div style={{ marginTop: 16 }}>
            <Text style={{ display: 'block', marginBottom: 8 }}>Please transfer the amount to the agency's bank account and enter the transaction reference number below.</Text>
            <Input 
              placeholder="Enter Transaction ID / Reference No." 
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
        )}

        {paymentMethod === "razorpay" && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(5, 150, 105, 0.1)', borderRadius: 8 }}>
            <Text style={{ color: primaryColor }}>Clicking "Confirm Payment" will securely process your payment via Razorpay. (Mocked for demonstration)</Text>
          </div>
        )}
      </Modal>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide layout wrappers and UI elements completely */
          .ant-layout-sider, .ant-layout-header, aside, header, nav, 
          .ant-tabs-nav, .ant-space, .ant-btn, button, 
          .ant-modal-close, .ant-modal-footer, .ant-breadcrumb,
          .no-print {
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

          .professional-invoice {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          
          #printable-invoice {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box;
          }
          
          /* Force light mode styles for printing */
          .professional-invoice div[style*="background"] {
             background: #ffffff !important;
             border-color: #e2e8f0 !important;
          }
          
          .professional-invoice div[style*="linear-gradient"] {
             background: #f8fafc !important;
             padding: 40px 32px !important; /* reduce padding */
          }

          /* Reduce paddings globally for print */
          .professional-invoice > div {
             padding-left: 32px !important;
             padding-right: 32px !important;
          }
          
          .totals-box {
             padding: 16px 24px !important;
             border: 2px solid #e2e8f0 !important;
             width: 320px !important;
          }

          .print-no-break {
             page-break-inside: avoid !important;
          }

          .professional-invoice .ant-typography, 
          .professional-invoice span, 
          .professional-invoice div {
             color: #0f172a !important;
          }

          .professional-invoice .ant-tag {
             border: 1px solid #e2e8f0 !important;
             background: #f8fafc !important;
             color: #0f172a !important;
          }
          
          /* Keep primary green colors for accents */
          .professional-invoice .anticon, 
          .professional-invoice [style*="color: #10b981"],
          .professional-invoice [style*="color: #059669"],
          .professional-invoice [style*="color: rgb(16, 185, 129)"],
          .professional-invoice [style*="color: rgb(5, 150, 105)"] {
             color: #059669 !important;
          }
          
          /* Ensure backgrounds print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfessionalInvoice;
