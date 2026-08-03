import React, { useState } from 'react';
import { Select, Button, Modal, Form, Input, Space, Empty, Tag, Tooltip } from 'antd';
import { Plus, Globe, RefreshCw } from 'lucide-react';
import { useSEO } from '../../context/SEOContext';

const ProjectSelector = ({ value, onChange, style, showRefresh = true }) => {
  const { projects, activeProjectId, selectProject, createProject, loading, refreshProjects } = useSEO();
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const currentVal = value !== undefined ? value : activeProjectId;

  const handleSelectChange = (val) => {
    selectProject(val);
    if (onChange) onChange(val);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      const newProj = await createProject(values);
      setModalOpen(false);
      form.resetFields();
      if (onChange && newProj?._id) {
        onChange(newProj._id);
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Space style={style} wrap align="center">
        <Select
          loading={loading}
          placeholder="Select a Workspace Project"
          style={{ minWidth: 280 }}
          value={currentVal || undefined}
          onChange={handleSelectChange}
          showSearch
          optionFilterProp="label"
          notFoundContent={<Empty description="No projects found" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          options={projects.map((p) => ({
            value: p._id,
            label: `${p.name} (${p.domain})`,
            raw: p
          }))}
        />
        <Button 
          icon={<Plus size={14} />} 
          onClick={() => setModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          New Project
        </Button>
        {showRefresh && (
          <Tooltip title="Refresh Workspace Projects">
            <Button 
              icon={<RefreshCw size={14} className={loading ? 'spin' : ''} />} 
              onClick={() => refreshProjects()}
              loading={loading} 
            />
          </Tooltip>
        )}
      </Space>

      <Modal
        title="Create SEO Workspace Project"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="Create Project"
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ languages: 'en' }}>
          <Form.Item 
            name="name" 
            label="Project Name" 
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="e.g. Acme Corp — Global Portal" />
          </Form.Item>
          <Form.Item 
            name="domain" 
            label="Target Website Domain / URL" 
            rules={[{ required: true, message: 'Please enter target domain' }]}
          >
            <Input placeholder="e.g. https://acme.com or acme.com" prefix={<Globe size={14} color="#8c8c8c" />} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProjectSelector;