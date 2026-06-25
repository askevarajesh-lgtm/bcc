import React from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography } from 'antd';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MasterItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>{isEditing ? "Edit Master Item" : "Create Master Item"}</Title>
        <Button onClick={() => navigate('..')}>Back</Button>
      </div>
      <Card>
        <Form layout="vertical">
          <Form.Item label="Item Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Item Code" name="itemCode" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Category" name="category"><Input /></Form.Item>
          <Form.Item label="Description" name="description"><TextArea rows={4} /></Form.Item>
          <Form.Item label="Service Price" name="price" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
          <Form.Item label="Tax Percentage" name="taxPercentage"><InputNumber style={{ width: '100%' }} suffix="%" /></Form.Item>
          <Form.Item label="Currency" name="currency"><Input defaultValue="USD" /></Form.Item>
          <Form.Item label="Duration" name="duration"><Input placeholder="e.g., 1 Month" /></Form.Item>
          <Form.Item label="Status" name="status"><Select defaultValue="active"><Option value="active">Active</Option><Option value="inactive">Inactive</Option></Select></Form.Item>
          <Form.Item label="Notes" name="notes"><TextArea rows={2} /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">Save</Button>
            <Button onClick={() => navigate('..')}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default MasterItemForm;
