import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Modal, Form, Input, InputNumber, Select, Tag, Space, message } from 'antd';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getStorageData, setStorageData } from '../utils/storage';
import { formatCurrency } from '../utils/currency';

const { Title } = Typography;
const { Option } = Select;

const EcommerceProducts = () => {
  const [products, setProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  
  const workspaceId = 'default';
  const websiteId = 'default';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const data = getStorageData(workspaceId, websiteId, 'products', []);
    setProducts(data);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    const newProducts = products.filter(p => p.id !== id);
    setStorageData(workspaceId, websiteId, 'products', newProducts);
    setProducts(newProducts);
    message.success('Product deleted');
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      let newProducts;
      if (editingProduct) {
        newProducts = products.map(p => p.id === editingProduct.id ? { ...p, ...values } : p);
        message.success('Product updated');
      } else {
        const newProduct = {
          ...values,
          id: Date.now().toString(),
          image: values.image || 'https://via.placeholder.com/150'
        };
        newProducts = [...products, newProduct];
        message.success('Product added');
      }
      
      setStorageData(workspaceId, websiteId, 'products', newProducts);
      setProducts(newProducts);
      setIsModalVisible(false);
    });
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (img) => <img src={img} alt="product" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (val) => formatCurrency(val, workspaceId, websiteId),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'success' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<Edit size={16} />} size="small" onClick={() => handleEdit(record)} />
          <Button icon={<Trash2 size={16} />} size="small" danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700 }}>Products</Title>
        <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
          Add Product
        </Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={products} 
          rowKey="id" 
        />
      </Card>

      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="price" label="Price" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="stock" label="Stock" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Active">
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Draft">Draft</Option>
            </Select>
          </Form.Item>
          <Form.Item name="image" label="Image URL">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EcommerceProducts;
