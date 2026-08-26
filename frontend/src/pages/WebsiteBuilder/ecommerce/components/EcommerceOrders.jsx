import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Select, Tag, Space, Modal, message } from 'antd';
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
  
  const { workspaceId, websiteId } = useEcommerce();

  const loadData = async () => {
    if (workspaceId && websiteId) {
      const data = await getOrders(workspaceId, websiteId);
      setOrders(data);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => {
      if (e.detail?.entity === 'orders') loadData();
    };
    window.addEventListener('ecommerce_data_updated', handleSync);
    return () => window.removeEventListener('ecommerce_data_updated', handleSync);
  }, [workspaceId, websiteId]);

  const handleStatusChange = async (orderId, status) => {
    await updateOrderStatus(workspaceId, websiteId, orderId, status);
    message.success(`Order status updated to ${status}`);
    loadData();
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
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
          <Option value="Pending"><Tag color="orange">Pending</Tag></Option>
          <Option value="Confirmed"><Tag color="blue">Confirmed</Tag></Option>
          <Option value="Processing"><Tag color="cyan">Processing</Tag></Option>
          <Option value="Packed"><Tag color="purple">Packed</Tag></Option>
          <Option value="Shipped"><Tag color="geekblue">Shipped</Tag></Option>
          <Option value="Delivered"><Tag color="green">Delivered</Tag></Option>
          <Option value="Cancelled"><Tag color="red">Cancelled</Tag></Option>
        </Select>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="text" icon={<Eye size={16} />} onClick={() => handleView(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Orders</Title>
      </div>

      <Card>
        <Table columns={columns} dataSource={orders} rowKey={(record) => record._id || record.id} />
      </Card>

      <Modal
        title={`Order Details - ${selectedOrder?.id}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedOrder && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>Customer Information</Title>
              <Text strong>Name:</Text> {selectedOrder.customerName} <br />
              <Text strong>Email:</Text> {selectedOrder.customerEmail} <br />
              <Text strong>Shipping Address:</Text> {selectedOrder.shippingAddress}
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>Order Items</Title>
              <Table 
                dataSource={selectedOrder.items} 
                rowKey="id" 
                pagination={false}
                size="small"
                columns={[
                  { title: 'Product', dataIndex: 'name', key: 'name' },
                  { title: 'Price', dataIndex: 'price', key: 'price', render: val => formatCurrency(val, workspaceId, websiteId) },
                  { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                  { title: 'Total', key: 'total', render: (_, record) => formatCurrency(record.price * record.quantity, workspaceId, websiteId) }
                ]}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <Text>Subtotal: {formatCurrency(selectedOrder.subtotal, workspaceId, websiteId)}</Text><br />
              <Text>Shipping: {formatCurrency(selectedOrder.shippingFee, workspaceId, websiteId)}</Text><br />
              <Title level={4} style={{ marginTop: 8 }}>
                Total: {formatCurrency(selectedOrder.total, workspaceId, websiteId)}
              </Title>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EcommerceOrders;
