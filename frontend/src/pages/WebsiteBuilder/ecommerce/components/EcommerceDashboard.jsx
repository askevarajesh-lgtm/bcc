import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Statistic, Table, Tag } from 'antd';
import { ShoppingBag, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { getProducts, getOrders } from '../utils/storage';
import { formatCurrency } from '../utils/currency';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title } = Typography;

const EcommerceDashboard = () => {
  const { workspaceId, websiteId } = useEcommerce();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    lowStock: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const loadData = async () => {
    if (!workspaceId || !websiteId) return;
    
    const products = await getProducts(workspaceId, websiteId);
    const orders = await getOrders(workspaceId, websiteId);
    
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'Active').length;
    const lowStock = products.filter(p => p.stock < 10).length;
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const revenue = orders.filter(o => o.status === 'Delivered' || o.status === 'Shipped' || o.status === 'Completed' || o.status === 'Pending').reduce((acc, o) => acc + o.total, 0); // Include pending for MVP test
    
    setStats({
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      revenue,
      lowStock
    });
    
    setRecentOrders(orders.slice(0, 5));
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('ecommerce_data_updated', handleSync);
    return () => window.removeEventListener('ecommerce_data_updated', handleSync);
  }, [workspaceId, websiteId]);

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
      render: (text) => new Date(text).toLocaleDateString(),
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
      render: (status) => {
        let color = 'default';
        if (status === 'Delivered') color = 'success';
        if (status === 'Processing') color = 'processing';
        if (status === 'Pending') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={4} style={{ marginBottom: 24, fontWeight: 700 }}>E-commerce Dashboard</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Total Revenue" 
              value={formatCurrency(stats.revenue, workspaceId, websiteId)} 
              prefix={<TrendingUp size={20} />} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Orders" 
              value={stats.totalOrders} 
              prefix={<ShoppingBag size={20} />} 
            />
            <div style={{ fontSize: 12, color: 'gray', marginTop: 8 }}>
              {stats.pendingOrders} pending
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Products" 
              value={stats.totalProducts} 
              prefix={<Package size={20} />} 
            />
            <div style={{ fontSize: 12, color: 'gray', marginTop: 8 }}>
              {stats.activeProducts} active
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Low Stock Alerts" 
              value={stats.lowStock} 
              prefix={<AlertCircle size={20} />} 
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Orders">
        <Table 
          columns={columns} 
          dataSource={recentOrders} 
          rowKey={(record) => record._id || record.id} 
          pagination={false} 
        />
      </Card>
    </div>
  );
};

export default EcommerceDashboard;
