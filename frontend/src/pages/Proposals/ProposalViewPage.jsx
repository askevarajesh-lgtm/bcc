import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Button, Typography, message, Space, Spin } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import ProfessionalProposal from "./components/ProfessionalProposal";
import api from "../../services/api";

const { Title } = Typography;

const ProposalViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isClientPanel = location.pathname.startsWith('/client');

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id]);

  useEffect(() => {
    if (proposal) {
      const agencyName = proposal.agencyId?.name || proposal.adminId?.name || 'Proposal';
      document.title = `${agencyName} - ${proposal.proposalNumber}`;
    }
    return () => {
      document.title = 'M1 Labs'; // Revert back
    };
  }, [proposal]);

  const handleBack = () => {
    navigate(-1);
  };

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/proposals/${id}`);
      if (res.data?.success) {
        setProposal(res.data.data);
      } else {
        message.error("Failed to fetch proposal");
        handleBack();
      }
    } catch (error) {
      console.error("Failed to fetch proposal:", error);
      message.error("Error loading proposal");
      handleBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Space style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Back
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Proposal: {proposal?.proposalNumber}
          </Title>
        </Space>
        
        <Button icon={<PrinterOutlined />} onClick={handlePrint}>
          Print / Save as PDF
        </Button>
      </Space>

      <Card bodyStyle={{ padding: 0 }} bordered={false}>
        <ProfessionalProposal proposal={proposal} />
      </Card>

      <style>{`
        @media print {
          /* Hide layout wrappers */
          .ant-layout-sider, .ant-layout-header, aside, header { display: none !important; }
          /* Hide buttons and spaces */
          .ant-space, .ant-btn { display: none !important; }
          
          /* Remove all padding, margin, and backgrounds */
          body, .ant-layout, .ant-layout-content, .page-container {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          
          .ant-card { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ProposalViewPage;
