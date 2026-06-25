import React from 'react';
import { Card, Typography, Button, Table, Tag, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const MasterItemsList = () => {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Master Items</Title>
          <Text type="secondary">Manage your service packages and items</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('new')}>
          Create Master Item
        </Button>
      </div>
      <Card>
        <Table 
          columns={[
            { title: 'Item Name', dataIndex: 'name', key: 'name' },
            { title: 'Code', dataIndex: 'itemCode', key: 'itemCode' },
            { title: 'Category', dataIndex: 'category', key: 'category' },
            { title: 'Price', dataIndex: 'price', key: 'price', render: (val) => `$${val}` },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag> },
            { title: 'Actions', key: 'actions', render: () => (
              <Space>
                <Button type="text" icon={<EditOutlined />} />
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Space>
            )}
          ]} 
          dataSource={[]} 
        />
      </Card>
    </div>
  );
};

export default MasterItemsList;
