import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Table, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActionPermissions } from '../../hooks/useActionPermissions';
import api from '../../services/api';

const { Title, Text } = Typography;

const ProposalsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  const { canAdd, canEdit, canDelete, canView } = useActionPermissions('/proposals');

  const handleView = (proposal) => {
    navigate(`${getBaseRoute()}/proposals/${proposal._id}/view`);
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/proposals');
      if (res.data?.success) {
        setProposals(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
      message.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/proposals/${id}`);
      if (res.data?.success) {
        message.success('Proposal deleted successfully');
        fetchProposals();
      } else {
        message.error(res.data?.message || 'Failed to delete proposal');
      }
    } catch (error) {
      console.error('Failed to delete proposal:', error);
      message.error('Failed to delete proposal');
    }
  };


  const getBaseRoute = () => {
    if (location.pathname.startsWith("/client")) return "/client/workspace";
    if (location.pathname.startsWith("/agency")) return "/agency";
    if (location.pathname.startsWith("/user")) return "/user/workspace";
    return "/workspace";
  };
  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Proposals</Title>
          <Text type="secondary">Manage client proposals</Text>
        </div>
        {canAdd && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('new')}>
            Create Proposal
          </Button>
        )}
      </div>
      <Card>
        <Table 
          loading={loading}
          rowKey="_id"
          columns={[
            { title: 'Proposal #', dataIndex: 'proposalNumber', key: 'proposalNumber' },
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Client', dataIndex: 'clientId', key: 'client', render: (client) => client?.name || 'Unknown' },
            { 
              title: 'Campaign Amount', 
              key: 'campaignAmount', 
              render: (_, record) => {
                const campAmt = record.masterItems?.reduce((acc, item) => acc + (item.isCampaign ? (item.campaignDetails?.campaignAmount || 0) : 0), 0) || 0;
                return `₹${campAmt.toLocaleString()}`;
              } 
            },
            { 
              title: 'Service Amount', 
              key: 'serviceAmount', 
              render: (_, record) => {
                const campAmt = record.masterItems?.reduce((acc, item) => acc + (item.isCampaign ? (item.campaignDetails?.campaignAmount || 0) : 0), 0) || 0;
                const total = record.grandTotal || 0;
                return `₹${(total - campAmt).toLocaleString()}`;
              } 
            },
            { title: 'Total Amount', dataIndex: 'grandTotal', key: 'grandTotal', render: (val) => `₹${val?.toLocaleString()}` },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'Approved' ? 'green' : 'blue'}>{status}</Tag> },
            { title: 'Created By', dataIndex: 'createdBy', key: 'createdBy', render: (user) => user?.name || 'Unknown' },
            { title: 'Actions', key: 'actions', render: (_, record) => (
              <Space>
                {canView && <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} title="View Proposal" />}
                {canEdit && <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`${getBaseRoute()}/proposals/${record._id}`)} title="Edit Proposal" />}
                {canDelete && (
                  <Popconfirm title="Delete Proposal" onConfirm={() => handleDelete(record._id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} title="Delete Proposal" />
                  </Popconfirm>
                )}
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
