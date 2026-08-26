import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Statistic, Table, Tag, Alert } from 'antd';
import { ShoppingBag, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { getProducts, getOrders } from '../utils/storage';
import { formatCurrency } from '../utils/currency';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title } = Typography;

const EcommerceDashboard = () => {
  const { workspaceId, websiteId, activeStoreId } = useEcommerce();
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
    if (!workspaceId || !websiteId || !activeStoreId) {
      setStats({ totalProducts: 0, activeProducts: 0, totalOrders: 0, pendingOrders: 0, revenue: 0, lowStock: 0 });
      setRecentOrders([]);
      return;
    }

    const products = await getProducts(workspaceId, websiteId, activeStoreId);
    const orders = await getOrders(workspaceId, websiteId, activeStoreId);

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'Active').length;
    const lowStock = products.filter(p => p.stock < 10).length;

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const revenue = orders.filter(o => o.status === 'Delivered' || o.status === 'Shipped' || o.status === 'Processing' || o.status === 'Completed' || o.status === 'Pending').reduce((acc, o) => acc + o.total, 0);

    setStats({ totalProducts, activeProducts, totalOrders, pendingOrders, revenue, lowStock });
    setRecentOrders(orders.slice(0, 5));
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => {
      if (!e.detail?.entity || ['orders', 'products'].includes(e.detail?.entity)) loadData();
    };
    const handleStoreChange = () => loadData();
    window.addEventListener('ecommerce_data_updated', handleSync);
    window.addEventListener('ecommerce_store_changed', handleStoreChange);
    return () => {
      window.removeEventListener('ecommerce_data_updated', handleSync);
      window.removeEventListener('ecommerce_store_changed', handleStoreChange);
    };
  }, [workspaceId, websiteId, activeStoreId]);

  const columns = [
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', render: (text, rec) => text || rec.id },
    { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (date) => date ? new Date(date).toLocaleDateString() : '-' },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (val) => formatCurrency(val, workspaceId, websiteId, activeStoreId) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Delivered') color = 'success';
        if (status === 'Processing' || status === 'Shipped') color = 'processing';
        if (status === 'Pending') color = 'warning';
        if (status === 'Cancelled') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  if (!activeStoreId) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="warning" message="No Active Store Selected" description="Select an Ecommerce store from the Active Store dropdown above to view dashboard metrics." showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={4} style={{ marginBottom: 24, fontWeight: 700 }}>E-commerce Dashboard</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Revenue" value={formatCurrency(stats.revenue, workspaceId, websiteId, activeStoreId)} prefix={<TrendingUp size={20} />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Orders" value={stats.totalOrders} prefix={<ShoppingBag size={20} />} />
            <div style={{ fontSize: 12, color: 'gray', marginTop: 8 }}>{stats.pendingOrders} pending</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Products" value={stats.totalProducts} prefix={<Package size={20} />} />
            <div style={{ fontSize: 12, color: 'gray', marginTop: 8 }}>{stats.activeProducts} active</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Low Stock Alerts" value={stats.lowStock} prefix={<AlertCircle size={20} />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Orders">
        <Table columns={columns} dataSource={recentOrders} rowKey="id" pagination={false} locale={{ emptyText: 'No recent orders.' }} />
      </Card>
    </div>
  );
};

export default EcommerceDashboard;
