import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Table, Tag, Space, message, Popconfirm, Modal, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

const ProposalsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const handleView = (proposal) => {
    setSelectedProposal(proposal);
    setViewModalVisible(true);
  };

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

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/proposals/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        message.success('Proposal deleted successfully');
        fetchProposals();
      } else {
        message.error(data.message || 'Failed to delete proposal');
      }
    } catch (error) {
      console.error('Failed to delete proposal:', error);
      message.error('Failed to delete proposal');
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
                <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} title="View Proposal" />
                <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`${getBaseRoute()}/proposals/${record._id}`)} title="Edit Proposal" />
                <Popconfirm title="Delete Proposal" onConfirm={() => handleDelete(record._id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} title="Delete Proposal" />
                </Popconfirm>
              </Space>
            )}
          ]} 
          dataSource={proposals} 
        />
      </Card>
      
      <Modal
        title="Proposal Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedProposal && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Proposal Number">{selectedProposal.proposalNumber}</Descriptions.Item>
              <Descriptions.Item label="Name">{selectedProposal.name}</Descriptions.Item>
              <Descriptions.Item label="Date">{selectedProposal.proposalDate ? new Date(selectedProposal.proposalDate).toLocaleDateString() : 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Client">{selectedProposal.clientId?.name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Amount">₹{selectedProposal.grandTotal?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={selectedProposal.status === 'Approved' ? 'green' : 'blue'}>{selectedProposal.status}</Tag></Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProposalsList;
