import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Select, Tag, Space, Modal, message, Alert } from 'antd';
import { Eye } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../utils/storage';
import { formatCurrency } from '../utils/currency';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title, Text } = Typography;
const { Option } = Select;

const EcommerceOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { workspaceId, websiteId, activeStoreId } = useEcommerce();

  const loadData = async () => {
    if (workspaceId && websiteId && activeStoreId) {
      const data = await getOrders(workspaceId, websiteId, activeStoreId);
      setOrders(data);
    } else {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => { if (!e.detail?.entity || e.detail?.entity === 'orders') loadData(); };
    const handleStoreChange = () => loadData();
    window.addEventListener('ecommerce_data_updated', handleSync);
    window.addEventListener('ecommerce_store_changed', handleStoreChange);
    return () => {
      window.removeEventListener('ecommerce_data_updated', handleSync);
      window.removeEventListener('ecommerce_store_changed', handleStoreChange);
    };
  }, [workspaceId, websiteId, activeStoreId]);

  const handleStatusChange = async (orderId, status) => {
    await updateOrderStatus(workspaceId, websiteId, activeStoreId, orderId, status);
    message.success(`Order status updated to ${status}`);
    loadData();
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const columns = [
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', render: (text, rec) => <Text strong>{text || rec.id}</Text> },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (date) => date ? new Date(date).toLocaleString() : '-' },
    { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (val) => formatCurrency(val, workspaceId, websiteId, activeStoreId) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select value={status} style={{ width: 130 }} onChange={(val) => handleStatusChange(record.id, val)}>
          <Option value="Pending"><Tag color="orange">Pending</Tag></Option>
          <Option value="Processing"><Tag color="cyan">Processing</Tag></Option>
          <Option value="Shipped"><Tag color="geekblue">Shipped</Tag></Option>
          <Option value="Delivered"><Tag color="green">Delivered</Tag></Option>
          <Option value="Cancelled"><Tag color="red">Cancelled</Tag></Option>
        </Select>
      )
    },
    { title: 'Action', key: 'action', render: (_, record) => <Button type="text" icon={<Eye size={16} />} onClick={() => handleView(record)}>View</Button> },
  ];

  if (!activeStoreId) {
    return <div style={{ padding: 24 }}><Alert type="warning" message="No Active Store Selected" description="Select an Ecommerce store from the Active Store dropdown." showIcon /></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Orders</Title>
      </div>

      <Card>
        <Table columns={columns} dataSource={orders} rowKey="id" />
      </Card>

      <Modal
        title={`Order Details — ${selectedOrder?.orderNumber || selectedOrder?.id}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[<Button key="close" onClick={() => setIsModalVisible(false)}>Close</Button>]}
        width={600}
      >
        {selectedOrder && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>Customer Information</Title>
              <Text strong>Name:</Text> {selectedOrder.customerName} <br />
              <Text strong>Payment:</Text> {selectedOrder.paymentMethod}
            </div>
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>Order Items</Title>
              <Table
                dataSource={selectedOrder.items}
                rowKey={(r) => r.productId || r.name}
                pagination={false}
                size="small"
                columns={[
                  { title: 'Product', dataIndex: 'name', key: 'name' },
                  { title: 'Price', dataIndex: 'price', key: 'price', render: val => formatCurrency(val, workspaceId, websiteId, activeStoreId) },
                  { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                  { title: 'Total', key: 'total', render: (_, r) => formatCurrency(r.price * r.quantity, workspaceId, websiteId, activeStoreId) }
                ]}
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text>Subtotal: {formatCurrency(selectedOrder.subtotal, workspaceId, websiteId, activeStoreId)}</Text><br />
              <Text>Shipping: {formatCurrency(selectedOrder.shippingFee, workspaceId, websiteId, activeStoreId)}</Text><br />
              <Title level={4} style={{ marginTop: 8 }}>Total: {formatCurrency(selectedOrder.total, workspaceId, websiteId, activeStoreId)}</Title>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EcommerceOrders;
