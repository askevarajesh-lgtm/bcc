import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Space, Input, Tag } from 'antd';
import { Truck, Search } from 'lucide-react';
import { getShipping } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title, Text } = Typography;

const EcommerceShipping = () => {
  const { workspaceId, websiteId } = useEcommerce();
  const [shipping, setShipping] = useState([]);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    if (workspaceId && websiteId) {
      const data = await getShipping(workspaceId, websiteId);
      setShipping(data);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => {
      if (e.detail?.entity === 'shipping') loadData();
    };
    window.addEventListener('ecommerce_data_updated', handleSync);
    return () => window.removeEventListener('ecommerce_data_updated', handleSync);
  }, [workspaceId, websiteId]);

  const columns = [
    { title: 'Shipment ID', dataIndex: 'id', key: 'id', render: text => <Text strong>{text}</Text> },
    { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    { title: 'Tracking ID', dataIndex: 'trackingId', key: 'trackingId', render: t => <Text code>{t}</Text> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: text => (
        <Tag color={
          text === 'Delivered' ? 'green' : 
          text === 'Shipped' ? 'blue' : 
          text === 'Packed' ? 'cyan' : 'orange'
        }>
          {text}
        </Tag>
      ) 
    },
    { title: 'Date', dataIndex: 'date', key: 'date', render: text => new Date(text).toLocaleString() }
  ];

  const filtered = shipping.filter(s => 
    s.id.toLowerCase().includes(searchText.toLowerCase()) || 
    s.orderId.toLowerCase().includes(searchText.toLowerCase()) ||
    s.customer.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={24} color="var(--accent-primary)" /> Shipping
          </Title>
          <Text type="secondary">Manage order shipments and tracking</Text>
        </div>
        <Input 
          prefix={<Search size={16} />} 
          placeholder="Search shipments..." 
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
          locale={{ emptyText: 'No shipments found.' }}
        />
      </Card>
    </div>
  );
};

export default EcommerceShipping;
