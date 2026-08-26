import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Space, Input, Tag } from 'antd';
import { Users, Search } from 'lucide-react';
import { getCustomers } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';
import { formatCurrency } from '../utils/currency';

const { Title, Text } = Typography;

const EcommerceCustomers = () => {
  const { workspaceId, websiteId } = useEcommerce();
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    if (workspaceId && websiteId) {
      const data = await getCustomers(workspaceId, websiteId);
      setCustomers(data);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => {
      if (e.detail?.entity === 'customers') loadData();
    };
    window.addEventListener('ecommerce_data_updated', handleSync);
    return () => window.removeEventListener('ecommerce_data_updated', handleSync);
  }, [workspaceId, websiteId]);

  const columns = [
    { title: 'Customer ID', dataIndex: 'id', key: 'id', render: text => <Text strong>{text}</Text> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: t => t || '-' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    { title: 'Orders', dataIndex: 'ordersCount', key: 'ordersCount', render: val => <Tag color="blue">{val} Orders</Tag> },
    { title: 'Total Spent', dataIndex: 'totalSpent', key: 'totalSpent', render: val => formatCurrency(val, workspaceId, websiteId) },
    { title: 'Last Active', dataIndex: 'updatedAt', key: 'updatedAt', render: text => new Date(text).toLocaleDateString() }
  ];

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchText.toLowerCase()) || 
    c.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="var(--accent-primary)" /> Customers
          </Title>
          <Text type="secondary">Manage your store's customers and see their order history</Text>
        </div>
        <Input 
          prefix={<Search size={16} />} 
          placeholder="Search customers..." 
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
          locale={{ emptyText: 'No customers found.' }}
        />
      </Card>
    </div>
  );
};

export default EcommerceCustomers;
