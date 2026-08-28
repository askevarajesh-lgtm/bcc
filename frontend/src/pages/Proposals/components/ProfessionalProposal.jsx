import React from "react";
import { Typography, Row, Col, Divider, Card, Tag, Space } from "antd";
import { useTheme } from "../../../contexts/ThemeContext";
import { CheckCircleOutlined, CalendarOutlined, RocketOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const ProfessionalProposal = ({ proposal }) => {
  const { isDark } = useTheme();
  
  // Theme Variables
  const primaryColor = isDark ? "#3b82f6" : "#2563eb";
  const secondaryBg = isDark ? "#1e293b" : "#f8fafc";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const textSecondaryColor = isDark ? "#94a3b8" : "#64748b";
  const bodyTextColor = isDark ? "#f8fafc" : "#0f172a";
  const headerGradient = isDark 
    ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" 
    : "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)";

  if (!proposal) return null;

  // Process packages
  const packages = [];
  
  if (proposal.masterItems) {
    proposal.masterItems.forEach(item => {
      packages.push({
        ...item,
        isCustom: false,
        _id: item._id ? `${item._id}-service` : `service-${Math.random()}`
      });
      if (item.isCampaign && item.campaignDetails) {
        packages.push({
          ...item,
          _id: item._id ? `${item._id}-campaign` : `campaign-${Math.random()}`,
          name: `${item.name} (Campaign Setup & Management)`,
          description: `Includes campaign execution and monitoring. Ads budget is paid directly to platforms.`,
          isCampaignRow: true,
          price: item.campaignDetails.campaignAmount,
        });
      }
    });
  }

  if (proposal.customMasterItems) {
    proposal.customMasterItems.forEach(item => {
      packages.push({
        ...item,
        isCustom: true,
        name: item.customPackageName || 'Custom Solution',
        categories: item.customCategories,
        applicableAccess: item.customApplicableAccess,
        price: item.amount || 0,
        _id: item._id ? `${item._id}-custom` : `custom-${Math.random()}`
      });
    });
  }

  return (
    <div
      className="professional-proposal"
      style={{
        background: isDark ? "#0f172a" : "#ffffff",
        color: bodyTextColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: `1px solid ${cardBorder}`
      }}
      id="printable-proposal"
    >
      {/* Hero Header Section */}
      <div style={{
        background: headerGradient,
        padding: "60px 48px",
        borderBottom: `1px solid ${cardBorder}`,
        position: 'relative'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Tag color="blue" style={{ marginBottom: 16, fontSize: '14px', padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            Project Proposal
          </Tag>
          <Title level={1} style={{ 
            margin: 0, 
            fontSize: "42px", 
            fontWeight: 800,
            color: bodyTextColor,
            lineHeight: 1.2
          }}>
            {proposal.name}
          </Title>
          <Text style={{ 
            fontSize: "18px", 
            color: textSecondaryColor,
            display: 'block',
            marginTop: '12px'
          }}>
            Proposal Ref: #{proposal.proposalNumber}
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
                Prepared For
              </Text>
              <Title level={4} style={{ marginTop: 8, marginBottom: 4, color: bodyTextColor }}>
                {proposal.clientId?.name || "Valued Client"}
              </Title>
              {proposal.clientId?.email && <Text style={{ display: 'block', color: textSecondaryColor }}>{proposal.clientId.email}</Text>}
              {proposal.clientId?.phone && <Text style={{ display: 'block', color: textSecondaryColor }}>{proposal.clientId.phone}</Text>}
              {proposal.clientId?.address && <Text style={{ display: 'block', color: textSecondaryColor, marginTop: 8 }}>{proposal.clientId.address}</Text>}
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
                Prepared By
              </Text>
              <Title level={4} style={{ marginTop: 8, marginBottom: 4, color: bodyTextColor }}>
                {proposal.agencyId?.name || proposal.adminId?.name || "Our Agency"}
              </Title>
              <Text style={{ display: 'block', color: textSecondaryColor }}>
                {proposal.agencyId?.industry || proposal.adminId?.industry || "Agency & Consultancy Services"}
              </Text>
              <Text style={{ display: 'block', color: textSecondaryColor }}>
                {proposal.agencyId?.email || proposal.adminId?.email || ""}
              </Text>
              
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${cardBorder}` }}>
                <Row>
                  <Col span={12}>
                    <Text style={{ fontSize: "12px", color: textSecondaryColor, display: 'block' }}>Date</Text>
                    <Text strong>{proposal.proposalDate ? new Date(proposal.proposalDate).toLocaleDateString() : new Date(proposal.createdAt).toLocaleDateString()}</Text>
                  </Col>
                  <Col span={12}>
                    <Text style={{ fontSize: "12px", color: textSecondaryColor, display: 'block' }}>Valid Until</Text>
                    <Text strong>{proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString() : "N/A"}</Text>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: 0, borderColor: cardBorder }} />

      {/* Proposed Solutions Section */}
      <div style={{ padding: "48px" }}>
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: bodyTextColor }}>Proposed Solutions</Title>
          <Paragraph style={{ fontSize: "16px", color: textSecondaryColor, marginTop: 8, maxWidth: "800px" }}>
            Based on our understanding of your goals, we have crafted the following packages to deliver the best results. Each package includes dedicated strategy, execution, and reporting.
          </Paragraph>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {packages.map((pkg, idx) => (
            <div key={pkg._id || idx} style={{ 
              border: `1px solid ${cardBorder}`, 
              borderRadius: "12px",
              background: cardBg,
              overflow: "hidden",
              pageBreakInside: "avoid"
            }}>
              {/* Package Header */}
              <div style={{ 
                padding: "20px 24px", 
                borderBottom: `1px solid ${cardBorder}`,
                background: secondaryBg,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <Title level={4} style={{ margin: 0, color: bodyTextColor, display: "flex", alignItems: "center", gap: "8px" }}>
                    {pkg.isCampaignRow ? <RocketOutlined style={{ color: primaryColor }} /> : <CheckCircleOutlined style={{ color: primaryColor }} />}
                    {pkg.name}
                  </Title>
                  {(pkg.category || pkg.handlingDuration) && (
                    <Space style={{ marginTop: 8 }} size="middle">
                      {pkg.category && <Tag bordered={false}>{pkg.category}</Tag>}
                      {pkg.handlingDuration && (
                        <Text style={{ color: textSecondaryColor, fontSize: "13px" }}>
                          <CalendarOutlined style={{ marginRight: 4 }} /> 
                          {pkg.handlingDuration}
                        </Text>
                      )}
                    </Space>
                  )}
                </div>
                {!pkg.isCampaignRow && pkg.price > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <Text style={{ fontSize: "20px", fontWeight: 700, color: primaryColor }}>
                      ₹{(pkg.price || 0).toLocaleString()}
                    </Text>
                  </div>
                )}
                {pkg.isCampaignRow && (
                   <div style={{ textAlign: "right" }}>
                   <Text style={{ fontSize: "14px", color: textSecondaryColor, display: "block" }}>Platform Budget</Text>
                   <Text style={{ fontSize: "20px", fontWeight: 700, color: bodyTextColor }}>
                     ₹{(pkg.price || 0).toLocaleString()}
                   </Text>
                 </div>
                )}
              </div>

              {/* Package Details */}
              <div style={{ padding: "24px" }}>
                {pkg.description && (
                  <Paragraph style={{ fontSize: "15px", color: textSecondaryColor, marginBottom: 24 }}>
                    {pkg.description}
                  </Paragraph>
                )}
                
                {pkg.isCampaignRow && pkg.campaignDetails && (
                  <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                      <div style={{ padding: "16px", background: secondaryBg, borderRadius: "8px" }}>
                        <Text style={{ fontSize: "12px", color: textSecondaryColor, display: 'block', marginBottom: 4 }}>Duration</Text>
                        <Text strong style={{ fontSize: "16px" }}>{pkg.campaignDetails.numberOfDays} Days</Text>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ padding: "16px", background: secondaryBg, borderRadius: "8px" }}>
                        <Text style={{ fontSize: "12px", color: textSecondaryColor, display: 'block', marginBottom: 4 }}>Daily Budget</Text>
                        <Text strong style={{ fontSize: "16px" }}>₹{pkg.campaignDetails.dailyBudget?.toLocaleString()}</Text>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ padding: "16px", background: secondaryBg, borderRadius: "8px" }}>
                        <Text style={{ fontSize: "12px", color: textSecondaryColor, display: 'block', marginBottom: 4 }}>Total Ads Budget</Text>
                        <Text strong style={{ fontSize: "16px" }}>₹{pkg.price?.toLocaleString()}</Text>
                      </div>
                    </Col>
                  </Row>
                )}

                <Row gutter={[48, 24]}>
                  {pkg.categories && pkg.categories.length > 0 && (
                    <Col xs={24} sm={12}>
                      <Text strong style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", color: bodyTextColor, display: 'block', marginBottom: 12 }}>
                        Scope & Quantities
                      </Text>
                      <ul style={{ paddingLeft: '20px', margin: 0, color: textSecondaryColor, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pkg.categories.map((cat, index) => (
                          <li key={`cat-${index}`} style={{ fontSize: "15px" }}>
                            <span style={{ color: bodyTextColor, fontWeight: 500 }}>{cat.categoryName || cat.name}</span>: {cat.count || cat.quantity}
                          </li>
                        ))}
                      </ul>
                    </Col>
                  )}
                  {pkg.applicableAccess && pkg.applicableAccess.length > 0 && (
                    <Col xs={24} sm={12}>
                      <Text strong style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", color: bodyTextColor, display: 'block', marginBottom: 12 }}>
                        Deliverables & Access
                      </Text>
                      <ul style={{ paddingLeft: '20px', margin: 0, color: textSecondaryColor, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pkg.applicableAccess.map((access, index) => (
                          <li key={`acc-${index}`} style={{ fontSize: "15px" }}>
                            <span style={{ color: bodyTextColor, fontWeight: 500 }}>{access.name}</span>: {access.value}
                          </li>
                        ))}
                      </ul>
                    </Col>
                  )}
                </Row>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Summary */}
      <div className="print-no-break" style={{ background: secondaryBg, padding: "48px", borderTop: `1px solid ${cardBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap' }}>
          <div style={{ flex: 1, paddingRight: '24px' }}>
            <Title level={2} style={{ margin: 0, color: bodyTextColor }}>Investment Summary</Title>
            <Paragraph style={{ fontSize: "15px", color: textSecondaryColor, marginTop: 8, marginBottom: 0 }}>
              The total proposed value for the selected solutions. This is an estimate based on current scope.
            </Paragraph>
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div className="investment-box" style={{ 
              display: "inline-block", 
              background: cardBg, 
              padding: "24px 40px", 
              borderRadius: "12px", 
              border: `1px solid ${cardBorder}`,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            }}>
              <Text style={{ fontSize: "14px", textTransform: "uppercase", fontWeight: 600, color: textSecondaryColor, display: "block", marginBottom: 8 }}>
                Total Proposal Value
              </Text>
              <Text style={{ fontSize: "36px", fontWeight: 800, color: primaryColor }}>
                ₹{(proposal.grandTotal || 0).toLocaleString()}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="print-no-break" style={{ padding: "32px 48px", background: cardBg, borderTop: `1px solid ${cardBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap' }}>
          <div>
            <Space>
              <Text strong style={{ color: textSecondaryColor }}>Status:</Text>
              <Tag color={proposal.status === "Approved" ? "green" : "orange"} style={{ margin: 0, fontWeight: 600 }}>
                {proposal.status?.toUpperCase() || "DRAFT"}
              </Tag>
            </Space>
          </div>
          <div style={{ textAlign: "right" }}>
            <Text style={{ fontSize: "13px", color: textSecondaryColor }}>
              This document is a proposal of services and is valid until {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString() : "further notice"}.
            </Text>
          </div>
        </div>
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

          .professional-proposal {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          
          #printable-proposal {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box;
          }
          
          /* Force light mode styles for printing */
          .professional-proposal div[style*="background"] {
             background: #ffffff !important;
             border-color: #e2e8f0 !important;
          }
          
          .professional-proposal div[style*="linear-gradient"] {
             background: #f8fafc !important;
             padding: 40px 32px !important; /* reduce padding */
          }

          /* Reduce paddings globally for print */
          .professional-proposal > div {
             padding-left: 32px !important;
             padding-right: 32px !important;
          }
          
          .investment-box {
             padding: 16px 24px !important;
             border: 2px solid #e2e8f0 !important;
          }

          .print-no-break {
             page-break-inside: avoid !important;
          }

          .professional-proposal .ant-typography, 
          .professional-proposal span, 
          .professional-proposal div {
             color: #0f172a !important;
          }

          .professional-proposal .ant-tag {
             border: 1px solid #e2e8f0 !important;
             background: #f8fafc !important;
             color: #0f172a !important;
          }
          
          /* Keep primary blue colors for accents */
          .professional-proposal .anticon, 
          .professional-proposal [style*="color: #3b82f6"],
          .professional-proposal [style*="color: #2563eb"],
          .professional-proposal [style*="color: rgb(59, 130, 246)"],
          .professional-proposal [style*="color: rgb(37, 99, 235)"] {
             color: #2563eb !important;
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

export default ProfessionalProposal;
