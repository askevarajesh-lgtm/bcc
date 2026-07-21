import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Table, Tag, Space, message, Popconfirm, Modal, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActionPermissions } from '../../hooks/useActionPermissions';

const { Title, Text } = Typography;

const ProposalsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const { canAdd, canEdit, canDelete, canView } = useActionPermissions('/proposals');

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
            { title: 'Amount', dataIndex: 'grandTotal', key: 'grandTotal', render: (val) => `₹${val?.toLocaleString()}` },
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

            {/* Standard Packages */}
            {selectedProposal.masterItems && selectedProposal.masterItems.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Included Packages</Title>
                {selectedProposal.masterItems.map((item, index) => (
                  <Card size="small" key={index} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{item.name}</div>
                    
                    {/* Render Categories if available */}
                    {item.categories && item.categories.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary" strong>Categories:</Text>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {item.categories.map((cat, idx) => (
                            <li key={`cat-${idx}`}><Text type="secondary">{cat.name}: <strong>{cat.count || cat.quantity}</strong></Text></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Render Deliverables if available */}
                    {item.applicableAccess && item.applicableAccess.length > 0 && (
                      <div>
                        <Text type="secondary" strong>Deliverables:</Text>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {item.applicableAccess.map((access, idx) => (
                            <li key={`acc-${idx}`}><Text type="secondary">{access.name}: <strong>{access.value}</strong></Text></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Custom Packages */}
            {selectedProposal.customMasterItems && selectedProposal.customMasterItems.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Custom Packages</Title>
                {selectedProposal.customMasterItems.map((item, index) => (
                  <Card size="small" key={index} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{item.customPackageName || 'Custom Package'}</div>
                    
                    {/* Render Custom Categories if available */}
                    {item.customCategories && item.customCategories.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary" strong>Categories:</Text>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {item.customCategories.map((cat, idx) => (
                            <li key={`ccat-${idx}`}><Text type="secondary">{cat.categoryName || cat.name}: <strong>{cat.quantity || cat.count}</strong></Text></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Render Custom Deliverables if available */}
                    {item.customApplicableAccess && item.customApplicableAccess.length > 0 && (
                      <div>
                        <Text type="secondary" strong>Deliverables:</Text>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {item.customApplicableAccess.map((access, idx) => (
                            <li key={`cacc-${idx}`}><Text type="secondary">{access.name}: <strong>{access.value}</strong></Text></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProposalsList;
