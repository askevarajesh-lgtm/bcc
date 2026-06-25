import React from 'react';
import { Card, Typography, Button, Table, Tag, Space } from 'antd';
import { FilePdfOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const InvoicesList = () => {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Invoices</Title>
          <Text type="secondary">Manage client invoices and payments</Text>
        </div>
      </div>
      <Card>
        <Table 
          columns={[
            { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
            { title: 'Client', dataIndex: 'clientId', key: 'client' },
            { title: 'Amount', dataIndex: 'grandTotal', key: 'grandTotal', render: (val) => `$${val}` },
            { title: 'Status', dataIndex: 'invoiceStatus', key: 'status', render: (status) => <Tag color={status === 'Paid' ? 'green' : 'orange'}>{status}</Tag> },
            { title: 'Payment', dataIndex: 'paymentStatus', key: 'paymentStatus', render: (status) => <Tag color={status === 'Paid' ? 'green' : 'red'}>{status}</Tag> },
            { title: 'Actions', key: 'actions', render: () => (
              <Space>
                <Button type="text" icon={<CheckCircleOutlined />} title="Update Payment" />
                <Button type="text" icon={<FilePdfOutlined />} title="Download PDF" />
              </Space>
            )}
          ]} 
          dataSource={[]} 
        />
      </Card>
    </div>
  );
};

export default InvoicesList;
