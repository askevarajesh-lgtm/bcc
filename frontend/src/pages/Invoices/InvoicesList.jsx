import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Table, Tag, Space, message, Popconfirm, Modal, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActionPermissions } from '../../hooks/useActionPermissions';

const { Title, Text } = Typography;

const InvoicesList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const { canAdd, canEdit, canDelete, canView } = useActionPermissions('/invoices');

  const handleView = (invoice) => {
    navigate(`${getBaseRoute()}/invoices/${invoice._id}/view`);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch('/api/invoices', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      message.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        message.success('Invoice deleted successfully');
        fetchInvoices();
      } else {
        message.error(data.message || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      message.error('Failed to delete invoice');
    }
  };

  const getBaseRoute = () => {
    if (location.pathname.startsWith("/client")) return "/client/workspace";
    if (location.pathname.startsWith("/agency")) return "/agency";
    if (location.pathname.startsWith("/user")) return "/user/workspace";
    return "/workspace";
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Invoices</Title>
          <Text type="secondary">Manage client invoices and payments</Text>
        </div>
        {canAdd && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`${getBaseRoute()}/invoices/new`)}>
            Create Invoice
          </Button>
        )}
      </div>
      <Card>
        <Table 
          loading={loading}
          rowKey="_id"
          columns={[
            { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
            { title: 'Client', dataIndex: 'clientId', key: 'client', render: (client) => client?.name || 'Unknown' },
            { title: 'Amount', dataIndex: 'grandTotal', key: 'grandTotal', render: (val) => `₹${val?.toLocaleString()}` },
            { title: 'Status', dataIndex: 'invoiceStatus', key: 'status', render: (status) => <Tag color={status === 'Paid' ? 'green' : 'orange'}>{status}</Tag> },
            { title: 'Payment', dataIndex: 'paymentStatus', key: 'paymentStatus', render: (status) => <Tag color={status === 'Paid' ? 'green' : 'red'}>{status}</Tag> },
            { title: 'Created By', dataIndex: 'createdBy', key: 'createdBy', render: (user) => user?.name || 'Unknown' },
            { title: 'Actions', key: 'actions', render: (_, record) => (
              <Space>
                {canView && <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} title="View Invoice" />}
                {canEdit && <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`${getBaseRoute()}/invoices/${record._id}`)} title="Edit Invoice" />}
                {canDelete && (
                  <Popconfirm title="Delete Invoice" onConfirm={() => handleDelete(record._id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} title="Delete Invoice" />
                  </Popconfirm>
                )}
              </Space>
            )}
          ]} 
          dataSource={invoices} 
        />
      </Card>
    </div>
  );
};

export default InvoicesList;
