import React from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography } from 'antd';

const { Title } = Typography;
const { Option } = Select;

const ProposalForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>{isEditing ? "Edit Proposal" : "Create Proposal"}</Title>
        <Button onClick={() => navigate('..')}>Back</Button>
      </div>
      <Card>
        <Form layout="vertical">
          <Form.Item label="Proposal Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Client" name="clientId" rules={[{ required: true }]}><Select placeholder="Select Client"><Option value="1">Dummy Client</Option></Select></Form.Item>
          <Form.Item label="Master Items" name="masterItems" rules={[{ required: true }]}><Select mode="multiple" placeholder="Select Master Items"><Option value="1">Dummy Item</Option></Select></Form.Item>
          <Form.Item label="Subtotal" name="subtotal" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
          <Form.Item label="Tax" name="tax"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
          <Form.Item label="Discount" name="discount"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
          <Form.Item label="Grand Total" name="grandTotal" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">Save</Button>
            <Button onClick={() => navigate('..')}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default ProposalForm;
