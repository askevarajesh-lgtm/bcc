import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Tag, Input, Select, Avatar, Button, message, Modal } from 'antd';
import { motion } from 'framer-motion';
import { Search, CheckCircle2 } from 'lucide-react';
import { contentApi } from '../../../api/contentApi';
import { useContentModule } from '../ContentModuleContext';

const { Title, Text } = Typography;

const ListViewTab = ({ itemVariants }) => {
  const { refreshToken } = useContentModule();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openViewModal = (record) => {
    setViewItem(record);
    setIsModalVisible(true);
  };

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await contentApi.getItems();
        if (res.success) setItems(res.data.items);
      } catch (err) {
        message.error('Failed to load content items');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [refreshToken]);

  const columns = [
    { title: 'TITLE', dataIndex: 'title', key: 'title', render: text => <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{text}</strong> },
    { 
      title: 'TYPE', 
      dataIndex: 'type', 
      key: 'type', 
      render: val => {
        let color = 'processing';
        if (val === 'landing') color = 'magenta';
        if (val === 'social') color = 'cyan';
        if (val === 'ad') color = 'gold';
        if (val === 'email') color = 'purple';
        return <Tag color={color} style={{ borderRadius: 12, fontWeight: 600, textTransform: 'capitalize' }}>{val}</Tag>;
      } 
    },
    { 
      title: 'STATUS', 
      dataIndex: 'status', 
      key: 'status', 
      render: val => {
        let color = 'default';
        if (val === 'Published' || val === 'Approved') color = 'success';
        if (val === 'In Review' || val === 'Pending Approval') color = 'warning';
        if (val === 'Scheduled') color = 'processing';
        return <Tag color={color} style={{ borderRadius: 12, fontWeight: 600 }}>{val}</Tag>;
      } 
    },
    { 
      title: 'ASSIGNED TO', 
      key: 'assignee', 
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" style={{ background: '#3b82f6', fontWeight: 700, fontSize: 12 }}>AI</Avatar>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>AI Studio</span>
        </div>
      )
    },
    { title: 'DUE DATE', dataIndex: 'createdAt', key: 'due', render: text => <Text type="secondary">{new Date(text).toLocaleDateString()}</Text> },
    { 
      title: 'APPROVED', 
      dataIndex: 'status', 
      key: 'approved', 
      render: val => {
        if (val === 'Approved' || val === 'Published') return <CheckCircle2 size={16} color="var(--accent-secondary)" />;
        if (val === 'In Review') return <Tag color="warning" style={{ borderRadius: 12, fontWeight: 600, margin: 0 }}>Pending</Tag>;
        return <Text type="secondary">—</Text>;
      } 
    },
    { 
      title: 'ACTIONS', 
      key: 'action', 
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={async () => {
           if(record.status === 'Draft') {
               try {
                 await contentApi.updateItem(record._id, { status: 'Approved' });
                 message.success('Approved');
                 const res = await contentApi.getItems();
                 if (res.success) setItems(res.data.items);
               } catch (e) {
                 message.error('Failed to approve');
               }
            } else {
               openViewModal(record);
            }
          }}
          style={{ fontWeight: 600, color: 'var(--text-primary)', padding: 0 }}>
          {record.status === 'Draft' ? 'Approve' : 'View'}
        </Button> 
      )
    }
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
      <motion.div variants={itemVariants}>
        <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>Content pipeline</Title>
          <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24 }}>All pieces across types and statuses</Text>

          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <Input prefix={<Search size={16} color="var(--text-secondary)" />} placeholder="Search content..." style={{ borderRadius: 8, flex: 1, minWidth: 200, height: 40 }} />
            <Select defaultValue="All type" style={{ width: 150, height: 40 }}><Select.Option value="All type">All type</Select.Option></Select>
            <Select defaultValue="All status" style={{ width: 150, height: 40 }}><Select.Option value="All status">All status</Select.Option></Select>
            <Select defaultValue="All assignee" style={{ width: 150, height: 40 }}><Select.Option value="All assignee">All assignee</Select.Option></Select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <Table loading={loading} columns={columns} dataSource={items} pagination={false} rowKey="_id" size="middle" scroll={{ x: 1000 }} style={{ minWidth: 1000 }} />
          </div>
        </Card>
      </motion.div>

      <Modal
        title={viewItem?.title || 'View Content'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {viewItem && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Tag color="processing">{viewItem.type}</Tag>
              <Tag color={viewItem.status === 'Approved' ? 'success' : 'default'}>{viewItem.status}</Tag>
            </div>
            {viewItem.body ? (
              <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                {viewItem.body}
              </div>
            ) : (
              <Text type="secondary">No content body available.</Text>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default ListViewTab;
