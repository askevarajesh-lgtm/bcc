import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Input, Tag, Alert } from 'antd';
import { Truck, Search } from 'lucide-react';
import { getShipping } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title, Text } = Typography;

const EcommerceShipping = () => {
  const { workspaceId, websiteId, activeStoreId } = useEcommerce();
  const [shipping, setShipping] = useState([]);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    if (workspaceId && websiteId && activeStoreId) {
      const data = await getShipping(workspaceId, websiteId, activeStoreId);
      setShipping(data);
    } else {
      setShipping([]);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => { if (!e.detail?.entity || e.detail?.entity === 'shipping') loadData(); };
    const handleStoreChange = () => loadData();
    window.addEventListener('ecommerce_data_updated', handleSync);
    window.addEventListener('ecommerce_store_changed', handleStoreChange);
    return () => {
      window.removeEventListener('ecommerce_data_updated', handleSync);
      window.removeEventListener('ecommerce_store_changed', handleStoreChange);
    };
  }, [workspaceId, websiteId, activeStoreId]);

  const columns = [
    { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    { title: 'Method', dataIndex: 'methodName', key: 'methodName' },
    { title: 'Tracking ID', dataIndex: 'trackingId', key: 'trackingId', render: t => <Text code>{t || '-'}</Text> },
    {
      title: 'Status', dataIndex: 'status', key: 'status', render: text => (
        <Tag color={text === 'Delivered' ? 'green' : text === 'Shipped' ? 'blue' : text === 'In Transit' ? 'cyan' : 'orange'}>{text}</Tag>
      )
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: text => text ? new Date(text).toLocaleString() : '-' }
  ];

  const filtered = shipping.filter(s =>
    (s.customerName || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (s.trackingId || '').toLowerCase().includes(searchText.toLowerCase())
  );

  if (!activeStoreId) {
    return <div style={{ padding: 24 }}><Alert type="warning" message="No Active Store Selected" description="Select an Ecommerce store to view shipping." showIcon /></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={24} color="var(--accent-primary)" /> Shipping
          </Title>
          <Text type="secondary">Manage order shipments and tracking</Text>
        </div>
        <Input prefix={<Search size={16} />} placeholder="Search shipments..." style={{ width: 300 }} value={searchText} onChange={e => setSearchText(e.target.value)} />
      </div>
      <Card>
        <Table columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 10 }} locale={{ emptyText: 'No shipments yet.' }} />
      </Card>
    </div>
  );
};

export default EcommerceShipping;
