import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Table, Tag, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

const ProposalsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch('/api/proposals', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProposals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
      message.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const getBaseRoute = () => {
    if (location.pathname.startsWith("/client")) return "/client/workspace";
    if (location.pathname.startsWith("/agency")) return "/agency";
    return "/workspace";
  };
  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Proposals</Title>
          <Text type="secondary">Manage client proposals</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('new')}>
          Create Proposal
        </Button>
      </div>
      <Card>
        <Table 
          loading={loading}
          rowKey="_id"
          columns={[
            { title: 'Proposal #', dataIndex: 'proposalNumber', key: 'proposalNumber' },
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Client', dataIndex: 'clientId', key: 'client', render: (client) => client?.name || 'Unknown' },
            { title: 'Amount', dataIndex: 'grandTotal', key: 'grandTotal', render: (val) => `₹${val?.toLocaleString()}` },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'Approved' ? 'green' : 'blue'}>{status}</Tag> },
            { title: 'Actions', key: 'actions', render: (_, record) => (
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`${getBaseRoute()}/proposals/${record._id}`)} />
                <Button type="text" icon={<FilePdfOutlined />} />
              </Space>
            )}
          ]} 
          dataSource={proposals} 
        />
      </Card>
    </div>
  );
};

export default ProposalsList;
