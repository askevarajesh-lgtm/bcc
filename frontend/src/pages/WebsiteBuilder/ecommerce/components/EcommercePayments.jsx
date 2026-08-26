import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Space, Input, Tag } from 'antd';
import { CreditCard, Search } from 'lucide-react';
import { getPayments } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';
import { formatCurrency } from '../utils/currency';

const { Title, Text } = Typography;

const EcommercePayments = () => {
  const { workspaceId, websiteId } = useEcommerce();
  const [payments, setPayments] = useState([]);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    if (workspaceId && websiteId) {
      const data = await getPayments(workspaceId, websiteId);
      setPayments(data);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => {
      if (e.detail?.entity === 'payments') loadData();
    };
    window.addEventListener('ecommerce_data_updated', handleSync);
    return () => window.removeEventListener('ecommerce_data_updated', handleSync);
  }, [workspaceId, websiteId]);

  const columns = [
    { title: 'Payment ID', dataIndex: 'id', key: 'id', render: text => <Text strong>{text}</Text> },
    { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: val => formatCurrency(val, workspaceId, websiteId) },
    { title: 'Method', dataIndex: 'method', key: 'method', render: text => <Tag>{text}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: text => (
        <Tag color={text === 'Completed' ? 'green' : text === 'Pending' ? 'orange' : 'red'}>
          {text}
        </Tag>
      ) 
    },
    { title: 'Date', dataIndex: 'date', key: 'date', render: text => new Date(text).toLocaleString() }
  ];

  const filtered = payments.filter(p => 
    p.id.toLowerCase().includes(searchText.toLowerCase()) || 
    p.orderId.toLowerCase().includes(searchText.toLowerCase()) ||
    p.customer.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={24} color="var(--accent-primary)" /> Payments
          </Title>
          <Text type="secondary">View transaction history and payment statuses</Text>
        </div>
        <Input 
          prefix={<Search size={16} />} 
          placeholder="Search payments..." 
          style={{ width: 300, borderRadius: 8 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>
      <Card>
        <Table 
          columns={columns} 
          dataSource={filtered} 
          rowKey={(record) => record._id || record.id}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No payments found.' }}
        />
      </Card>
    </div>
  );
};

export default EcommercePayments;
