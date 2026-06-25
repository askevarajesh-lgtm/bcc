import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Table, Tag, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const MasterItemsList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch('/api/master-items', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else {
        message.error("Failed to fetch master items");
      }
    } catch (error) {
      console.error(error);
      message.error("Error fetching master items");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/master-items/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        message.success("Master item deleted");
        fetchItems();
      } else {
        message.error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error(error);
      message.error("Error deleting master item");
    }
  };

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
            { title: 'Categories', dataIndex: 'categories', key: 'categories', render: (cats) => (
              <Space size={[0, 4]} wrap>
                {cats?.map(c => <Tag key={c.name}>{c.name} ({c.count})</Tag>)}
              </Space>
            ) },
            { title: 'Price', dataIndex: 'price', key: 'price', render: (val) => `₹${val}` },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag> },
            { title: 'Actions', key: 'actions', render: (_, record) => (
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`${record._id}`)} />
                <Popconfirm title="Delete this item?" onConfirm={() => handleDelete(record._id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )}
          ]} 
          dataSource={items} 
          rowKey="_id"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default MasterItemsList;
