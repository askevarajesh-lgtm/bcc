import React, { useEffect, useState } from 'react';
import { Modal, Typography, Form, Input, Select, Button, message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

const { Title } = Typography;
const { Option } = Select;

const CreateProjectModal = ({ open, onClose, onCreate, isViewOnly }) => {
  const [form] = Form.useForm();
  const [agencyClients, setAgencyClients] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && !isViewOnly) {
      workspaceApi.getAgencyClients()
        .then(res => setAgencyClients(res.data.data || res.data || []))
        .catch(err => console.error('Failed to load clients', err));
    }
  }, [open, isViewOnly]);

  const handleFinish = async (values) => {
    try {
      setSubmitting(true);
      await onCreate({
        name: values.name,
        siteUrl: values.siteUrl,
        clientId: values.clientId
      });
      message.success('Project created successfully!');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>Create New SEO Project</Title>}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 24 }}>
        <Form.Item label="Project Name" name="name" rules={[{ required: true, message: 'Please enter a project name' }]}>
          <Input size="large" placeholder="e.g. Acme Corp" style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item label="Website URL" name="siteUrl" rules={[{ required: true, type: 'url', message: 'Please enter a valid URL' }]}>
          <Input size="large" placeholder="https://example.com" style={{ borderRadius: 8 }} />
        </Form.Item>
        {!isViewOnly && (
          <Form.Item name="clientId" label="Assign to Client" rules={[{ required: true, message: 'Please select a client' }]}>
            <Select placeholder="Select a client" size="large">
              {agencyClients.map(client => (
                <Option key={client._id || client.id} value={client._id || client.id}>
                  {client.name || client.companyName || 'Unknown Client'}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
        <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 32 }}>
          <Button onClick={onClose} className="seo-glow-btn-secondary" style={{ marginRight: 12 }}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting} className="seo-glow-btn">Create Project & Start Analysis</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateProjectModal;
