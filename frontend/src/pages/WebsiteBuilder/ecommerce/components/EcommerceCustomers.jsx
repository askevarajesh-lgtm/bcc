import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Input, Tag, Alert } from 'antd';
import { Users, Search } from 'lucide-react';
import { getCustomers } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';
import { formatCurrency } from '../utils/currency';

const { Title, Text } = Typography;

const EcommerceCustomers = () => {
  const { workspaceId, websiteId, activeStoreId } = useEcommerce();
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    if (workspaceId && websiteId && activeStoreId) {
      const data = await getCustomers(workspaceId, websiteId, activeStoreId);
      setCustomers(data);
    } else {
      setCustomers([]);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => { if (!e.detail?.entity || e.detail?.entity === 'customers') loadData(); };
    const handleStoreChange = () => loadData();
    window.addEventListener('ecommerce_data_updated', handleSync);
    window.addEventListener('ecommerce_store_changed', handleStoreChange);
    return () => {
      window.removeEventListener('ecommerce_data_updated', handleSync);
      window.removeEventListener('ecommerce_store_changed', handleStoreChange);
    };
  }, [workspaceId, websiteId, activeStoreId]);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: t => <Text strong>{t}</Text> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Address', dataIndex: 'address', key: 'address', render: t => t || '-' },
    { title: 'Orders', dataIndex: 'ordersCount', key: 'ordersCount', render: val => <Tag color="blue">{val} Orders</Tag> },
    { title: 'Total Spent', dataIndex: 'totalSpent', key: 'totalSpent', render: val => formatCurrency(val, workspaceId, websiteId, activeStoreId) },
    { title: 'Since', dataIndex: 'createdAt', key: 'createdAt', render: text => text ? new Date(text).toLocaleDateString() : '-' }
  ];

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchText.toLowerCase())
  );

  if (!activeStoreId) {
    return <div style={{ padding: 24 }}><Alert type="warning" message="No Active Store Selected" description="Select an Ecommerce store to view customers." showIcon /></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="var(--accent-primary)" /> Customers
          </Title>
          <Text type="secondary">Manage your store's customers and their order history</Text>
        </div>
        <Input
          prefix={<Search size={16} />}
          placeholder="Search customers..."
          style={{ width: 300 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>
      <Card>
        <Table columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 10 }} locale={{ emptyText: 'No customers yet.' }} />
      </Card>
    </div>
  );
};

export default EcommerceCustomers;
