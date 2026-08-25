import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Select, message } from 'antd';
import { getStorageData, setStorageData } from '../utils/storage';
import { formatCurrency } from '../utils/currency';

const { Title } = Typography;
const { Option } = Select;

const EcommerceOrders = () => {
  const [orders, setOrders] = useState([]);
  
  const workspaceId = 'default';
  const websiteId = 'default';

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const data = getStorageData(workspaceId, websiteId, 'orders', []);
    setOrders(data);
  };

  const handleStatusChange = (orderId, newStatus) => {
    const newOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setStorageData(workspaceId, websiteId, 'orders', newOrders);
    setOrders(newOrders);
    message.success(`Order ${orderId} status updated to ${newStatus}`);
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (val) => formatCurrency(val, workspaceId, websiteId),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select 
          value={status} 
          style={{ width: 120 }} 
          onChange={(val) => handleStatusChange(record.id, val)}
        >
          <Option value="Pending">Pending</Option>
          <Option value="Processing">Processing</Option>
          <Option value="Shipped">Shipped</Option>
          <Option value="Delivered">Delivered</Option>
        </Select>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={4} style={{ marginBottom: 24, fontWeight: 700 }}>Orders</Title>
      <Card>
        <Table 
          columns={columns} 
          dataSource={orders} 
          rowKey="id" 
        />
      </Card>
    </div>
  );
};

export default EcommerceOrders;
