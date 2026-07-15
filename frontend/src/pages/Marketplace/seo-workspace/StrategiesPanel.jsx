import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Modal, Button, message, Divider } from 'antd';
import ReactMarkdown from 'react-markdown';
import StatusTag from './components/StatusTag';
import CollaborationDrawer from './components/CollaborationDrawer';
import useWorkspaceStrategies from './hooks/useWorkspaceStrategies';

const { Title } = Typography;

const StrategiesPanel = ({ isViewOnly, canEdit, setActionLoading }) => {
  const {
    strategies, pagination, loading, fetchStrategies,
    approveStrategy, rejectStrategy, publishStrategy
  } = useWorkspaceStrategies();
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { fetchStrategies({ page: 1, limit: 20 }); }, [fetchStrategies]);

  const projectIdOf = (s) => s?.projectId?._id || s?.projectId;

  const handleApprove = async () => {
    if (!activeStrategy) return;
    try {
      setActionLoading({ isLoading: true, message: 'Approving strategy...' });
      const updated = await approveStrategy(projectIdOf(activeStrategy), activeStrategy._id);
      message.success({ content: 'Strategy approved.', key: 'approve' });
      setActiveStrategy(updated);
      fetchStrategies({ page: pagination.page, limit: pagination.limit });
    } catch (error) {
      message.error({ content: error.response?.data?.message || 'Failed to approve strategy.', key: 'approve' });
    } finally {
      setActionLoading({ isLoading: false, message: '' });
    }
  };

  const handleReject = async () => {
    if (!activeStrategy) return;
    try {
      setActionLoading({ isLoading: true, message: 'Rejecting strategy...' });
      const updated = await rejectStrategy(projectIdOf(activeStrategy), activeStrategy._id);
      message.success({ content: 'Strategy rejected.', key: 'reject' });
      setActiveStrategy(updated);
      fetchStrategies({ page: pagination.page, limit: pagination.limit });
    } catch (error) {
      message.error({ content: error.response?.data?.message || 'Failed to reject strategy.', key: 'reject' });
    } finally {
      setActionLoading({ isLoading: false, message: '' });
    }
  };

  const handlePublish = async () => {
    if (!activeStrategy) return;
    try {
      setActionLoading({ isLoading: true, message: 'Publishing to WordPress...' });
      await publishStrategy(projectIdOf(activeStrategy), activeStrategy._id);
      message.success({ content: 'Strategy published successfully to WordPress!', key: 'publish' });
      setModalVisible(false);
      fetchStrategies({ page: pagination.page, limit: pagination.limit });
    } catch (error) {
      message.error({ content: error.response?.data?.message || 'Failed to publish strategy.', key: 'publish' });
    } finally {
      setActionLoading({ isLoading: false, message: '' });
    }
  };

  const columns = [
    { title: 'Project', dataIndex: ['projectId', 'name'], key: 'projectName', render: text => <strong>{text || 'Unknown Project'}</strong> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: status => <StatusTag status={status} /> },
    { title: 'Date Generated', dataIndex: 'createdAt', key: 'createdAt', render: date => new Date(date).toLocaleDateString() },
    {
      title: 'Action', key: 'action', render: (_, record) => (
        <Button type="link" onClick={() => { setActiveStrategy(record); setModalVisible(true); }}>Review Strategy</Button>
      )
    },
  ];

  return (
    <>
      <Card className="seo-glass-panel seo-table">
        <Title level={4} style={{ margin: '0 0 16px 0' }}>Content Strategies</Title>
        <Table
          dataSource={strategies}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page, pageSize) => fetchStrategies({ page, limit: pageSize })
          }}
        />
      </Card>

      <Modal
        title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>{activeStrategy?.title || 'SEO Content Strategy'}</Title>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)} className="seo-glow-btn-secondary">Close</Button>,
          ...(!isViewOnly && canEdit && (activeStrategy?.status === 'Draft' || activeStrategy?.status === 'Pending Approval') ? [
            <Button key="reject" danger onClick={handleReject}>Reject</Button>,
            <Button key="approve" type="primary" onClick={handleApprove} className="seo-glow-btn">Approve</Button>
          ] : []),
          ...(!isViewOnly && canEdit && activeStrategy?.status === 'Approved' ? [
            <Button key="publish" type="primary" onClick={handlePublish} className="seo-glow-btn">Publish to WordPress</Button>
          ] : [])
        ]}
        width={800}
      >
        {activeStrategy?.status && <StatusTag status={activeStrategy.status} className="seo-strategy-status-tag" />}
        <div className="seo-markdown-container" style={{ maxHeight: '45vh', overflowY: 'auto', marginTop: 16 }}>
          <ReactMarkdown>{activeStrategy?.content || 'No content available.'}</ReactMarkdown>
        </div>
        <Divider />
        <CollaborationDrawer
          targetType="Strategy"
          targetId={activeStrategy?._id}
          projectId={projectIdOf(activeStrategy)}
          canWrite={!isViewOnly}
        />
      </Modal>
    </>
  );
};

export default StrategiesPanel;
