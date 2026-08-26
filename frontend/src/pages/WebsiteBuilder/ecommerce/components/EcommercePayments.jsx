import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Input, Tag, Alert } from 'antd';
import { CreditCard, Search } from 'lucide-react';
import { getPayments } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';
import { formatCurrency } from '../utils/currency';

const { Title, Text } = Typography;

const EcommercePayments = () => {
  const { workspaceId, websiteId, activeStoreId } = useEcommerce();
  const [payments, setPayments] = useState([]);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    if (workspaceId && websiteId && activeStoreId) {
      const data = await getPayments(workspaceId, websiteId, activeStoreId);
      setPayments(data);
    } else {
      setPayments([]);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => { if (!e.detail?.entity || e.detail?.entity === 'payments') loadData(); };
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
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: val => formatCurrency(val, workspaceId, websiteId, activeStoreId) },
    { title: 'Method', dataIndex: 'method', key: 'method', render: text => <Tag>{text}</Tag> },
    {
      title: 'Status', dataIndex: 'status', key: 'status', render: text => (
        <Tag color={text === 'Completed' ? 'green' : text === 'Pending' ? 'orange' : 'red'}>{text}</Tag>
      )
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: text => text ? new Date(text).toLocaleString() : '-' }
  ];

  const filtered = payments.filter(p =>
    (p.customerName || '').toLowerCase().includes(searchText.toLowerCase())
  );

  if (!activeStoreId) {
    return <div style={{ padding: 24 }}><Alert type="warning" message="No Active Store Selected" description="Select an Ecommerce store to view payments." showIcon /></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={24} color="var(--accent-primary)" /> Payments
          </Title>
          <Text type="secondary">View transaction history and payment statuses</Text>
        </div>
        <Input prefix={<Search size={16} />} placeholder="Search payments..." style={{ width: 300 }} value={searchText} onChange={e => setSearchText(e.target.value)} />
      </div>
      <Card>
        <Table columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 10 }} locale={{ emptyText: 'No payments yet.' }} />
      </Card>
    </div>
  );
};

export default EcommercePayments;
