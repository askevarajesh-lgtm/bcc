import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Alert } from 'antd';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getProducts, updateProduct, createProduct, deleteProduct } from '../utils/storage';
import { formatCurrency } from '../utils/currency';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title } = Typography;
const { Option } = Select;

const EcommerceProducts = () => {
  const [products, setProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  const { workspaceId, websiteId, activeStoreId } = useEcommerce();

  const loadData = async () => {
    if (workspaceId && websiteId && activeStoreId) {
      const data = await getProducts(workspaceId, websiteId, activeStoreId);
      setProducts(data);
    } else {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e) => {
      if (!e.detail?.entity || e.detail?.entity === 'products') loadData();
    };
    const handleStoreChange = () => loadData();
    window.addEventListener('ecommerce_data_updated', handleSync);
    window.addEventListener('ecommerce_store_changed', handleStoreChange);
    return () => {
      window.removeEventListener('ecommerce_data_updated', handleSync);
      window.removeEventListener('ecommerce_store_changed', handleStoreChange);
    };
  }, [workspaceId, websiteId, activeStoreId]);

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

  const handleDelete = async (id) => {
    try {
      await deleteProduct(workspaceId, websiteId, activeStoreId, id);
      message.success('Product deleted');
      loadData();
    } catch (e) {
      message.error('Failed to delete product');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingProduct) {
        const idToUpdate = editingProduct._id || editingProduct.id;
        await updateProduct(workspaceId, websiteId, activeStoreId, idToUpdate, values);
        message.success('Product updated');
      } else {
        await createProduct(workspaceId, websiteId, activeStoreId, values);
        message.success('Product created');
      }
      setIsModalVisible(false);
      loadData();
    } catch (info) {
      const errMsg = info?.response?.data?.message || 'Validation failed';
      message.error(errMsg);
    }
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (img) => <img src={img || 'https://via.placeholder.com/50'} alt="product" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (val) => formatCurrency(val, workspaceId, websiteId, activeStoreId),
    },
    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<Edit size={16} />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  if (!activeStoreId) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="warning"
          message="No Active Store Selected"
          description="Please select or create an Ecommerce store from the Active Store dropdown above to manage products."
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Products</Title>
        <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
          Add Product
        </Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={products} rowKey="id" />
      </Card>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="salePrice" label="Sale Price (optional)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="stock" label="Stock Quantity" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="image" label="Image URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Active">
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Draft">Draft</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EcommerceProducts;
