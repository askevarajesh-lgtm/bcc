import React, { useEffect, useState } from 'react';
import { Select, Button, Modal, Form, Input, Space, message, Empty } from 'antd';
import { Plus } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../api/seoWorkspaceApi';

const ProjectSelector = ({ value, onChange, style }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await seoWorkspaceApi.getProjects();
      const list = res.data || [];
      setProjects(list);
      if (!value && list.length > 0) {
        onChange(list[0]._id);
      }
    } catch (err) {
      message.error('Failed to load SEO Workspace projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    const values = await form.validateFields();
    setCreating(true);
    try {
      const res = await seoWorkspaceApi.createProject(values);
      message.success('Project created');
      setModalOpen(false);
      form.resetFields();
      await load();
      if (res.data?._id) onChange(res.data._id);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Space style={style}>
        <Select
          loading={loading}
          placeholder="Select a project"
          style={{ minWidth: 260 }}
          value={value}
          onChange={onChange}
          notFoundContent={<Empty description="No projects yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          options={projects.map((p) => ({ value: p._id, label: `${p.name} (${p.domain})` }))}
        />
        <Button icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>New Project</Button>
      </Space>

      <Modal
        title="New SEO Workspace Project"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="Create"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Project name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Acme Corp — Main Site" />
          </Form.Item>
          <Form.Item name="domain" label="Domain" rules={[{ required: true }]}>
            <Input placeholder="e.g. acme.com" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProjectSelector;